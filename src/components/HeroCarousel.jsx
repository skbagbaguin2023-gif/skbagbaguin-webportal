import { useEffect, useState } from 'react';
import homeImg1 from '../assets/images/homeImg1.jpg';
import homeImg2 from '../assets/images/homeImg2.jpg';
import homeImg3 from '../assets/images/homeImg3.jpg';
import homeImg4 from '../assets/images/homeImg4.jpg';
import homeImg5 from '../assets/images/homeImg5.jpg';
import homeImg6 from '../assets/images/homeImg6.jpg';
import homeImg7 from '../assets/images/homeImg7.jpg';
import homeImg8 from '../assets/images/homeImg8.jpg';
import homeImg9 from '../assets/images/homeImg9.jpg';

// TODO: Add future imported image assets and slide entries here.
const slides = [
  { src: homeImg1, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg2, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg3, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg4, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg5, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg6, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg7, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg8, alt: 'SK Bagbaguin Youth Assembly' },
  { src: homeImg9, alt: 'SK Bagbaguin Youth Assembly' },
];

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(
    () => document.visibilityState === 'visible',
  );
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const hasMultipleSlides = slides.length > 1;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setIsTabVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides || isHovered || !isTabVisible || prefersReducedMotion) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [hasMultipleSlides, isHovered, isTabVisible, prefersReducedMotion]);

  useEffect(() => {
    if (!hasMultipleSlides) return;
    const nextSlide = slides[(activeIndex + 1) % slides.length];
    const image = new Image();
    image.src = nextSlide.src;
  }, [activeIndex, hasMultipleSlides]);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {slides.map((slide, index) => (
        <img
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          aria-hidden={index !== activeIndex}
          className="absolute inset-0 w-full h-full object-cover opacity-20 saturate-120"
          style={{
            opacity: index === activeIndex ? 0.2 : 0,
            transitionProperty: 'opacity',
            transitionDuration: prefersReducedMotion ? '0ms' : '1000ms',
          }}
          referrerPolicy="no-referrer"
        />
      ))}
    </div>
  );
}
