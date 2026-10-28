import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * True while the element is at most `fraction` of the window's height. Used to keep the header
 * sticky and the tab bar fixed only while they are small: with 200 % text a sticky header can be
 * taller than the phone screen and hide everything under it.
 */
export function useFitsOnScreen(ref: RefObject<HTMLElement | null>, fraction: number): boolean {
  const [fits, setFits] = useState(true);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setFits(el.getBoundingClientRect().height <= window.innerHeight * fraction);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(check);
    observer?.observe(el); // also calls check() once straight away
    window.addEventListener('resize', check);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', check);
    };
  }, [ref, fraction]);
  return fits;
}
