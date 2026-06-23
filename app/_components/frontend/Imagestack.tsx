"use client";

import { useState } from "react";
import { FaHeart, FaTimes } from "react-icons/fa";

const cardGroups = [
    {
        Pizza: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        ],
        Burgers: [
            "https://images.unsplash.com/photo-1513104890138-7c749659a591",
            "https://images.unsplash.com/photo-1550547660-d9450f859349",
            "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
        ],
    },

    {
        Pizza: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        ],
        Burgers: [
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
            "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9",
            "https://images.unsplash.com/photo-1513104890138-7c749659a591",
            "https://images.unsplash.com/photo-1550547660-d9450f859349",
        ],
    },

    {
        Pizza: [
            "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38",
            "https://images.unsplash.com/photo-1565958011703-44f9829ba187",
            "https://images.unsplash.com/photo-1555939594-58d7cb561ad1",
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c",
        ],
        Burgers: [
            "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9",
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
            "https://images.unsplash.com/photo-1550547660-d9450f859349",
            "https://images.unsplash.com/photo-1513104890138-7c749659a591",
        ],
    },
];

export default function ImageStackSlider() {
    const [activeIndex, setActiveIndex] = useState(0);

    const nextSlide = () => {
        setActiveIndex((prev) =>
            prev + 1 >= cardGroups.length ? 0 : prev + 1
        );
    };

    const prevSlide = () => {
        setActiveIndex((prev) =>
            prev - 1 < 0 ? cardGroups.length - 1 : prev - 1
        );
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white/50 overflow-hidden mt-10 mb-20 py-16">
            <div className="relative w-85 h-110 group">
                {cardGroups.map((group, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-all duration-500 ${activeIndex === index
                            ? "opacity-100 scale-100 z-20"
                            : "opacity-0 scale-75 z-0"
                            }`}
                    >
                        {/* Little Cards */}
                        <div
                            className="absolute w-24 h-32 rounded-2xl bg-cover bg-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl transition-all duration-700 group-hover:translate-x-[200%] group-hover:-translate-y-[210%] group-hover:rotate-[-15deg]"
                            style={{ backgroundImage: `url(${group.Pizza[0]})` }}
                        />

                        <div
                            className="absolute w-24 h-32 rounded-2xl bg-cover bg-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl transition-all duration-700 group-hover:translate-x-[160%] group-hover:translate-y-[220%] group-hover:rotate-[15deg]"
                            style={{ backgroundImage: `url(${group.Pizza[1]})` }}
                        />

                        <div
                            className="absolute w-24 h-32 rounded-2xl bg-cover bg-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl transition-all duration-700 group-hover:translate-x-[-200%] group-hover:-translate-y-[230%] group-hover:rotate-[15deg]"
                            style={{ backgroundImage: `url(${group.Pizza[2]})` }}
                        />

                        <div
                            className="absolute w-24 h-32 rounded-2xl bg-cover bg-center left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-xl transition-all duration-700 group-hover:translate-x-[-280%] group-hover:translate-y-[220%] group-hover:rotate-[-15deg]"
                            style={{ backgroundImage: `url(${group.Pizza[3]})` }}
                        />

                        {/* Big Cards */}
                        <div
                            className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-700 group-hover:-translate-x-[75%] group-hover:translate-y-[16%] group-hover:rotate-[-24deg]"
                            style={{
                                backgroundImage: `url(${group.Burgers[0]})`,
                                transform: "translateX(-10%) rotate(-1deg)",
                            }}
                        />

                        <div
                            className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-700 group-hover:-translate-x-[25%] group-hover:translate-y-[8%] group-hover:rotate-[-8deg]"
                            style={{
                                backgroundImage: `url(${group.Burgers[1]})`,
                                transform: "rotate(2deg)",
                            }}
                        />

                        <div
                            className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-700 group-hover:translate-x-[25%] group-hover:translate-y-[8%] group-hover:rotate-[8deg]"
                            style={{
                                backgroundImage: `url(${group.Burgers[2]})`,
                                transform: "translateX(-6%) rotate(-3deg)",
                            }}
                        />

                        <div
                            className="absolute inset-0 rounded-xl bg-cover bg-center transition-all duration-700 group-hover:translate-x-[75%] group-hover:translate-y-[16%] group-hover:rotate-[24deg]"
                            style={{
                                backgroundImage: `url(${group.Burgers[3]})`,
                                transform: "translate(10%,3%) rotate(5deg)",
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="flex gap-10 mt-16">
                <button
                    onClick={prevSlide}
                    className="w-16 h-16 rounded-full border-2 border-gray-300 text-black flex items-center justify-center"
                >
                    <FaTimes size={20} />
                </button>

                <button
                    onClick={nextSlide}
                    className="w-16 h-16 rounded-full border-2 border-red-500 text-red-700 flex items-center justify-center"
                >
                    <FaHeart size={20} />
                </button>
            </div>
        </div>
    );
}