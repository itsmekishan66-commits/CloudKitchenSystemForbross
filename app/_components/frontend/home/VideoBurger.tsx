"use client";
import { useEffect, useRef, useState } from "react";

const DEFAULT_VIDEO = "/burger2.mp4";

export default function VideoBurger() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoSrc, setVideoSrc] = useState(DEFAULT_VIDEO);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");

    useEffect(() => {
        fetch("/api/site-settings")
            .then((res) => res.json())
            .then((data) => {
                if (data.homeVideoBurger?.url) {
                    setVideoSrc(data.homeVideoBurger.url);
                }
                if (data.homeVideoBurger?.title) {
                    setTitle(data.homeVideoBurger.title);
                }
                if (data.homeVideoBurger?.desc) {
                    setDesc(data.homeVideoBurger.desc);
                }
            })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (videoRef.current) videoRef.current.playbackRate = 0.5;
    }, [videoSrc]);

    return (
        <section className="relative w-full bg-black py-10 overflow-hidden">
            <div className="max-w-6xl mx-auto px-10">
                <div className="text-center mb-14 space-y-1">
                    <span className="inline-block text-red-500 uppercase tracking-[0.2em] text-sm font-semibold">
                        Made Fresh
                    </span>
                    <h3 className="text-white text-2xl md:text-3xl lg:text-5xl font-bold leading-tight">
                        {title || "Every ingredient stacked with love and perfection"}
                    </h3>
                    <p className="text-gray-400 text-md max-w-2xl mx-auto">
                        {desc || "From farm-fresh produce to artisan buns — each layer is carefully selected to bring you the ultimate burger experience."}
                    </p>
                </div>

                <div className="relative w-full max-w-4xl mx-auto aspect-4/3">
                    {/* left fade */}
                    <div className="absolute left-0 top-0 bottom-0 w-1/3 z-10 bg-linear-to-r from-black to-transparent pointer-events-none" />

                    {/* right fade */}
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 z-10 bg-linear-to-l from-black to-transparent pointer-events-none" />

                    {/* top fade */}
                    <div className="absolute -top-10 left-0 right-0 h-1/6 z-10 bg-linear-to-b from-black/60 to-transparent pointer-events-none" />

                    {/* bottom fade */}
                    <div className="absolute bottom-0 left-0 right-0 h-3/4 z-10 bg-linear-to-t from-black via-black/80 to-transparent pointer-events-none" />

                    <video
                        ref={videoRef}
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="none"
                        className="w-full h-full object-cover"
                        onLoadedMetadata={() => {
                            if (videoRef.current) videoRef.current.playbackRate = 0.5;
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
