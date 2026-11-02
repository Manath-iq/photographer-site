import { stories } from './stories.js';
import { icon } from './icons.js';
import { canMove, play, settled, revealDetails, flyPhoto, initializeMotion } from './motion.js';

const grid = document.querySelector('#story-grid');
const dialog = document.querySelector('#story-dialog');
const galleryGrid = document.querySelector('#gallery-grid');
const menu = document.querySelector('#mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let previousFocus;
const mainContent = document.querySelector('main');
const siteFooter = document.querySelector('.site-footer');

grid.innerHTML = stories.map((story) => `
  <article class="story-card story-card--${story.size} reveal" data-category="${story.category}">
    <button class="story-image" data-story="${story.id}" type="button" aria-label="Посмотреть историю «${story.title}»">
      <img src="${story.coverUrl}" alt="${story.coverAlt}" width="640" height="960" loading="lazy" />
      <span class="story-open">Смотреть историю <span aria-hidden="true">${icon()}</span></span>
      <span class="story-handnote" aria-hidden="true">${story.note}</span>
    </button>
    <div class="story-meta"><div><span class="small-label">${story.label}</span><h3><button data-story="${story.id}" type="button">${story.title}</button></h3></div><span class="story-number">[ ${story.number} ]</span></div>
  </article>
`).join('');

function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Открыть меню');
  menu.inert = true;
  mainContent.inert = false;
  siteFooter.inert = false;
  document.body.classList.remove('menu-open');
}

menuToggle.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(expanded));
  menuToggle.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
  menu.inert = !expanded;
  mainContent.inert = expanded;
  siteFooter.inert = expanded;
  document.body.classList.toggle('menu-open', expanded);
});
menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
  if (event.key === 'Tab' && menuToggle.getAttribute('aria-expanded') === 'true') {
    const focusable = [menuToggle, ...menu.querySelectorAll('a')];
    const current = focusable.indexOf(document.activeElement);
    if (event.shiftKey && current === 0) { event.preventDefault(); focusable.at(-1).focus(); }
    if (!event.shiftKey && current === focusable.length - 1) { event.preventDefault(); menuToggle.focus(); }
  }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealDetails(entry.target);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.documentElement.classList.add('motion-ready');

let filterRevision = 0;
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', async (event) => {
    if (button.getAttribute('aria-pressed') === 'true') return;
    const revision = ++filterRevision;
    const filter = button.dataset.filter;
    const cards = [...grid.querySelectorAll('.story-card')];
    cards.forEach((card) => card.getAnimations().forEach((effect) => effect.cancel()));
    const before = new Map(cards.filter((card) => !card.hidden).map((card) => [card, card.getBoundingClientRect()]));
    const visible = (card) => filter === 'all' || card.dataset.category === filter;
    document.querySelectorAll('[data-filter]').forEach((filterButton) => filterButton.setAttribute('aria-pressed', String(filterButton === button)));
    if (canMove(event)) {
      await Promise.all(cards.filter((card) => !card.hidden && !visible(card)).map((card) => settled(play(card, [
        { opacity: 1, transform: 'translateY(0) scale(1)' },
        { opacity: 0, transform: 'translateY(8px) scale(.98)' },
      ], { duration: 130 }))));
    }
    if (revision !== filterRevision) return;
    grid.dataset.filtered = String(filter !== 'all');
    let visibleCount = 0;
    cards.forEach((card) => {
      card.hidden = !visible(card);
      if (!card.hidden) { visibleCount++; card.classList.add('is-visible'); }
    });
    cards.filter((card) => !card.hidden).forEach((card, index) => {
      if (!canMove(event)) return;
      const old = before.get(card);
      const next = card.getBoundingClientRect();
      if (old) play(card, [
        { transform: `translate(${old.left - next.left}px, ${old.top - next.top}px) scale(${old.width / next.width}, ${old.height / next.height})`, transformOrigin: '0 0' },
        { transform: 'translate(0, 0) scale(1)', transformOrigin: '0 0' },
      ], { duration: 280 });
      else play(card, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250, delay: index * 50 });
    });
    document.querySelector('#filter-status').textContent = `Показано историй: ${visibleCount}`;
  });
});

