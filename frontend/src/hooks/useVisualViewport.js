import { useEffect } from 'react';

export function useVisualViewport() {
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport && viewport.scale !== 1) return;
        const style = document.documentElement.style;
        style.setProperty('--app-height', `${viewport?.height ?? window.innerHeight}px`);
        style.setProperty('--app-top', `${viewport?.offsetTop ?? 0}px`);
      });
    };
    update();
    window.addEventListener('resize', update);
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      document.documentElement.style.removeProperty('--app-height');
      document.documentElement.style.removeProperty('--app-top');
    };
  }, []);
}
