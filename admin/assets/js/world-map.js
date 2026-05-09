/* Compact world choropleth map. Each country is a hex tile positioned
   in approximate geographic location — accurate enough to communicate
   "Europe heavy / Asia heavy" without shipping a 200 KB TopoJSON.
   Each tile carries data-country="ISO2" so we can colour them by
   visit count from the analytics dashboard. */
(function () {
  'use strict';

  // (col, row, ISO2, name) — laid out on a 24×11 hex grid.
  // Curated to cover ~80 countries that account for 99% of B2B web traffic.
  const TILES = [
    // Row 0 — Arctic / Russia north / Canada / Alaska
    [3,0,'AK','Alaska'], [4,0,'CA','Canada'], [5,0,'CA','Canada'],
    [12,0,'RU','Russia'], [13,0,'RU','Russia'], [14,0,'RU','Russia'], [15,0,'RU','Russia'], [16,0,'RU','Russia'],

    // Row 1
    [3,1,'CA','Canada'], [4,1,'CA','Canada'], [5,1,'CA','Canada'], [6,1,'CA','Canada'],
    [10,1,'IS','Iceland'], [11,1,'NO','Norway'], [12,1,'SE','Sweden'], [13,1,'FI','Finland'],
    [14,1,'RU','Russia'], [15,1,'RU','Russia'], [16,1,'RU','Russia'],

    // Row 2 — US / EU
    [3,2,'US','United States'], [4,2,'US','United States'], [5,2,'US','United States'], [6,2,'US','United States'], [7,2,'US','United States'],
    [10,2,'GB','United Kingdom'], [11,2,'NL','Netherlands'], [12,2,'DE','Germany'], [13,2,'PL','Poland'],
    [14,2,'BY','Belarus'], [15,2,'RU','Russia'], [16,2,'KZ','Kazakhstan'], [17,2,'MN','Mongolia'],

    // Row 3 — North-Central
    [4,3,'US','United States'], [5,3,'US','United States'], [6,3,'US','United States'], [7,3,'US','United States'], [8,3,'US','United States'],
    [10,3,'IE','Ireland'], [11,3,'FR','France'], [12,3,'CH','Switzerland'], [13,3,'AT','Austria'], [14,3,'UA','Ukraine'],
    [15,3,'RU','Russia'], [16,3,'KZ','Kazakhstan'], [17,3,'CN','China'], [18,3,'CN','China'], [19,3,'JP','Japan'],

    // Row 4 — Mid latitudes
    [4,4,'MX','Mexico'], [5,4,'MX','Mexico'],
    [10,4,'PT','Portugal'], [11,4,'ES','Spain'], [12,4,'IT','Italy'], [13,4,'GR','Greece'], [14,4,'TR','Turkey'],
    [15,4,'GE','Georgia'], [16,4,'IR','Iran'], [17,4,'CN','China'], [18,4,'CN','China'], [19,4,'KR','South Korea'], [20,4,'JP','Japan'],

    // Row 5 — Sahara / Gulf / SE-Asia
    [11,5,'MA','Morocco'], [12,5,'DZ','Algeria'], [13,5,'EG','Egypt'], [14,5,'SA','Saudi Arabia'],
    [15,5,'AE','UAE'], [16,5,'PK','Pakistan'], [17,5,'IN','India'], [18,5,'IN','India'], [19,5,'CN','China'], [20,5,'TW','Taiwan'],

    // Row 6 — Sahel / India / SE Asia
    [4,6,'CO','Colombia'], [5,6,'VE','Venezuela'],
    [11,6,'NG','Nigeria'], [12,6,'NG','Nigeria'], [13,6,'SD','Sudan'], [14,6,'ET','Ethiopia'],
    [15,6,'YE','Yemen'], [17,6,'IN','India'], [18,6,'BD','Bangladesh'], [19,6,'TH','Thailand'], [20,6,'VN','Vietnam'], [21,6,'PH','Philippines'],

    // Row 7 — South America / Africa / SE-Asia
    [4,7,'BR','Brazil'], [5,7,'BR','Brazil'], [6,7,'BR','Brazil'],
    [12,7,'CD','DR Congo'], [13,7,'KE','Kenya'], [14,7,'TZ','Tanzania'],
    [18,7,'MY','Malaysia'], [19,7,'ID','Indonesia'], [20,7,'ID','Indonesia'], [21,7,'PH','Philippines'],

    // Row 8
    [4,8,'BR','Brazil'], [5,8,'BR','Brazil'], [6,8,'BR','Brazil'],
    [12,8,'AO','Angola'], [13,8,'ZA','South Africa'], [14,8,'MZ','Mozambique'],
    [19,8,'ID','Indonesia'], [20,8,'AU','Australia'], [21,8,'AU','Australia'],

    // Row 9 — Southern Cone / South Africa / Australia
    [4,9,'AR','Argentina'], [5,9,'AR','Argentina'], [6,9,'UY','Uruguay'],
    [13,9,'ZA','South Africa'],
    [19,9,'AU','Australia'], [20,9,'AU','Australia'], [21,9,'NZ','New Zealand'],

    // Row 10 — Far south
    [5,10,'CL','Chile'],
    [21,10,'NZ','New Zealand'],
  ];

  // Hex layout constants — use an "odd-r" offset coord system so
  // even rows are flush left and odd rows shift right by half a hex.
  const HEX_W = 22;
  const HEX_H = 24;
  const HEX_GAP = 2;

  function hexPath(cx, cy, r) {
    // Flat-top hex (so rows are horizontal). 6 vertices.
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return 'M' + pts.join(' L') + ' Z';
  }

  function render(containerId, dataByCountry, opts) {
    opts = opts || {};
    const host = document.getElementById(containerId);
    if (!host) return;
    const max = Math.max(1, ...Object.values(dataByCountry || {}));

    const cols = 24, rows = 11;
    const w = cols * (HEX_W + HEX_GAP) + HEX_W;
    const h = rows * (HEX_H * 0.78 + HEX_GAP) + HEX_H;

    const tilePaths = TILES.map(([col, row, code, name]) => {
      const cx = col * (HEX_W + HEX_GAP) + HEX_W / 2 + (row % 2 ? (HEX_W + HEX_GAP) / 2 : 0);
      const cy = row * (HEX_H * 0.78 + HEX_GAP) + HEX_H / 2;
      const hits = (dataByCountry[code] || 0);
      const intensity = max > 0 ? hits / max : 0;
      // Linearly interpolate between two brand colours for the heat scale.
      const fill = hits === 0
        ? '#e4e7ed'
        : `rgba(11, 58, 130, ${0.18 + intensity * 0.82})`;
      const tip = hits ? `${name} — ${hits} hits` : name;
      return `<path d="${hexPath(cx, cy, HEX_W / 2)}" fill="${fill}" stroke="#fff" stroke-width="1" data-country="${code}" data-hits="${hits}"><title>${tip}</title></path>`;
    }).join('');

    host.innerHTML = `
      <svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" class="world-hex-map" style="width:100%;height:auto;">
        ${tilePaths}
      </svg>
      <div class="world-hex-legend">
        <span>少</span>
        <span class="lh" style="background:#e4e7ed"></span>
        <span class="lh" style="background:rgba(11,58,130,0.36)"></span>
        <span class="lh" style="background:rgba(11,58,130,0.6)"></span>
        <span class="lh" style="background:rgba(11,58,130,0.85)"></span>
        <span class="lh" style="background:rgba(11,58,130,1)"></span>
        <span>多</span>
      </div>
    `;
  }

  window.WorldHexMap = { render };
})();