let galleryObserver;
function openStory(id, trigger, event) {
  const story = stories.find((item) => item.id === id);
  if (!story) return;
  previousFocus = document.activeElement;
  document.querySelector('#gallery-title').textContent = story.title;
  document.querySelector('#gallery-description').textContent = story.description;
  const source = trigger.querySelector('img') || trigger.closest('.story-card')?.querySelector('img');
  const photos = [...story.photos];
  const selected = photos.indexOf(source?.src);
  if (selected > 0) photos.unshift(...photos.splice(selected, 1));
  galleryGrid.innerHTML = photos.map((src, index) => `<figure><img src="${src}" alt="${story.title} — фотография ${index + 1} из ${photos.length}" width="640" height="960" ${index > 1 ? 'loading="lazy"' : ''} /><figcaption>${String(index + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}</figcaption></figure>`).join('');
  delete dialog.dataset.closing;
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
  if (canMove(event)) {
    play(document.querySelector('.gallery-header'), [{ opacity: 0, transform: 'translateY(-10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250 });
    if (source) flyPhoto(source, galleryGrid.querySelector('img'), dialog);
    else play(dialog, [{ opacity: 0, transform: 'translateY(20px) scale(.97)' }, { opacity: 1, transform: 'translateY(0) scale(1)' }], { duration: 250 });
    galleryObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) {
        play(entry.target, [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300 });
        galleryObserver.unobserve(entry.target);
      }
    }), { root: dialog, threshold: .08 });
    [...galleryGrid.children].slice(1).forEach((figure) => galleryObserver.observe(figure));
  }
}

async function closeStory(event) {
  if (!dialog.open || dialog.dataset.closing) return;
  dialog.dataset.closing = 'true';
  if (canMove(event)) await settled(play(dialog, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(.985)' }], { duration: 160 }));
  dialog.close();
}
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-story]');
  if (trigger) openStory(trigger.dataset.story, trigger, event);
});
document.querySelector('.gallery-close').addEventListener('click', closeStory);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeStory(event); });
dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeStory(event); });
dialog.addEventListener('close', () => {
  galleryObserver?.disconnect();
  delete dialog.dataset.closing;
  document.body.classList.remove('dialog-open');
  previousFocus?.focus({ preventScroll: true });
});
document.querySelector('#gallery-contact').addEventListener('click', closeStory);

const accordionState = new WeakMap();
async function toggleDetail(detail, open, event) {
  const previous = accordionState.get(detail);
  const startHeight = detail.getBoundingClientRect().height;
  previous?.effect?.cancel();
  const state = { open, effect: null };
  accordionState.set(detail, state);
  if (!canMove(event)) { detail.open = open; detail.style.removeProperty('overflow'); return; }
  detail.open = true;
  const endHeight = open ? detail.getBoundingClientRect().height : detail.querySelector('summary').getBoundingClientRect().height + 1;
  detail.style.overflow = 'hidden';
  state.effect = play(detail, [{ height: `${startHeight}px` }, { height: `${endHeight}px` }], { duration: 200 });
  if (open) play(detail.querySelector('.detail-content'), [{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 200 });
  await settled(state.effect);
  if (accordionState.get(detail) !== state) return;
  detail.open = open;
  detail.style.removeProperty('overflow');
}
document.querySelectorAll('.shoot-row').forEach((detail) => {
  detail.querySelector('summary').addEventListener('click', (event) => {
    event.preventDefault();
    const open = !(accordionState.get(detail)?.open ?? detail.open);
    if (open) document.querySelectorAll('.shoot-row').forEach((other) => {
      if (other !== detail && (accordionState.get(other)?.open ?? other.open)) toggleDetail(other, false, event);
    });
    toggleDetail(detail, open, event);
  });
});

const designDialog = document.querySelector('#design-dialog');
document.querySelector('#design-toggle').addEventListener('click', () => designDialog.showModal());
designDialog.addEventListener('click', (event) => { if (event.target === designDialog) designDialog.close(); });
document.querySelector('#paper-color').addEventListener('change', (event) => {
  document.documentElement.dataset.paper = event.target.value;
});
const motionControl = document.querySelector('#motion-control');
motionControl.checked = !reducedMotion.matches;
motionControl.addEventListener('change', () => document.documentElement.classList.toggle('no-motion', !motionControl.checked));
reducedMotion.addEventListener('change', (event) => {
  motionControl.checked = !event.matches;
  document.documentElement.classList.toggle('no-motion', event.matches);
});
if (reducedMotion.matches) document.documentElement.classList.add('no-motion');
document.querySelector('#year').textContent = new Date().getFullYear();
initializeMotion();
