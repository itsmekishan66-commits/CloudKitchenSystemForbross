"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const variants = {
  enter: (direction: number) => {
    return {
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => {
    return {
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    };
  },
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

export default function Carousel({ children }: { children: React.ReactNode[] }) {
  const [[page, direction], setPage] = useState([0, 0]);
  const imageIndex = page % children.length;

  const paginate = (newDirection: number) => {
    setPage([page + newDirection, newDirection]);
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={page}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = swipePower(offset.x, velocity.x);

            if (swipe < -swipeConfidenceThreshold) {
              paginate(1);
            } else if (swipe > swipeConfidenceThreshold) {
              paginate(-1);
            }
          }}
          className="w-full h-full"
        >
          {children[imageIndex]}
        </motion.div>
      </AnimatePresence>
      <div className="absolute top-1/2 left-2 transform -translate-y-1/2">
        <button
          onClick={() => paginate(-1)}
          className="bg-white/50 rounded-full p-2 hover:bg-white"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
      </div>
      <div className="absolute top-1/2 right-2 transform -translate-y-1/2">
        <button
          onClick={() => paginate(1)}
          className="bg-white/50 rounded-full p-2 hover:bg-white"
        >
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
}