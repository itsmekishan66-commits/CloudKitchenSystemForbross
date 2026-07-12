"use client";
import { useEffect, useState} from "react";
// import { useEffect, useState, useRef } from "react";
import { X } from "lucide-react";
import { dedupedFetch } from "@/lib/fetchCache";
// import { X, Bot } from "lucide-react";

interface PromotionItem {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  discountType: string;
  discountValue: string;
  code: string | null;
}

export default function OffersPopup() {
  const [open, setOpen] = useState(false);
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoOpened, setAutoOpened] = useState(false);
  // const [botOpen, setBotOpen] = useState(false);
  // const [typedText, setTypedText] = useState("");
  // const botMessage = "We welcome you to our Cloud Kitchen! Order your favourite food in a blink 🍔";
  // const botMessage1 = "For any queries, please contact us at +977 9800000000 or email us at hello@example.com";
  // const fullMessage = botMessage + "\n\n" + botMessage1;
  // const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // useEffect(() => {
  //   let i = 0;

  //   function typeChar() {
  //     if (i < fullMessage.length) {
  //       setTypedText(fullMessage.slice(0, i + 1));
  //       i++;
  //       typingRef.current = setTimeout(typeChar, 30);
  //     }
  //   }

  //   typeChar();

  //   return () => {
  //     if (typingRef.current) clearTimeout(typingRef.current);
  //   };
  // }, [botOpen, fullMessage]);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem("offers_popup_shown");
    if (alreadyShown || autoOpened) return;

    const timer = setTimeout(() => {
      setAutoOpened(true);
      sessionStorage.setItem("offers_popup_shown", "1");
      setOpen(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [autoOpened]);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;
    const loadPromotions = async () => {
      setLoading(true);
      try {
        const data = await dedupedFetch<{ promotions?: PromotionItem[] }>("/api/promotions");
        if (isMounted && !("error" in data)) {
          const nextPromotions = data.promotions ?? [];
          setPromotions(nextPromotions);
          setActiveIndex(0);
        }
      } catch (error) {
        console.error("Failed to load public promotions", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadPromotions();

    return () => {
      isMounted = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open || promotions.length <= 1) return;

    const interval = window.setInterval(() => {
      setActiveIndex((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
    }, 3000);

    return () => window.clearInterval(interval);
  }, [open, promotions.length]);

  const goToPrevious = () => {
    setActiveIndex((prev) => (prev === 0 ? promotions.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setActiveIndex((prev) => (prev === promotions.length - 1 ? 0 : prev + 1));
  };

  const currentPromotion = promotions[activeIndex];

  return (
    <>
      <style>{`@keyframes breathe { 0%, 100% { transform: scale(1.4); } 50% { transform: scale(1.06); } }`}</style>

      {/* Bot Icon + Typing Bubble */}
      {/* <span className="fixed bottom-32 right-8 z-50 flex flex-col items-end gap-2">
        {botOpen && (
          <div className="max-w-116 rounded-2xl rounded-br-sm bg-white p-8 shadow-xl border border-gray-100">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500">
                <Bot size={16} className="text-white" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                {typedText}
                {typedText.length < fullMessage.length && (
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-gray-500 align-middle" />
                )}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={() => setBotOpen(!botOpen)}
          className={`flex items-center justify-center rounded-full p-3 shadow-lg transition-all ${botOpen ? "bg-orange-500 text-white scale-110" : "bg-white text-orange-500 hover:bg-orange-50"}`}
        >
          <Bot size={22} />
        </button>
      </span> */}

      {/* Floating Offers Button */}
      <span className="fixed bottom-18 md:bottom-8 right-8 z-50">
        <button
          onClick={() => setOpen(true)}
          className="rounded-full bg-yellow-300 px-4 py-2 md:px-6 md:py-3 font-bold text-black shadow-lg transition-all duration-300 hover:bg-yellow-400"
          style={{ animation: "breathe 2.5s ease-in-out infinite" }}
        >
        🏷️ Offers
        </button>
      </span>

      {/* Offers Modal */}
      {open && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 p-2 sm:p-4">
          <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl shadow-2xl sm:w-[90vw]">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-full bg-yellow-500 text-black p-2 transition-colors sm:right-4 sm:top-4"
            >
              <X size={20} className="sm:h-6 sm:w-6" />
            </button>

            <div className="flex-1 overflow-y-auto ">
              {loading ? (
                <div className="flex h-40 items-center justify-center text-gray-500">Loading offers...</div>
              ) : promotions.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-gray-500">No offers available right now.</div>
              ) : currentPromotion ? (
                <div className="flex flex-col gap-4">
                  <div className="relative flex items-center justify-center gap-3 sm:gap-4">
                    <button
                      onClick={goToPrevious}
                      className="absolute top-80 left-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-lg text-gray-700 shadow-sm transition hover:bg-gray-100 sm:h-10 sm:w-10 sm:text-xl"
                    >
                      &lt;
                    </button>
                    <button
                      onClick={goToNext}
                      className="absolute top-80 right-5 z-50 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-lg text-gray-700 shadow-sm transition hover:bg-gray-100 sm:h-10 sm:w-10 sm:text-xl"
                    >
                      &gt;
                    </button>
                  </div>

                  <div className="relative overflow-hidden h-145 rounded-2xl shadow-sm">
                    {currentPromotion.image ? (
                      <img src={currentPromotion.image} alt={currentPromotion.title} className="w-full h-full object-fit" />
                    ) : (
                      <div className="flex items-center justify-center bg-orange-100 text-sm font-medium text-orange-700">
                        No image available
                      </div>
                    )}
                   <div className="absolute bottom-0 left-0 right-0">
                     <div className="p-1 sm:p-5">
                      {currentPromotion.code ? (
                        <div className="inline-flex rounded-full bg-green-200 px-4 py-2 text-sm font-medium text-green-700">
                          Use Code: {currentPromotion.code}
                        </div>
                      ) : null}
                    </div>
                   </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
