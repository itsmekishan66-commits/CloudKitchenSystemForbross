"use client";

import { Eye } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "../cart/CartContext";
import toast from "react-hot-toast";
import { safeImageUrl } from "@/lib/image";
import { dedupedFetch } from "@/lib/fetchCache";

type ApiMenuItem = {
    id: number;
    title: string;
    image: string | null;
    description: string | null;
    price: string;
    discountPercent: string | null;
    addons: { name: string; price: number }[] | null;
};

type SliderItem = {
    id: number;
    title: string;
    image: string;
    price: number;
    originalPrice?: number;
    description: string;
    discountPercent: number;
    addons: { name: string; price: number }[];
};

const fallbackCards: SliderItem[] = [
    { id: -1, title: "Classic Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1200", price: 0, description: "Juicy beef patty with fresh lettuce, tomato, and our secret sauce.", discountPercent: 0, addons: [] },
    { id: -2, title: "Pepperoni Pizza", image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=1200", price: 0, description: "Loaded with mozzarella and premium pepperoni on a crispy crust.", discountPercent: 0, addons: [] },
    { id: -3, title: "Chicken Tacos", image: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=1200", price: 0, description: "Spiced chicken with salsa, guacamole, and sour cream in a warm tortilla.", discountPercent: 0, addons: [] },
    { id: -4, title: "Grilled Salmon", image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=1200", price: 0, description: "Perfectly seared salmon fillet with lemon butter and herbs.", discountPercent: 0, addons: [] },
    { id: -5, title: "Caesar Salad", image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=1200", price: 0, description: "Crisp romaine, parmesan, croutons, and creamy Caesar dressing.", discountPercent: 0, addons: [] },
    { id: -6, title: "Chocolate Lava", image: "https://images.unsplash.com/photo-1624353365286-3f8d62daad51?q=80&w=1200", price: 0, description: "Warm molten chocolate cake with vanilla ice cream.", discountPercent: 0, addons: [] },
    { id: -7, title: "Iced Latte", image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=1200", price: 0, description: "Rich espresso over chilled milk with a smooth finish.", discountPercent: 0, addons: [] },
    { id: -8, title: "Berry Pancakes", image: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=1200", price: 0, description: "Fluffy pancakes stacked high with fresh berries and maple syrup.", discountPercent: 0, addons: [] },
    { id: -9, title: "Sushi Platter", image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=1200", price: 0, description: "Fresh assorted sushi with premium cuts of fish and rice.", discountPercent: 0, addons: [] },
    { id: -10, title: "Mango Smoothie", image: "https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?q=80&w=1200", price: 0, description: "Refreshing mango smoothie blended with yogurt and honey.", discountPercent: 0, addons: [] },
    { id: -11, title: "Pasta Alfredo", image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?q=80&w=1200", price: 0, description: "Creamy fettuccine alfredo with parmesan and fresh herbs.", discountPercent: 0, addons: [] },
];

export default function CurvedLoopCarousel() {
    const router = useRouter();
    const { addToCart } = useCart();

    const [items, setItems] = useState<SliderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState(0);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const data = await dedupedFetch<{ items: ApiMenuItem[] }>("/api/menu-items?available=true");

                const mapped: SliderItem[] = (data.items || []).map((item: ApiMenuItem) => {
                    const basePrice = Number(item.price);
                    const discountPct = item.discountPercent ? Number(item.discountPercent) : 0;
                    const discountedPrice = discountPct > 0
                        ? basePrice - (basePrice * discountPct) / 100
                        : basePrice;

                    return {
                        id: item.id,
                        title: item.title,
                        image: item.image || "",
                        price: Math.round(discountedPrice * 100) / 100,
                        originalPrice: discountPct > 0 ? basePrice : undefined,
                        description: item.description || "",
                        discountPercent: discountPct,
                        addons: Array.isArray(item.addons)
                            ? item.addons.map((a) => ({ name: a.name, price: Number(a.price) }))
                            : [],
                    };
                });

                setItems(mapped);
                if (mapped.length > 0) {
                    setActive(Math.min(4, mapped.length - 1));
                }
            } catch (err) {
                console.error("Failed to load menu items", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const total = items.length;
    const rotationCount = total > 0 ? total : fallbackCards.length;

    const handleAddToCart = (item: SliderItem) => {
        if (item.addons.length > 0) {
            router.push("/menu");
            return;
        }
        addToCart({
            id: String(item.id),
            title: item.title,
            image: item.image,
            price: item.price,
            originalPrice: item.originalPrice,
            discountPercent: item.discountPercent > 0 ? item.discountPercent : undefined,
            quantity: 1,
        });
        toast.success(`Added ${item.title} to cart`);
    };

    useEffect(() => {
        if (rotationCount === 0) return;
        const id = setInterval(() => {
            setActive((prev) => (prev + 1) % rotationCount);
        }, 4000);
        return () => clearInterval(id);
    }, [rotationCount]);

    const renderCarousel = (carouselItems: SliderItem[], carouselTotal: number) => {
        const getCarouselOffset = (index: number) => {
            let diff = index - active;
            if (diff > carouselTotal / 2) diff -= carouselTotal;
            if (diff < -carouselTotal / 2) diff += carouselTotal;
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
                    {carouselItems.map((item, index) => {
                        const offset = getCarouselOffset(index);
                        const x = offset * 180;
                        const y = Math.abs(offset) * 24;
                        const z = Math.abs(offset) * -80;
                        const rotateY = offset * -15;
                        const baseScale = offset === 0 ? 1 : 0.88;
                        const hoverScale = hovered === index ? 1.12 : 1;
                        const finalScale = baseScale * hoverScale;

                        const moveToCenter = (clickedIndex: number) => {
                            let diff = clickedIndex - active;
                            if (diff > carouselTotal / 2) diff -= carouselTotal;
                            if (diff < -carouselTotal / 2) diff += carouselTotal;
                            setActive((prev) => (prev + diff + carouselTotal) % carouselTotal);
                        };

                        return (
                            <div
                                key={item.id}
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
                                    zIndex: hovered === index ? 999 : carouselTotal - Math.abs(offset),
                                }}
                            >
                                <div className="relative h-full w-full overflow-hidden rounded-[30px] shadow-2xl">
                                    <Image src={safeImageUrl(item.image)} alt={item.title}
                                        fill
                                        className="object-cover"
                                        priority
                                    />

                                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent" />

                                    {item.discountPercent > 0 && (
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            {item.discountPercent}% OFF
                                        </div>
                                    )}

                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                        <p className="text-lg font-bold">{item.title}</p>
                                        <p className="text-sm text-gray-300 line-clamp-1">{item.description}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            {item.originalPrice ? (
                                                <>
                                                    <p className="text-xl font-bold">₹{item.price}</p>
                                                    <p className="text-sm text-gray-400 line-through">₹{item.originalPrice}</p>
                                                </>
                                            ) : (
                                                <p className="text-xl font-bold">₹{item.price}</p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push("/menu");
                                        }}
                                        className="absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90"
                                    >
                                        <Eye className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAddToCart(item);
                                        }}
                                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white text-2xl font-bold flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-3 mt-6">
                    {carouselItems.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => setActive(i)}
                            className={`
                                rounded-full transition-all duration-300
                                ${i === active ? "bg-white w-6 h-2" : "bg-gray-600 w-2 h-2"}
                            `}
                        />
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="w-full h-screen bg-black overflow-hidden flex items-center justify-center">
                <div className="animate-pulse text-gray-500 text-lg">Loading menu...</div>
            </div>
        );
    }

    if (total === 0) {
        return renderCarousel(fallbackCards, fallbackCards.length);
    }

    return renderCarousel(items, total);
}
