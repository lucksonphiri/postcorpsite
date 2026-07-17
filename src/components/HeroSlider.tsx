"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  TouchEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type Slide = {
  id?: number | string;
  title: string;
  subtitle?: string | null;
  image_url: string;
  button_text?: string | null;
  button_url?: string | null;
  button_link?: string | null;
};

type HeroSliderProps = {
  slides: Slide[];
};

const SLIDE_DURATION = 5000;

export default function HeroSlider({
  slides,
}: HeroSliderProps) {
  const fallbackSlides: Slide[] = [
    {
      id: "default-slide",
      title: "Shaping Spaces with Glass & Aluminium",
      subtitle:
        "We design, manufacture and install customised solutions for commercial and domestic clients.",
      image_url: "/images/slide01.jpg",
      button_text: "Start Your Project",
      button_url: "/quote",
    },
  ];

  const slideList =
    slides && slides.length > 0 ? slides : fallbackSlides;

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const hasMultipleSlides = slideList.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides || paused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((currentIndex) => {
        return (currentIndex + 1) % slideList.length;
      });
    }, SLIDE_DURATION);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasMultipleSlides, paused, slideList.length]);

  useEffect(() => {
    if (activeIndex >= slideList.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, slideList.length]);

  function goToPreviousSlide() {
    setActiveIndex((currentIndex) => {
      if (currentIndex === 0) {
        return slideList.length - 1;
      }

      return currentIndex - 1;
    });
  }

  function goToNextSlide() {
    setActiveIndex((currentIndex) => {
      return (currentIndex + 1) % slideList.length;
    });
  }

  function handleTouchStart(
    event: TouchEvent<HTMLElement>
  ) {
    touchStartX.current =
      event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(
    event: TouchEvent<HTMLElement>
  ) {
    if (touchStartX.current === null) {
      return;
    }

    const touchEndX =
      event.changedTouches[0]?.clientX ??
      touchStartX.current;

    const swipeDistance =
      touchStartX.current - touchEndX;

    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        goToNextSlide();
      } else {
        goToPreviousSlide();
      }
    }

    touchStartX.current = null;
  }

  return (
    <section
      className="home-hero-slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Postcorp homepage slideshow"
    >
      {slideList.map((slide, index) => {
        const buttonLink =
          slide.button_url ||
          slide.button_link ||
          "/quote";

        return (
          <article
            key={slide.id ?? index}
            className={`home-hero-slide ${
              index === activeIndex ? "active" : ""
            }`}
            aria-hidden={index !== activeIndex}
          >
            <div
              className="home-hero-slide-background"
              style={{
                backgroundImage: `url("${slide.image_url}")`,
              }}
            />

            <div className="home-hero-slide-overlay" />

            <div className="container home-hero-slide-content">
              <div className="home-hero-slide-text">
                <div className="eyebrow">
                  Over 20 years of technical excellence
                </div>

                <h1>{slide.title}</h1>

                {slide.subtitle && (
                  <p>{slide.subtitle}</p>
                )}

                <div className="home-hero-actions">
                  <Link
                    className="btn btn-red"
                    href={buttonLink}
                  >
                    {slide.button_text ||
                      "Start Your Project"}
                  </Link>

                  <Link
                    className="btn btn-dark"
                    href="/projects"
                  >
                    Explore Our Work
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}

      {hasMultipleSlides && (
        <>
          <button
            type="button"
            className="home-hero-arrow home-hero-arrow-left"
            onClick={goToPreviousSlide}
            aria-label="Show previous slide"
          >
            <ChevronLeft size={30} />
          </button>

          <button
            type="button"
            className="home-hero-arrow home-hero-arrow-right"
            onClick={goToNextSlide}
            aria-label="Show next slide"
          >
            <ChevronRight size={30} />
          </button>

          <div className="home-hero-slider-footer">
            <div className="home-hero-dots">
              {slideList.map((slide, index) => (
                <button
                  key={slide.id ?? index}
                  type="button"
                  className={
                    activeIndex === index
                      ? "active"
                      : ""
                  }
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show slide ${index + 1}`}
                />
              ))}
            </div>

            <div className="home-hero-counter">
              {String(activeIndex + 1).padStart(
                2,
                "0"
              )}

              <span>/</span>

              {String(slideList.length).padStart(
                2,
                "0"
              )}
            </div>
          </div>

          <div
            key={`${activeIndex}-${paused}`}
            className="home-hero-progress"
            style={{
              animationDuration: `${SLIDE_DURATION}ms`,
              animationPlayState: paused
                ? "paused"
                : "running",
            }}
          />
        </>
      )}
    </section>
  );
}