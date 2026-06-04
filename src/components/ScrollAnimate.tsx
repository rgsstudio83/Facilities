import React, { useEffect, useRef, useState } from 'react';

interface ScrollAnimateProps {
  children: React.ReactNode;
  className?: string;
  delay?: number; // Delay in ms
  duration?: number; // Duration in Tailwind format (e.g., 700, 1000)
}

export default function ScrollAnimate({
  children,
  className = '',
  delay = 0,
  duration = 750
}: ScrollAnimateProps) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, we can unobserve if we want it to stay permanently
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
        rootMargin: '0px 0px -50px 0px' // Offset slightly before it enters viewport
      }
    );

    const currentRef = domRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  // Map duration parameter to standard tailwind transition duration strings
  const durationClass = 
    duration === 300 ? 'duration-300' :
    duration === 500 ? 'duration-500' :
    duration === 700 ? 'duration-700' :
    duration === 1000 ? 'duration-1000' :
    duration === 1500 ? 'duration-[1500ms]' : 'duration-750';

  return (
    <div
      ref={domRef}
      className={`transition-all ${durationClass} ${className} ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8 pointer-events-none'
      }`}
      style={{
        transitionDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      {children}
    </div>
  );
}
