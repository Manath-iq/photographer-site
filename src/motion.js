const root = document.documentElement;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const effects = new Set();
const resets = new Set();
const easing = getComputedStyle(root).getPropertyValue('--ease').trim();

export function canMove(event) {
  return !reducedMotion.matches && !root.classList.contains('no-motion')
    && event?.detail !== 0 && event?.type !== 'cancel' && !(event instanceof KeyboardEvent);
}

export function play(element, frames, options = {}) {
  if (!element || !canMove() || !element.animate) return null;
  const effect = element.animate(frames, { duration: 250, easing, ...options });
  effects.add(effect);
  effect.finished.then(() => effects.delete(effect), () => effects.delete(effect));
  return effect;
}

export const settled = (effect) => effect?.finished.catch(() => {}) ?? Promise.resolve();

export function revealDetails(element) {
  if (!canMove()) return;
  const image = element.querySelector('.story-image img');
  if (image) play(image, [
    { transform: 'scale(1.06)', clipPath: 'inset(0 0 8% 0)' },
    { transform: 'scale(1)', clipPath: 'inset(0)' },
  ], { duration: 700 });
  const polaroid = element.querySelector('.about-polaroid');
  if (polaroid) play(polaroid, [
    { transform: 'translateY(24px) rotate(-12deg)' },
    { transform: 'translateY(0) rotate(-7deg)' },
  ], { duration: 700 });
  const asterisk = element.querySelector('.asterisk .icon');
  if (asterisk) play(asterisk, [{ transform: 'rotate(-35deg)' }, { transform: 'rotate(0)' }], { duration: 700 });
  const snapshot = element.querySelector('.contact-snapshot');
  if (snapshot) play(snapshot, [
    { transform: 'translateY(30px) rotate(19deg)', opacity: 0 },
    { transform: 'translateY(0) rotate(11deg)', opacity: 1 },
  ], { duration: 650, delay: 80 });
  const amount = element.querySelector('.price-amount');
  if (amount) play(amount, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 250, delay: 80 });
}

export async function flyPhoto(source, target, dialog) {
  if (!source || !target || !canMove()) return;
  const from = source.getBoundingClientRect();
  if (from.bottom < 0 || from.top > innerHeight || !from.width) return;
  await target.decode().catch(() => {});
  if (!dialog.open || !canMove()) return;
  const to = target.getBoundingClientRect();
  if (!to.width || !to.height) return;
  const photo = source.cloneNode();
  photo.className = 'gallery-flight';
  photo.alt = '';
  photo.setAttribute('aria-hidden', 'true');
  Object.assign(photo.style, { left: `${to.left}px`, top: `${to.top}px`, width: `${to.width}px`, height: `${to.height}px` });
  target.style.opacity = '0';
  dialog.append(photo);
  try {
    await settled(play(photo, [
      { transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})` },
      { transform: 'translate(0, 0) scale(1)' },
    ], { duration: 300 }));
  } finally {
    target.style.removeProperty('opacity');
    photo.remove();
  }
}

function springPointer(element, render, maximum = 5) {
  let frame = 0;
  let x = 0, y = 0, vx = 0, vy = 0, tx = 0, ty = 0, lastTime = 0;
  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0; x = 0; y = 0; vx = 0; vy = 0; tx = 0; ty = 0;
    element.style.removeProperty('transform');
  };
  resets.add(reset);
  const tick = (now) => {
    if (!canMove() || !finePointer.matches) return reset();
    const dt = Math.min((now - lastTime) / 1000 || .016, .032);
    lastTime = now;
    vx += (100 * (tx - x) - 10 * vx) * dt;
    vy += (100 * (ty - y) - 10 * vy) * dt;
    x += vx * dt; y += vy * dt;
    element.style.transform = render(x, y);
    if (Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(vx) + Math.abs(vy) > .015) frame = requestAnimationFrame(tick);
    else { frame = 0; if (!tx && !ty) reset(); }
  };
  const start = () => { if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(tick); } };
  element.addEventListener('pointermove', (event) => {
    if (!finePointer.matches || !canMove() || event.pointerType !== 'mouse') return;
    const box = element.getBoundingClientRect();
    tx = ((event.clientX - box.left) / box.width - .5) * maximum * 2;
    ty = ((event.clientY - box.top) / box.height - .5) * maximum * 2;
    start();
  });
  element.addEventListener('pointerleave', () => { tx = 0; ty = 0; if (frame || x || y) start(); });
  element.addEventListener('blur', reset);
}

export function initializeMotion() {
  document.addEventListener('keydown', () => root.classList.add('keyboard-input'), { capture: true });
  document.addEventListener('pointerdown', () => root.classList.remove('keyboard-input'), { capture: true });
  const stop = () => {
    [...effects].forEach((effect) => effect.cancel());
    resets.forEach((reset) => reset());
  };
  new MutationObserver(() => { if (!canMove()) stop(); }).observe(root, { attributes: true, attributeFilter: ['class'] });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) stop(); });
  finePointer.addEventListener('change', () => { if (!finePointer.matches) resets.forEach((reset) => reset()); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });

  const fan = document.querySelector('.photo-fan');
  springPointer(fan, (x, y) => `perspective(1400px) rotateX(${-y}deg) rotateY(${x}deg)`, 1.5);
  document.querySelectorAll('[data-magnetic]').forEach((element) => {
    const base = getComputedStyle(element).transform;
    springPointer(element, (x, y) => `${base === 'none' ? '' : base} translate3d(${x}px, ${y}px, 0)`, 4);
  });

  if (!canMove() || document.querySelector('.hero').getBoundingClientRect().bottom < 0) return;
  play(document.querySelector('.site-header'), [{ opacity: 0, transform: 'translateY(-8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 400 });
  document.querySelectorAll('.hero-title-main, .hero-title-script').forEach((line, index) => {
    play(line, [{ opacity: 0, transform: 'translateY(35%)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600, delay: index * 70 });
  });
  const cards = [...fan.querySelectorAll('.fan-photo')];
  [2, 1, 3, 0, 4].forEach((index, sequence) => {
    const card = cards[index];
    const style = getComputedStyle(card);
    const offset = fan.clientWidth / 2 - parseFloat(style.left);
    play(card, [
      { opacity: 0, transform: `translate(calc(-50% + ${offset}px), 42px) rotate(0deg) scale(.94)` },
      { opacity: 1, transform: style.transform },
    ], { duration: 700, delay: 140 + sequence * 60 });
  });
  const path = document.querySelector('.fan-note path');
  path.setAttribute('pathLength', '1');
  play(path, [{ strokeDasharray: '1', strokeDashoffset: '1' }, { strokeDasharray: '1', strokeDashoffset: '0' }], { duration: 600, delay: 350 });
}
