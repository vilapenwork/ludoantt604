import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  // Replay hero animations whenever it scrolls back into view
  const [animKey, setAnimKey] = useState(0);
  const sectionRef = useRef<HTMLElement | null>(null);
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
          <span   style={{ color: "#FFD700",backgroundColor: "#D32F3F" }}
          className="
          animate-slide-in-down
          inline-flex items-center gap-2 rounded-full border border-[hsl(var(--hero-foreground)/0.25)] b
          g-[hsl(var(--hero-foreground)/0.06)] px-3 py-1 text-xs font-medium uppercase tracking-wider
           text-[hsl(var(--hero-foreground)/0.85)]"
           >
            <Sparkles className="h-3.5 w-3.5" />
          Kịp thời - Chính xác - Bí mật - An toàn
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

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
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
