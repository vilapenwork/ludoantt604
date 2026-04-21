import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroImg1 from "@/assets/hero-1.png";
import heroImg2 from "@/assets/hero-2.png";
import heroImg3 from "@/assets/hero-3.png";

const heroImages = [heroImg1, heroImg2, heroImg3];

const Hero = () => {
  // Replay hero animations whenever it scrolls back into view
  const [animKey, setAnimKey] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [api, setApi] = useState<CarouselApi>();
  const [maxH, setMaxH] = useState<number>(0);
  const autoplay = useRef(
    Autoplay({ delay: 2500, stopOnInteraction: false, stopOnMouseEnter: true })
  );

  // Find the tallest image (at rendered width) so the carousel keeps that height
  // and other images scale proportionally inside it.
  useEffect(() => {
    let cancelled = false;
    const compute = () => {
      const containerW = sectionRef.current?.querySelector<HTMLElement>(
        "[data-hero-carousel]"
      )?.clientWidth;
      if (!containerW) return;
      Promise.all(
        heroImages.map(
          (src) =>
            new Promise<{ w: number; h: number }>((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
              img.onerror = () => resolve({ w: 1, h: 1 });
              img.src = src;
            })
        )
      ).then((dims) => {
        if (cancelled) return;
        const tallest = Math.max(...dims.map((d) => (containerW * d.h) / d.w));
        // cap height so hero stays in viewport
        setMaxH(Math.min(tallest, 420));
      });
    };
    compute();
    window.addEventListener("resize", compute);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", compute);
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSlideIdx(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    let wasOut = false;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            wasOut = true;
          } else if (wasOut) {
            wasOut = false;
            setAnimKey((k) => k + 1);
          }
        });
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} key={animKey} className="relative isolate overflow-hidden">
      {/* gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[hsl(var(--hero-bg))]"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
    background: `
      radial-gradient(800px 400px at 80% -10%, rgba(243, 191, 142, 0.86), transparent 60%),
      radial-gradient(600px 300px at 0% 100%, rgba(243, 119, 216, 0.8), transparent 60%),
      #ab0010
    `,
  }}
  // style={{
  //   backgroundColor :'#ab0010',
  // }}
        // style={{
        //   backgroundImage:
        //            // "radial-gradient(60rem 30rem at 80% -10%, hsl(var(--hero-glow) / 0.35), transparent 60%), radial-gradient(40rem 20rem at 0% 110%, hsl(var(--hero-accent) / 0.25), transparent 60%)", 
        //     "radial-gradient(60rem 30rem at 80% -10%, hsl(var(--hero-glow) / 0.15), transparent 60%), radial-gradient(40rem 20rem at 0% 110%, hsl(var(--hero-accent) / 0.1), transparent 60%)",
        // }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--hero-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--hero-foreground)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-28 lg:py-32" >

        <div className="max-w-3xl text-[hsl(var(--hero-foreground))]">
          <span
            style={{ color: "#FFD700", backgroundColor: "#D32F3F" }}
            className="animate-slide-in-down inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-[hsl(var(--hero-foreground)/0.25)] px-3 py-1 text-xs font-medium uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="relative flex w-56 overflow-hidden sm:w-72">
              <span className="flex shrink-0 animate-marquee whitespace-nowrap">
                <span className="px-4">Kịp thời - Chính xác - Bí mật - An toàn</span>
                <span className="px-4">Kịp thời - Chính xác - Bí mật - An toàn</span>
              </span>
              <span className="flex shrink-0 animate-marquee whitespace-nowrap" aria-hidden>
                <span className="px-4">Kịp thời - Chính xác - Bí mật - An toàn</span>
                <span className="px-4">Kịp thời - Chính xác - Bí mật - An toàn</span>
              </span>
            </span>
          </span>

            
          {/* <h1 className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
             style={{ color: "#f9e972" }}
          >
             
         
            Trang thông tin   <br className=" hidden md:inline" /> Lữ đoàn 604 
            but if mobile, add br at middle text , else hidden
            solution above

          </h1> */}
          <h1
            className="mt-6 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl animate-slide-in-left"
            style={{ color: "#f9e972" }}
          >
            Trang thông tin
            <br className="lg:hidden" />
            {" "}Lữ đoàn 604
          </h1>


          <p className="mt-6 max-w-2xl text-base leading-relaxed text-[hsl(var(--hero-foreground)/0.85)] md:text-lg
            text-justify animate-slide-in-right
          " style={{ animationDelay: "0.6s" }}>
            Hành trình hơn bốn thập kỷ xây dựng, chiến đấu và trưởng thành của Lữ đoàn Thông tin 604 –
            đơn vị bảo đảm thông tin liên lạc cho Bộ Tư lệnh Quân khu 2, gìn giữ và phát huy truyền thống
            anh hùng của Quân đội nhân dân Việt Nam.
          </p>

          <div className="mt-8 relative w-full overflow-hidden rounded-xl border border-[hsl(var(--hero-foreground)/0.2)] shadow-lg h-40 sm:h-48 md:h-56 lg:h-64">
            {heroImages.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Hình ảnh Lữ đoàn 604 ${i + 1}`}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                  i === slideIdx ? "opacity-100" : "opacity-0"
                }`}
              />
            ))}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
              {heroImages.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === slideIdx ? "w-6 bg-white" : "w-1.5 bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Button
              asChild
              size="lg"
              className="text-white border-0 bg-[length:200%_200%] animate-gradient-shift bg-gradient-to-r from-[#ff5f6d] via-[#ffc371] to-[#ff5f6d] hover:opacity-95"
            >
              <Link to="/lich-su">
                Xem thêm <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-[hsl(var(--hero-foreground)/0.4)] bg-transparent text-[hsl(var(--hero-foreground))] hover:bg-[hsl(var(--hero-foreground)/0.1)] hover:text-[hsl(var(--hero-foreground))]"
            >
              <Link to="/tin-tuc">Đọc tin tức</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
