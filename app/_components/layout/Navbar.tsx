"use client";

import Link from "next/link";
import { ShoppingCart, Search } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-orange-100 h-10 w-10 rounded-full flex items-center justify-center">
            MK
          </div>

          <h1 className="font-bold text-xl">Mama's Kitchen</h1>
        </div>

        <div className="hidden md:flex gap-10 font-medium">
          <Link href="/">Home</Link>

          <Link href="/about">About</Link>

          <Link href="/menu">Menu</Link>

          <Link href="/contact">Contact</Link>
        </div>

        <div className="hidden lg:flex items-center border rounded-full px-4 py-2">
          <Search size={18} />

          <input
            type="text"
            placeholder="Search"
            className="outline-none ml-2"
          />
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <ShoppingCart size={24} />

            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center">
              0
            </span>
          </div>

          <button className="bg-red-900 text-white px-5 py-2 rounded-full">
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
}
