/* World choropleth map using TopoJSON world-atlas (CC0) loaded from
   jsdelivr at runtime. Produces a real Mercator-projected SVG map with
   country borders, coloured by visit count.

   Footprint: ~10 KB topojson-client + ~85 KB countries-110m.json,
   fetched once and cached by the browser. No build step, no D3.

   Usage:
     await window.WorldMap.render('container-id', { US: 233, CN: 41, ... });

   The data object uses ISO 3166-1 alpha-2 codes; we map them to the
   numeric IDs that world-atlas uses internally.
*/
(function () {
  'use strict';

  const TOPO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
  const TOPOJSON_LIB = 'https://cdn.jsdelivr.net/npm/topojson-client@3/dist/topojson-client.min.js';

  // ISO 3166-1 alpha-2 → numeric (3-digit). Covers ~250 territories.
  // Source: ISO 3166-1 (public domain). Trimmed to those world-atlas knows.
  const ISO2_TO_NUM = {
    AD:'020',AE:'784',AF:'004',AG:'028',AL:'008',AM:'051',AO:'024',AR:'032',AT:'040',AU:'036',
    AZ:'031',BA:'070',BB:'052',BD:'050',BE:'056',BF:'854',BG:'100',BH:'048',BI:'108',BJ:'204',
    BN:'096',BO:'068',BR:'076',BS:'044',BT:'064',BW:'072',BY:'112',BZ:'084',CA:'124',CD:'180',
    CF:'140',CG:'178',CH:'756',CI:'384',CL:'152',CM:'120',CN:'156',CO:'170',CR:'188',CU:'192',
    CV:'132',CY:'196',CZ:'203',DE:'276',DJ:'262',DK:'208',DM:'212',DO:'214',DZ:'012',EC:'218',
    EE:'233',EG:'818',EH:'732',ER:'232',ES:'724',ET:'231',FI:'246',FJ:'242',FK:'238',FR:'250',
    GA:'266',GB:'826',GE:'268',GF:'254',GH:'288',GL:'304',GM:'270',GN:'324',GQ:'226',GR:'300',
    GT:'320',GW:'624',GY:'328',HK:'344',HN:'340',HR:'191',HT:'332',HU:'348',ID:'360',IE:'372',
    IL:'376',IN:'356',IQ:'368',IR:'364',IS:'352',IT:'380',JM:'388',JO:'400',JP:'392',KE:'404',
    KG:'417',KH:'116',KP:'408',KR:'410',KW:'414',KZ:'398',LA:'418',LB:'422',LK:'144',LR:'430',
    LS:'426',LT:'440',LU:'442',LV:'428',LY:'434',MA:'504',MD:'498',ME:'499',MG:'450',MK:'807',
    ML:'466',MM:'104',MN:'496',MR:'478',MW:'454',MX:'484',MY:'458',MZ:'508',NA:'516',NC:'540',
    NE:'562',NG:'566',NI:'558',NL:'528',NO:'578',NP:'524',NZ:'554',OM:'512',PA:'591',PE:'604',
    PG:'598',PH:'608',PK:'586',PL:'616',PR:'630',PS:'275',PT:'620',PY:'600',QA:'634',RO:'642',
    RS:'688',RU:'643',RW:'646',SA:'682',SB:'090',SD:'729',SE:'752',SG:'702',SI:'705',SK:'703',
    SL:'694',SN:'686',SO:'706',SR:'740',SS:'728',SV:'222',SY:'760',SZ:'748',TD:'148',TF:'260',
    TG:'768',TH:'764',TJ:'762',TL:'626',TM:'795',TN:'788',TR:'792',TT:'780',TW:'158',TZ:'834',
    UA:'804',UG:'800',US:'840',UY:'858',UZ:'860',VE:'862',VN:'704',VU:'548',YE:'887',ZA:'710',
    ZM:'894',ZW:'716',
  };

  const NUM_TO_ISO2 = Object.fromEntries(Object.entries(ISO2_TO_NUM).map(([k, v]) => [v, k]));

  let topoCache = null;
  let scriptLoadPromise = null;

  function loadScript(src) {
    if (window.topojson) return Promise.resolve();
    if (scriptLoadPromise) return scriptLoadPromise;
    scriptLoadPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('topojson_load_failed'));
      document.head.appendChild(s);
    });
    return scriptLoadPromise;
  }

  async function loadTopo() {
    if (topoCache) return topoCache;
    await loadScript(TOPOJSON_LIB);
    const r = await fetch(TOPO_URL);
    if (!r.ok) throw new Error('topo_fetch_failed:' + r.status);
    const world = await r.json();
    const features = window.topojson.feature(world, world.objects.countries).features;
    topoCache = features;
    return features;
  }

  /* Equirectangular projection — flat, simple, looks like the WP Stats
     reference screenshot. Mercator distorts polar regions but is more
     web-mappy; equirectangular reads better at this small size. */
  function project(lng, lat, w, h) {
    const x = ((lng + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    return [x, y];
  }

  function geomToPath(geometry, w, h) {
    if (!geometry) return '';
    const out = [];
    /* Walk a single ring (Polygon outer / hole / MultiPolygon piece).
       Antimeridian-aware: when two consecutive points jump > 180° in
       longitude (e.g. Russia's east edge at +179° followed by a point
       at -179°), naive projection draws a straight line across the
       whole map, producing a black horizontal stripe through Africa.
       We detect that jump and start a new M sub-path so the line
       breaks at the dateline instead of leaping across the world. */
    function ring(pts) {
      if (!pts || pts.length < 2) return;
      let prevLng = null;
      for (let i = 0; i < pts.length; i++) {
        const lng = pts[i][0];
        const lat = pts[i][1];
        const [x, y] = project(lng, lat, w, h);
        const xy = x.toFixed(1) + ',' + y.toFixed(1);
        const crossesDateline = (prevLng !== null && Math.abs(lng - prevLng) > 180);
        if (i === 0 || crossesDateline) {
          out.push('M' + xy);
        } else {
          out.push('L' + xy);
        }
        prevLng = lng;
      }
      out.push('Z');
    }
    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach(ring);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach((poly) => poly.forEach(ring));
    }
    return out.join(' ');
  }

  /* Heat colour ramp: greys for unmapped, soft → strong blue for mapped.
     Returns CSS rgb / rgba string. */
  function heatColor(hits, max) {
    if (!hits || max <= 0) return '#e9ecef';
    const t = Math.min(1, hits / max);
    // Quadratic ramp so a few outliers don't wash out everyone else.
    const eased = Math.pow(t, 0.55);
    const alpha = (0.18 + eased * 0.82).toFixed(2);
    return `rgba(11, 58, 130, ${alpha})`;
  }

  async function render(containerId, dataByIso2) {
    const host = document.getElementById(containerId);
    if (!host) return;
    host.innerHTML = `<div style="padding:60px 20px; text-align:center; color:#5c5e62; font-size:13px;">正在加载世界地图…</div>`;

    let features;
    try { features = await loadTopo(); }
    catch (err) {
      host.innerHTML = `<div style="padding:24px; text-align:center; color:#dc2626; font-size:13px;">
        地图数据加载失败：${err.message}<br>
        <span style="color:#5c5e62; font-size:12px;">可能 CSP 拦截了 cdn.jsdelivr.net，请检查 connect-src。</span>
      </div>`;
      return;
    }

    const W = 1000, H = 500;
    const max = Math.max(0, ...Object.values(dataByIso2 || {}));

    // Build paths once.
    const paths = features.map((f) => {
      const numId = String(f.id).padStart(3, '0');
      const iso2 = NUM_TO_ISO2[numId] || '';
      const hits = (iso2 && dataByIso2[iso2]) || 0;
      const fill = heatColor(hits, max);
      const d = geomToPath(f.geometry, W, H);
      const name = (f.properties && f.properties.name) || iso2 || '';
      return `<path d="${d}" fill="${fill}" stroke="#cfd4dc" stroke-width="0.4"
                   data-iso2="${iso2}" data-num="${numId}" data-hits="${hits}" data-name="${name.replace(/"/g, '&quot;')}"/>`;
    }).join('');

    host.innerHTML = `
      <div class="wm-shell">
        <svg class="wm-svg" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
          <rect width="${W}" height="${H}" fill="#fafbfc"/>
          ${paths}
        </svg>
        <div class="wm-tooltip" data-tooltip></div>
        <div class="wm-legend">
          <span class="wm-legend__label">0</span>
          <div class="wm-legend__bar"></div>
          <span class="wm-legend__label">${max.toLocaleString()}</span>
        </div>
      </div>
    `;

    bindHover(host);
  }

  function bindHover(host) {
    const svg = host.querySelector('.wm-svg');
    const tip = host.querySelector('[data-tooltip]');
    if (!svg || !tip) return;
    svg.addEventListener('mousemove', (ev) => {
      const target = ev.target.closest('path[data-iso2]');
      if (!target) { tip.style.display = 'none'; return; }
      const name = target.getAttribute('data-name') || '?';
      const iso2 = target.getAttribute('data-iso2') || '';
      const hits = parseInt(target.getAttribute('data-hits') || '0', 10);
      tip.style.display = 'block';
      const r = host.getBoundingClientRect();
      tip.style.left = (ev.clientX - r.left + 12) + 'px';
      tip.style.top  = (ev.clientY - r.top  + 12) + 'px';
      tip.innerHTML = `<strong>${name}</strong>${iso2 ? ' <code>' + iso2 + '</code>' : ''}<br><span>${hits.toLocaleString()} 次访问</span>`;
    });
    svg.addEventListener('mouseleave', () => { tip.style.display = 'none'; });
  }

  window.WorldMap = { render };
})();
