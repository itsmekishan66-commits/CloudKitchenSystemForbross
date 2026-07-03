"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const items = [
    "/menu/matcha.jpg",
    "/menu/poke.jpg",
    "/menu/ribs.jpg",
    "/menu/matcha.jpg",
    "/menu/poke.jpg",
    "/menu/ribs.jpg",
    "/menu/matcha.jpg",
    "/menu/poke.jpg",
    "/menu/ribs.jpg",
    "/menu/matcha.jpg",
    "/menu/poke.jpg",
    "/menu/ribs.jpg",
    "/menu/matcha.jpg",
    "/menu/poke.jpg",
    "/menu/ribs.jpg",
];

export default function CurvedLoopCarousel() {
    const [active, setActive] = useState(4);
    const [hovered, setHovered] = useState<number | null>(null);

    const total = items.length;

    useEffect(() => {
        const id = setInterval(() => {
            setActive((prev) => (prev + 1) % total);
        }, 4000);
        return () => clearInterval(id);
    }, [total]);

    // infinite loop distance
    const getOffset = (index: number) => {
        let diff = index - active;

        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        return diff;
    };

    return (
        <div className="w-full h-screen bg-black overflow-hidden flex flex-col justify-center">

            <div
                className="relative h-104 w-full"
                style={{
                    perspective: "2500px",
                    transformStyle: "preserve-3d",
                }}
            >
                {items.map((img, index) => {
                    const offset = getOffset(index);

                    // horizontal spread
                    const x = offset * 180;

                    // subtle arc like screenshot
                    const y = Math.abs(offset) * 24;

                    // depth
                    const z = Math.abs(offset) * -80;

                    // side rotation
                    const rotateY = offset * -15;

                    // base scale
                    const baseScale = offset === 0 ? 1 : 0.88;
                    const hoverScale = hovered === index ? 1.12 : 1;
                    const finalScale = baseScale * hoverScale;

                    const moveToCenter = (clickedIndex: number) => {
                        let diff = clickedIndex - active;

                        // shortest path in circular list
                        if (diff > total / 2) diff -= total;
                        if (diff < -total / 2) diff += total;

                        setActive((prev) => (prev + diff + total) % total);
                    };

                    return (
                        <div
                            key={index}
                            onClick={() => moveToCenter(index)}
                            onMouseEnter={() => setHovered(index)}
                            onMouseLeave={() => setHovered(null)}
                            className="absolute top-1/2 left-1/2 cursor-pointer duration-700 transition-all ease-out"
                            style={{
                                width: "340px",
                                height: "340px",

                                transform: `
                  translate(-50%, -50%)
                  translateX(${x}px)
                  translateY(${y}px)
                  translateZ(${z}px)
                  rotateY(${rotateY}deg)
                  scale(${finalScale})
                `,

                                zIndex: hovered === index ? 999 : total - Math.abs(offset),
                            }}
                        >
                            <div className="relative h-full w-full overflow-hidden rounded-[30px] shadow-2xl">
                                <Image
                                    src={img}
                                    alt=""
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* indicators */}
            <div className="flex justify-center gap-3 mt-6">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setActive(i)}
                        className={`
              rounded-full transition-all duration-300
              ${i === active
                                ? "bg-white w-6 h-2"
                                : "bg-gray-600 w-2 h-2"
                            }
            `}
                    />
                ))}
            </div>
        </div>
    );
}
