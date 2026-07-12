"use client";
import { useEffect, useRef } from "react";

export default function HandShake() {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = 0.5;
    }, []);

    return (
        <section className="relative w-full bg-black py-10 overflow-hidden">
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-14 space-y-4">
                    <span className="inline-block text-red-500 uppercase tracking-[0.2em] text-sm font-semibold">
                        Our Promise
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl lg:text-5xl font-bold leading-tight">
                        Trust us with quality and <br /> we promise you the best in class
                    </h3>
                    <p className="text-gray-400 text-md max-w-2xl mx-auto">
                        Every dish is crafted with hand-picked ingredients, prepared by expert chefs,
                        and delivered fresh to your doorstep — because you deserve nothing less.
                    </p>
                </div>

                <div className="relative w-full max-w-4xl mx-auto aspect-video">
                    {/* left fade */}
                    <div className="absolute left-0 top-0 bottom-0 w-1/4 z-10 bg-linear-to-r from-black to-transparent pointer-events-none" />

                    {/* right fade */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/4 z-10 bg-linear-to-l from-black to-transparent pointer-events-none" />

                    <video
                        ref={videoRef}
                        src="https://framerusercontent.com/assets/RBllAHQ2Pc4q24t5z2RtzjLI.mp4"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="none"
                        className="w-full h-full object-cover object-top"
                        onLoadedMetadata={() => {
                            if (videoRef.current) videoRef.current.playbackRate = 0.5;
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
