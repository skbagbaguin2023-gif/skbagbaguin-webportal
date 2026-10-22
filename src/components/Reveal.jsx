import { useEffect, useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal.js';

const hiddenClasses = {
  up: 'translate-y-8',
  down: '-translate-y-8',
  left: 'translate-x-8',
  right: '-translate-x-8',
  fade: '',
  zoom: 'scale-95',
};

export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 700,
  className = '',
  as: Element = 'div',
  ...elementProps
}) {
  const [ref, isVisible] = useScrollReveal();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const visible = isVisible || prefersReducedMotion;
  const motionClasses = prefersReducedMotion
    ? 'opacity-100 transform-none transition-none'
    : `transition-[opacity,transform] ${visible ? 'opacity-100 translate-x-0 translate-y-0 scale-100' : `opacity-0 ${hiddenClasses[direction]}`}`;

  return (
    <Element
      {...elementProps}
      ref={ref}
      className={`${motionClasses} ${className}`.trim()}
      style={prefersReducedMotion ? undefined : { transitionDuration: `${duration}ms`, transitionDelay: `${delay}ms` }}
    >
      {children}
    </Element>
  );
}
