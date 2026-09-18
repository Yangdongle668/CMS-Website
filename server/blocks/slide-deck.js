// Horizontal card slider.
//
// The homepage's application carousel. It is a typed block rather than a
// rich_text copy of the markup because the arrows are <button>s, and buttons in
// operator-authored prose are a phishing surface the sanitiser refuses — which
// is the right refusal. A block owns its own controls, so the operator supplies
// content and the markup comes from here.

const imageRender = require('../services/image-render');

module.exports = {
  type: 'slide_deck',
  label: '横向卡片滑块',
  description: '可左右滑动的大图卡片，用于首页应用展示',
  icon: 'columns',

  schema: {
    eyebrow: { type: 'text', label: '眉标', max: 120 },
    title: { type: 'text', label: '标题', max: 200 },
    intro: { type: 'textarea', label: '引导语', max: 400 },
    slides: {
      type: 'repeater',
      label: '卡片',
      min: 1,
      max: 20,
      itemLabel: 'title',
      fields: {
        label: { type: 'text', label: '角标', max: 120 },
        title: { type: 'text', label: '标题', max: 120, required: true },
        sub: { type: 'textarea', label: '说明', max: 400 },
        image: { type: 'image', label: '背景图' },
        link: { type: 'url', label: '链接', max: 500 },
        cta_primary: { type: 'text', label: '主按钮文字', max: 60 },
        cta_secondary: { type: 'text', label: '次按钮文字', max: 60 },
      },
    },
  },

  render(data, ctx) {
    const slides = (data.slides || []).filter((s) => s && s.title);
    if (!slides.length) return '';
    return `<section class="block block--slider" data-block="slide_deck">
  <div class="block__inner">
    ${data.eyebrow ? `<span class="eyebrow">${ctx.esc(data.eyebrow)}</span>` : ''}
    ${data.title ? `<h2 class="block__title">${ctx.esc(data.title)}</h2>` : ''}
    ${data.intro ? `<p class="lead">${ctx.esc(data.intro)}</p>` : ''}
    <div class="tesla-slider" data-slider>
      <button type="button" class="tesla-slider__arrow tesla-slider__arrow--prev" aria-label="Previous">‹</button>
      <button type="button" class="tesla-slider__arrow tesla-slider__arrow--next" aria-label="Next">›</button>
      <div class="tesla-slider__track" data-slider-track>
        ${slides
          .map((s) => {
            const href = ctx.safeUrl(s.link || '') || '#';
            const bg = s.image
              ? ` style="${ctx.escAttr(imageRender.backgroundImageSet(s.image, { width: 1280 }))} background-size:cover; background-position:center;"`
              : '';
            const ctas = [
              s.cta_primary ? `<span class="tesla-slide__cta tesla-slide__cta--primary">${ctx.esc(s.cta_primary)}</span>` : '',
              s.cta_secondary ? `<span class="tesla-slide__cta tesla-slide__cta--secondary">${ctx.esc(s.cta_secondary)}</span>` : '',
            ].filter(Boolean).join('');
            return `<a class="tesla-slide" href="${ctx.escAttr(href)}"${bg}>
          ${s.label ? `<div class="tesla-slide__label">${ctx.esc(s.label)}</div>` : ''}
          <div class="tesla-slide__bottom">
            <h3 class="tesla-slide__title">${ctx.esc(s.title)}</h3>
            ${s.sub ? `<span class="tesla-slide__sub">${ctx.esc(s.sub)}</span>` : ''}
            ${ctas ? `<div class="tesla-slide__ctas">${ctas}</div>` : ''}
          </div>
        </a>`;
          })
          .join('\n        ')}
      </div>
    </div>
  </div>
</section>`;
  },
};
