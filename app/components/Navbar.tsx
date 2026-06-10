"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search } from "lucide-react";
import { useCart } from "../context/CartContext";
import CartDrawer from "../cart/CartDrawer";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const { cartCount } = useCart();
  const pathname = usePathname();
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Menu", href: "/menu" },
    { name: "Contact", href: "/contact" },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-transparent shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center font-bold text-red-800">
            MK
          </div>

          <h1 className="font-bold text-xl">
            Mama&apos;s{" "}
            <span className="text-red-800 text-2xl">
              Kitchen
            </span>
          </h1>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 font-semibold">

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-full transition-all duration-300 ${
                isActive(link.href)
                  ? "bg-red-900 text-white"
                  : "text-black hover:bg-white/40 hover:text-red-800"
              }`}
            >
              {link.name}
            </Link>
          ))}

        </div>

        {/* Search */}
        <div className="hidden lg:flex items-center border border-gray-300 rounded-full px-5 py-3 bg-transparent">

          <Search size={18} className="text-black" />

          <input
            type="text"
            placeholder="Search food..."
            className="outline-none ml-2 bg-transparent text-black text-sm"
          />

        </div>

        {/* Right Side */}
        <div className="flex items-center gap-5">

          <div onClick={() => setCartOpen(true)} className="text-black relative cursor-pointer">
            <ShoppingCart size={25} />

            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          </div>

          <button onClick={() => setAuthOpen(true)} className="bg-red-900 text-white px-5 py-2 rounded-full hover:bg-red-800 transition-all duration-300">
            Sign Up
          </button>

        </div>

      </div>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
}