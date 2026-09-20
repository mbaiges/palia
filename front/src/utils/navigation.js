export function getContentCanvas() {
  if (typeof document === 'undefined') return null;
  return document.querySelector('.content-canvas');
}

export function resetContentScroll(behavior = 'auto') {
  const canvas = getContentCanvas();
  if (!canvas) return;
  canvas.scrollTo({ top: 0, behavior });
}

export function scrollToSection(sectionId, options = {}) {
  if (!sectionId || typeof document === 'undefined') return;

  const delay = options.delay ?? 120;
  const canvas = getContentCanvas();

  window.setTimeout(() => {
    if (!canvas) return;

    const target = document.getElementById(sectionId);
    if (!target) {
      resetContentScroll(options.behavior ?? 'auto');
      return;
    }

    const canvasRect = canvas.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - canvasRect.top + canvas.scrollTop - (options.offset ?? 12);

    canvas.scrollTo({
      top: Math.max(0, offset),
      behavior: options.behavior ?? 'smooth',
    });
  }, delay);
}
