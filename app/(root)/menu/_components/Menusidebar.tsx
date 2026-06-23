"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { FaCoffee, FaHamburger, FaIceCream, FaLeaf, FaPizzaSlice } from "react-icons/fa";
import { MdRestaurant } from "react-icons/md";

type ApiCategory = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  isActive: boolean;
};

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
};

const iconMap: Record<string, React.ReactNode> = {
  burgers: <FaHamburger className="text-lg" />,
  pizza: <FaPizzaSlice className="text-lg" />,
  asian: <span className="text-lg">🍜</span>,
  healthy: <FaLeaf className="text-lg" />,
  desserts: <FaIceCream className="text-lg" />,
  beverages: <FaCoffee className="text-lg" />,
  cuisines: <MdRestaurant className="text-lg" />,
};

function SidebarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active = searchParams.get("category") || "all";

  const [dbCategories, setDbCategories] = useState<ApiCategory[]>([]);

  useEffect(() => {
    fetch("/api/categories?active=true")
      .then((res) => res.json())
      .then((data) => setDbCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const categories: SidebarItem[] = [
    { id: "all", label: "All", icon: <span className="text-lg">☕</span> },
    ...dbCategories.map((cat) => ({
      id: cat.slug,
      label: cat.name,
      icon: iconMap[cat.slug] || <MdRestaurant className="text-lg" />,
    })),
  ];

  function handleClick(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    const qs = params.toString();
    router.push(qs ? `/menu?${qs}` : "/menu");
  }

  return (
    <aside className="hidden md:block sticky top-0 h-screen w-64 shrink-0 bg-white/80 backdrop-blur-xl shadow-lg border-r border-gray-100 p-5 pt-24 overflow-y-auto z-40">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-8 w-1 rounded-full bg-white" />
        <h2 className="text-xl font-bold text-black">
          Categories
        </h2>
      </div>
      <div className="space-y-1.5">
        {categories.map((a) => {
          const isActive = active === a.id;
          return (
            <button
              key={a.id}
              onClick={() => handleClick(a.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium group ${
                isActive
                  ? "bg-red-700 text-white shadow-md shadow-orange-200 scale-[1.02]"
                  : "text-gray-600 hover:bg-orange-50 hover:text-orange-600"
              }`}
            >
              <span className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-orange-500"} transition-colors`}>
                {a.icon}
              </span>
              {a.label}
            </button>
          );
        })}
      </div>
      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 px-4 leading-relaxed">
        Select a category to browse.
        </p>
      </div>
    </aside>
  );
}

export default function MenuSidebar() {
  return (
    <Suspense fallback={
      <aside className="hidden md:block sticky top-0 h-screen w-64 shrink-0 bg-white p-5 pt-24">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          {Array.from({ length: 8}).map((_, i) => (
            <div key={i} className="h-10 w-full bg-gray-100 rounded-xl" />
          ))}
        </div>
      </aside>
    }>
      <SidebarContent />
    </Suspense>
  );
}
