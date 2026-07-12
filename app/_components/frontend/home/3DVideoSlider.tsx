"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const cards = [
  {
    title: "Classic Burger",
    desc: "Juicy beef patty with fresh lettuce, tomato, and our secret sauce.",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200",
  },
  {
    title: "Pepperoni Pizza",
    desc: "Loaded with mozzarella and premium pepperoni on a crispy crust.",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200",
  },
  {
    title: "Chicken Tacos",
    desc: "Spiced chicken with salsa, guacamole, and sour cream in a warm tortilla.",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200",
  },
  {
    title: "Grilled Salmon",
    desc: "Perfectly seared salmon fillet with lemon butter and herbs.",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200",
  },
  {
    title: "Caesar Salad",
    desc: "Crisp romaine, parmesan, croutons, and creamy Caesar dressing.",
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200",
  },
  {
    title: "Chocolate Lava",
    desc: "Warm molten chocolate cake with vanilla ice cream.",
    image:
      "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=1200",
  },
  {
    title: "Iced Latte",
    desc: "Rich espresso over chilled milk with a smooth finish.",
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200",
  },
];

export default function Home() {
  const [active, setActive] = useState(2);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const range = isMobile ? 1 : 2;

  const prev = () => {
    setActive((i) => (i === 0 ? cards.length - 1 : i - 1));
  };

  const next = () => {
    setActive((i) => (i === cards.length - 1 ? 0 : i + 1));
  };

  return (
    <main className="min-h-screen bg-black overflow-hidden flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="relative w-full max-w-350">

        {/* Cards */}
        <div className="flex gap-3 sm:gap-6 lg:gap-8 items-center justify-center transition-all duration-500">

          {(() => {
            const len = cards.length;
            const indices = [];
            for (let i = -range; i <= range; i++) {
              const idx = ((active + i) % len + len) % len;
              indices.push(idx);
            }
            return indices;
          })().map((cardIndex) => {
            const card = cards[cardIndex];
            const isActive = cardIndex === active;

            return (
              <div
                key={cardIndex}
                className={`relative rounded-2xl sm:rounded-[30px] overflow-hidden shrink-0 transition-all duration-500 cursor-pointer
                  ${isActive
                    ? "w-75 sm:w-72 md:w-96 lg:w-120 h-100 sm:h-96 md:h-110 lg:h-150 scale-100 shadow-[0_0_60px_rgba(255,255,255,0.15)] z-10"
                    : "w-28 sm:w-56 md:w-56 lg:w-70 h-45 sm:h-72 md:h-90 lg:h-130 opacity-50 scale-90 blur-[2px]"
                  }
                `}
                onClick={() => setActive(cardIndex)}
              >
                {/* Background video */}
                <video src="/burger.mp4" autoPlay loop muted playsInline preload="none" className="absolute inset-0 h-full w-full object-cover" />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 p-4 sm:p-5 lg:p-7 z-10">
                  <h2 className={` text-lime-300 transition-all duration-500
                    ${isActive
                      ? "text-2xl sm:text-3xl lg:text-5xl font-medium"
                      : "text-lg sm:text-xl lg:text-3xl"
                    }
                  `}
                  >
                    {card.title}
                  </h2>

                  <p className={`text-white/85 mt-2 sm:mt-3 lg:mt-4 leading-relaxed text-sm sm:text-base
                    ${isActive ? "opacity-100" : "opacity-70"}
                  `}> {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fixed arrows in the middle */}
        <button onClick={prev}
          className="absolute left-0 sm:-left-4 lg:left-0 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-black text-white flex items-center justify-center border border-white/20 z-20 hover:bg-white hover:text-black transition-all duration-300"
        >
          <ChevronLeft size={isMobile ? 20 : 22} />
        </button>

        <button onClick={next}
          className="absolute right-0 sm:-right-4 lg:right-0 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-black text-white flex items-center justify-center border border-white/20 z-20 hover:bg-white hover:text-black transition-all duration-300"
        >
          <ChevronRight size={isMobile ? 20 : 22} />
        </button>
      </div>
    </main>
  );
}