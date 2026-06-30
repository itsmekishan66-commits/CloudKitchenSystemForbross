"use client";

import Link from "next/link";
import { useEffect, useState, FormEvent } from "react";
import toast from "react-hot-toast";
import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaPaperPlane,
} from "react-icons/fa";

export default function Footer() {
  const [siteName, setSiteName] = useState("Cloud Kitchen");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          if (data.siteName) setSiteName(data.siteName);
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.location) setLocation(data.location);
        }
      })
      .catch(() => { });
  }, []);

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);

  const handleNewsletter = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setNewsletterLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to subscribe");
        return;
      }
      toast.success("Subscribed to newsletter!");
      setNewsletterEmail("");
    } catch {
      toast.error("Something went wrong");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const mainName = siteName.split(" ").slice(0, -1).join(" ");
  const lastName = siteName.split(" ").pop() || "";

  return (
    <footer className="bg-zinc-950 text-white">

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-20">

        <div className="grid lg:grid-cols-5 md:grid-cols-2 gap-12">

          {/* Brand */}
          <div className="lg:col-span-2">

            <h2 className="text-3xl font-bold">
              {mainName}
              <span className="text-red-600"> {lastName}</span>
            </h2>

            <p className="mt-5 text-zinc-400 leading-relaxed max-w-md">
              Freshly prepared meals delivered directly from our cloud
              kitchen to your doorstep. Fast delivery, premium ingredients,
              and unforgettable flavors.
            </p>

            {/* Socials */}
            <div className="flex gap-4 mt-8">

              <a href="#"
                className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-red-700 flex items-center justify-center transition"
              >
                <FaFacebookF />
              </a>

              <a href="#"
                className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-red-700 flex items-center justify-center transition"
              >
                <FaInstagram />
              </a>

              <a href="#"
                className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-red-700 flex items-center justify-center transition"
              >
                <FaTwitter />
              </a>

              <a href="#"
                className="w-11 h-11 rounded-full bg-zinc-900 hover:bg-red-700 flex items-center justify-center transition"
              >
                <FaYoutube />
              </a>

            </div>

          </div>

          {/* Quick Links */}
          <div>

            <h3 className="text-lg font-semibold mb-5"> Quick Links </h3>

            <ul className="space-y-3 text-zinc-400">
              <li> <Link href="/" className="hover:text-red-500 transition" > Home </Link> </li>
              <li> <Link href="/about" className="hover:text-red-500 transition" > About Us </Link> </li>
              <li> <Link href="/menu" className="hover:text-red-500 transition" > Menu </Link> </li>
              <li> <Link href="/contact" className="hover:text-red-500 transition" > Contact </Link> </li>
            </ul>

          </div>

          {/* Contact */}
          <div>

            <h3 className="text-lg font-semibold mb-5">
              Contact
            </h3>

            <div className="space-y-4 text-zinc-400">

              <div className="flex gap-3">
                <FaMapMarkerAlt className="text-red-500 mt-1" />
                <p>{location || "Biratnagar, Nepal"}</p>
              </div>

              <div className="flex gap-3">
                <FaPhoneAlt className="text-red-500 mt-1" />
                <p>{contactPhone || "+977 9800000000"}</p>
              </div>

              <div className="flex gap-3">
                <FaEnvelope className="text-red-500 mt-1" />
                <p>{contactEmail || "hello@example.com"}</p>
              </div>

            </div>

          </div>

          {/* Newsletter */}
          <div>

            <h3 className="text-lg font-semibold mb-5">
              Newsletter
            </h3>

            <p className="text-zinc-400 mb-4">
              Subscribe for offers, discounts and new menu updates.
            </p>

            <form onSubmit={handleNewsletter} className="relative">

              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Your Email"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 pr-12 outline-none focus:border-orange-500"
                suppressHydrationWarning
              />

              <button
                type="submit"
                disabled={newsletterLoading}
                className="absolute right-2 top-2 bg-red-500 hover:bg-orange-600 disabled:opacity-60 p-2 rounded-lg transition"
              >
                <FaPaperPlane />
              </button>

            </form>

          </div>

        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-zinc-800" />

      {/* Bottom Footer */}
      <div className="max-w-7xl mx-auto px-6 py-6">

        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-zinc-500 text-sm">
            &copy; {new Date().getFullYear()} {siteName}. All rights
          </p>

          <div className="flex gap-6 text-sm text-zinc-500">

            <Link
              href="/privacy-policy"
              className="hover:text-orange-500 transition"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="hover:text-orange-500 transition"
            >
              Terms & Conditions
            </Link>

          </div>

        </div>

      </div>
    </footer>
  );
}
