/* ============================================================
   SINGULAR — carousel.js
   Carrosséis de cards no mobile com Embla Carousel.
   Mantém o visual original: dots hexagonais + foco central
   (scale/opacity). Ativo apenas em telas <= 880px.
   ============================================================ */
import EmblaCarousel from 'embla-carousel'

const MOBILE = '(max-width: 880px)'
const mq = window.matchMedia(MOBILE)
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const instances = []

document.querySelectorAll('[data-carousel]').forEach((grid) => {
  grid.classList.add('car')

  // Estrutura exigida pela Embla: viewport > container(.car) > slides
  const viewport = document.createElement('div')
  viewport.className = 'embla'
  grid.parentNode.insertBefore(viewport, grid)
  viewport.appendChild(grid)

  // Dots (irmãos do viewport, fora do overflow)
  const dots = document.createElement('div')
  dots.className = 'car-dots'
  viewport.parentNode.insertBefore(dots, viewport.nextSibling)

  const embla = EmblaCarousel(viewport, {
    active: false, // desktop: desligado (grid normal)
    align: 'center',
    containScroll: 'trimSnaps',
    skipSnaps: false,
    duration: reduce ? 0 : 22,
    breakpoints: {
      [MOBILE]: { active: true }, // mobile: carrossel
    },
  })

  const item = { embla, viewport, grid, dots, slides: [] }
  instances.push(item)

  embla.on('init', () => buildDots(item))
  embla.on('reInit', () => {
    buildDots(item)
    selectDot(item)
    focus(item)
  })
  embla.on('select', () => selectDot(item))
  embla.on('scroll', () => focus(item))
  embla.on('settle', () => focus(item))

  buildDots(item)
  selectDot(item)
  focus(item)
})

function buildDots(item) {
  item.slides = item.embla.slideNodes()
  item.dots.innerHTML = ''
  item.embla.scrollSnapList().forEach((_, i) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.setAttribute('aria-label', 'Ir para o item ' + (i + 1))
    b.addEventListener('click', () => item.embla.scrollTo(i))
    item.dots.appendChild(b)
  })
}

function selectDot(item) {
  const sel = item.embla.selectedScrollSnap()
  Array.prototype.forEach.call(item.dots.children, (b, i) => {
    b.classList.toggle('on', i === sel)
  })
}

/* Efeito de foco central: o card mais próximo do centro fica
   em escala/opacidade plenas; os vizinhos recuam. Usa rects de
   tela (robusto ao transform aplicado pela Embla no container). */
function focus(item) {
  if (!mq.matches) {
    item.slides.forEach((s) => {
      s.style.transform = ''
      s.style.opacity = ''
    })
    return
  }
  if (reduce) return

  const vp = item.viewport.getBoundingClientRect()
  const center = vp.left + vp.width / 2
  const reach = Math.max(vp.width * 0.9, 1)

  item.slides.forEach((s) => {
    const r = s.getBoundingClientRect()
    const c = r.left + r.width / 2
    const t = Math.min(Math.abs(c - center) / reach, 1)
    s.style.transform =
      'scale(' + (1 - t * 0.07).toFixed(3) + ') translateY(' + (t * 6).toFixed(1) + 'px)'
    s.style.opacity = (1 - t * 0.42).toFixed(3)
  })
}

/* Recalcula ao cruzar o breakpoint (a Embla liga/desliga sozinha
   via ResizeObserver, mas garantimos o reInit + limpeza). */
function onBreakpoint() {
  instances.forEach((item) => {
    item.embla.reInit()
    focus(item)
  })
}
if (mq.addEventListener) mq.addEventListener('change', onBreakpoint)
else mq.addListener(onBreakpoint)
