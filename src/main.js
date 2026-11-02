import { stories } from './stories.js';

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
      <span class="story-open">Смотреть историю <span aria-hidden="true">↗</span></span>
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
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.documentElement.classList.add('motion-ready');

document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((filterButton) => filterButton.setAttribute('aria-pressed', String(filterButton === button)));
    grid.dataset.filtered = String(filter !== 'all');
    let visibleCount = 0;
    grid.querySelectorAll('.story-card').forEach((card) => {
      const visible = filter === 'all' || card.dataset.category === filter;
      card.hidden = !visible;
      if (visible) { visibleCount++; card.classList.add('is-visible'); }
    });
    document.querySelector('#filter-status').textContent = `Показано историй: ${visibleCount}`;
  });
});

function openStory(id) {
  const story = stories.find((item) => item.id === id);
  if (!story) return;
  previousFocus = document.activeElement;
  document.querySelector('#gallery-title').textContent = story.title;
  document.querySelector('#gallery-description').textContent = story.description;
  galleryGrid.innerHTML = story.photos.map((src, index) => `<figure><img src="${src}" alt="${story.title} — фотография ${index + 1} из ${story.photos.length}" width="640" height="960" ${index > 1 ? 'loading="lazy"' : ''} /><figcaption>${String(index + 1).padStart(2, '0')} / ${String(story.photos.length).padStart(2, '0')}</figcaption></figure>`).join('');
  dialog.showModal();
  dialog.scrollTop = 0;
  document.body.classList.add('dialog-open');
}

function closeStory() { dialog.close(); }
document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-story]');
  if (trigger) openStory(trigger.dataset.story);
});
document.querySelector('.gallery-close').addEventListener('click', closeStory);
dialog.addEventListener('click', (event) => { if (event.target === dialog) closeStory(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  previousFocus?.focus({ preventScroll: true });
});
document.querySelector('#gallery-contact').addEventListener('click', () => {
  closeStory();
  window.location.hash = 'contact';
});

document.querySelectorAll('.shoot-row').forEach((detail) => {
  detail.addEventListener('toggle', () => {
    if (detail.open) document.querySelectorAll('.shoot-row').forEach((other) => { if (other !== detail) other.open = false; });
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
