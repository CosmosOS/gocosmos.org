import { useEffect, useRef, useState } from 'react';

interface Slide {
  src: string;
  alt: string;
}

const SLIDES: Slide[] = [
  { src: '/assets/zero.png', alt: 'Cosmos example 0' },
  { src: '/assets/one.png', alt: 'Cosmos example 1' },
  { src: '/assets/two.png', alt: 'Cosmos example 2' },
  { src: '/assets/three.png', alt: 'Cosmos example 3' },
  { src: '/assets/four.png', alt: 'Cosmos example 4' },
];

const AUTOPLAY_MS = 5000;

export function Projects() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;
  const go = (n: number) => setIndex((n + count) % count);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = window.setInterval(() => {
      setIndex(i => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [paused, count]);

  return (
    <section className="section section-tinted" id="projects">
      <div className="container">
        <div className="section-head" data-reveal>
          <div className="cs-eyebrow">// built on cosmos</div>
          <h2 className="cs-h1">Hobby OSes, real kernels.</h2>
          <p className="section-sub">Cosmos Gen2 has powered community operating systems for over a decade. Gen3 carries that legacy forward.</p>
        </div>
        <div
          className="carousel"
          data-reveal
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
        >
          <div className="carousel-viewport">
            <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {SLIDES.map((s, i) => (
                <div className="carousel-slide" key={i}>
                  <img src={s.src} alt={s.alt} loading="lazy" />
                </div>
              ))}
            </div>
            <button className="carousel-zone carousel-zone-prev" aria-label="Previous slide" onClick={() => go(index - 1)} />
            <button className="carousel-zone carousel-zone-next" aria-label="Next slide" onClick={() => go(index + 1)} />
          </div>
          <div className="carousel-dots" role="tablist">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === index ? 'is-active' : ''}`}
                aria-label={`Go to slide ${i + 1}`}
                aria-selected={i === index}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
