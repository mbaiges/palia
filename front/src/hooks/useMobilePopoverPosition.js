import { useLayoutEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 1024;
const VIEWPORT_MARGIN = 12;

export function getMobilePopoverStyle(anchorEl, { width = 320, align = 'right' } = {}) {
  if (!anchorEl || typeof window === 'undefined') return null;

  const rect = anchorEl.getBoundingClientRect();
  const maxWidth = Math.min(width, window.innerWidth - VIEWPORT_MARGIN * 2);
  const top = rect.bottom + 8;

  if (align === 'right') {
    let right = window.innerWidth - rect.right;
    right = Math.max(VIEWPORT_MARGIN, Math.min(right, window.innerWidth - maxWidth - VIEWPORT_MARGIN));
    return {
      position: 'fixed',
      top,
      right,
      left: 'auto',
      width: maxWidth,
      zIndex: 200,
    };
  }

  let left = rect.left;
  left = Math.max(VIEWPORT_MARGIN, Math.min(left, window.innerWidth - maxWidth - VIEWPORT_MARGIN));

  return {
    position: 'fixed',
    top,
    left,
    right: 'auto',
    width: maxWidth,
    zIndex: 200,
  };
}

export function useMobilePopoverPosition(open, anchorRef, options = {}) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined' || window.innerWidth > MOBILE_BREAKPOINT) {
      setStyle(null);
      return undefined;
    }

    const update = () => {
      if (!anchorRef.current) return;
      setStyle(getMobilePopoverStyle(anchorRef.current, options));
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, [open, anchorRef, options.width, options.align]);

  return style;
}
