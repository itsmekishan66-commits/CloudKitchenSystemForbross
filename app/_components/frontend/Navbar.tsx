"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ShoppingCart,
  Search,
  ChevronDown,
  LogOut,
  User,
  Menu,
  X,
} from "lucide-react";
import { useCart } from "./cart/CartContext";
import CartDrawer from "./cart/CartDrawer";
import AuthModal from "../AuthModal";
import useUser from "../../../hooks/useUser";
import toast from "react-hot-toast";
import { safeImageUrl } from "@/lib/image";

export default function Navbar() {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; title: string; price: string; image: string | null }[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [siteName, setSiteName] = useState("Cloud Kitchen");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (data.siteName) setSiteName(data.siteName);
          if (data.logo) setLogoUrl(data.logo);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navSearch.trim()) { return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/menu-items");
        const data = await res.json();
        const q = navSearch.toLowerCase();
        const matches = (data.items || []).filter((item: { id: number; title: string; price: string; image: string | null; isAvailable: boolean }) => item.isAvailable && item.title.toLowerCase().includes(q)
        );
        setSearchResults(matches);
        setSearchOpen(matches.length > 0);
      }
      catch (error) {
        console.error(error);
        toast.error("Failed to search for items");
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [navSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Menu", href: "/menu" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);


  async function handleLogout() {
    await signOut({ redirect: false });
    setMenuOpen(false);
    setMobileOpen(false);
    toast.success("Logged out successfully");
    setTimeout(() => router.push("/login"), 400);
  }

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-transparent shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center font-bold text-red-800">
              {siteName.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="font-bold text-xl whitespace-nowrap">
            {(() => {
              const parts = siteName.split(" ");
              if (parts.length > 1) {
                return <>{parts.slice(0, -1).join(" ")} <span className="text-red-800 text-2xl">{parts[parts.length - 1]}</span></>;
              }
              return <span className="text-red-800 text-2xl">{siteName}</span>;
            })()}
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 font-semibold">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive(link.href)
                ? "bg-red-900 text-white"
                : "text-black hover:bg-white/40 hover:text-red-800"
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Search */}
        <div ref={searchRef} className="hidden lg:relative lg:flex items-center border border-gray-300 rounded-full px-5 py-3 bg-transparent">
          <button
            type="button"
            onClick={() => {
              if (navSearch.trim()) {
                setSearchOpen(false);
                router.push(`/menu?q=${encodeURIComponent(navSearch.trim())}`);
              }
            }}
          >
            <Search size={18} className="text-black hover:text-orange-600" />
          </button>
          <input
            type="text"
            value={navSearch}
            onChange={(e) => setNavSearch(e.target.value)}
            placeholder="Search food..."
            className="outline-none ml-2 bg-transparent text-black text-sm w-40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && navSearch.trim()) {
                setSearchOpen(false);
                router.push(`/menu?q=${encodeURIComponent(navSearch.trim())}`);
              }
            }}
            onFocus={() => { if (searchResults.length > 0) setSearchOpen(true); }}
          />
          {searchOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
              {searchResults.map((item) => (
                <Link
                  key={item.id}
                  href={`/menu?q=${encodeURIComponent(item.title)}`}
                  onClick={() => { setSearchOpen(false); setNavSearch(""); }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {item.image && (
                      <Image src={safeImageUrl(item.image)} alt={item.title} width={40} height={40} className="object-cover h-full w-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                    <p className="text-xs text-orange-600 font-semibold">Rs. {item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">

          {/* Cart */}
          <div onClick={() => setCartOpen(true)} className="text-black relative cursor-pointer">
            <ShoppingCart size={25} />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:block">
            {loading ? null : user ? (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-red-900 text-white px-5 py-2 rounded-full hover:bg-red-800 transition-all duration-300"
                >
                  Hi, {user.name.split(" ")[0]}
                  <ChevronDown size={16} />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/user/dashboard");
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User size={16} />
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="bg-red-900 text-white px-5 py-2 rounded-full hover:bg-red-800 transition-all duration-300">
                <Link href="/login">Sign In</Link>
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="hide-on-desktop z-100 top-10 text-black"
          >
            {mobileOpen ? <X size={26} /> : <Menu size={26} />}
          </button>

        </div>

      </div>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="hide-on-desktop fixed inset-0 top-15 z-40 flex flex-col h-100" style={{ backgroundColor: "white" }}>
          <div className="flex flex-col items-center gap-4 mt-5 font-semibold text-lg">

            {/* Mobile Search */}
            {/* <div className="flex items-center border border-gray-300 rounded-full px-4 py-2.5 w-72 bg-gray-50">
              <Search size={16} className="text-gray-500" />
              <input
                type="text"
                value={navSearch}
                onChange={(e) => setNavSearch(e.target.value)}
                placeholder="Search food..."
                className="outline-none ml-2 bg-transparent text-sm w-full"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && navSearch.trim()) {
                    setMobileOpen(false);
                    router.push(`/menu?q=${encodeURIComponent(navSearch.trim())}`);
                  }
                }}
              />
            </div> */}

            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`px-6 py-2 rounded-full transition-all duration-300 ${isActive(link.href)
                  ? "bg-red-900 text-white"
                  : "text-black hover:bg-gray-100"
                  }`}
              >
                {link.name}
              </Link>
            ))}

            <hr className="w-40 border-gray-300" />

            {loading ? null : user ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    router.push("/user/dashboard");
                  }}
                  className="flex items-center gap-2 text-gray-700"
                >
                  <User size={20} />
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  router.push("/login");
                }}
                className="bg-red-900 text-white px-8 py-3 rounded-full hover:bg-red-800 transition-all duration-300"
              >
                Sign In
              </button>
            )}

          </div>
        </div>
      )}

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
}
