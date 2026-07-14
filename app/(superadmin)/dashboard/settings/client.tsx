"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  User,
  Store,
  Phone,
  Mail,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { usePermissions } from "@/lib/permission-context";
import toast from "react-hot-toast";

const cardClass =
  "bg-white rounded-2xl shadow-sm border border-gray-100 p-6";

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

function Msg({ messages, section }: { messages: Record<string, string>; section: string }) {
  const msg = messages[section];
  if (!msg) return null;
  const isError = msg.startsWith("✗");
  const isNeutral = msg === "No changes";
  return (
    <span className={`text-sm ${isError ? "text-red-500" : isNeutral ? "text-gray-400" : "text-green-600"}`}>
      {msg}
    </span>
  );
}

export default function SettingsClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const initial = useRef<Record<string, unknown>>({});

  // Admin profile
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Restaurant details
  const [restaurantName, setRestaurantName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");

  // Contact details
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [location, setLocation] = useState("");
  const [deliveryAreas, setDeliveryAreas] = useState("");

  // About content
  const [heroBadge, setHeroBadge] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [storyTitle, setStoryTitle] = useState("");
  const [storyParagraphs, setStoryParagraphs] = useState("");

  // Contact content
  const [contactHeroBadge, setContactHeroBadge] = useState("");
  const [contactHeroDescription, setContactHeroDescription] = useState("");
  const [hoursWeekday, setHoursWeekday] = useState("");
  const [hoursSaturday, setHoursSaturday] = useState("");
  const [hoursSunday, setHoursSunday] = useState("");

  // Homepage Videos
  const [homeVideoBurgerUrl, setHomeVideoBurgerUrl] = useState("");
  const [homeVideoBurgerTitle, setHomeVideoBurgerTitle] = useState("");
  const [homeVideoBurgerDesc, setHomeVideoBurgerDesc] = useState("");
  const [homeVideoBurgerFile, setHomeVideoBurgerFile] = useState<File | null>(null);
  const [sliderVideos, setSliderVideos] = useState<{ url: string; title: string; desc: string }[]>([
    { url: "", title: "", desc: "" },
    { url: "", title: "", desc: "" },
    { url: "", title: "", desc: "" },
    { url: "", title: "", desc: "" },
    { url: "", title: "", desc: "" },
  ]);
  const [sliderVideoFiles, setSliderVideoFiles] = useState<(File | null)[]>([
    null, null, null, null, null,
  ]);
  
  //to download the file
  // const [open, setOpen] = useState(false);
  //  const handleDownload = (type: string) => {
  //   if (type) {
  //     window.open(`/api/exports/${type}`, "_blank");
  //   }
  // };


  useEffect(() => {
    fetch("/api/superadmin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) return;

        const sv = data.home3dSliderVideos;
        const padded = Array.isArray(sv) && sv.length > 0
          ? sv.concat(Array(Math.max(0, 5 - sv.length)).fill({ url: "", title: "", desc: "" })).slice(0, 5)
          : [{ url: "", title: "", desc: "" }, { url: "", title: "", desc: "" }, { url: "", title: "", desc: "" }, { url: "", title: "", desc: "" }, { url: "", title: "", desc: "" }];

        initial.current = {
          name: data.superAdminName ?? "",
          email: data.superAdminEmail ?? "",
          phone: data.superAdminPhone ?? "",
          address: data.superAdminAddress ?? "",
          restaurantName: data.appName ?? "",
          logoPreview: data.logo ?? "",
          contactEmail: data.contactEmail ?? "",
          contactPhone: data.contactPhone ?? "",
          location: data.location ?? "",
          deliveryAreas: Array.isArray(data.contactContent?.deliveryAreas) ? data.contactContent.deliveryAreas.join(", ") : "",
          heroBadge: data.aboutContent?.heroBadge || "",
          heroDescription: data.aboutContent?.heroDescription || "",
          storyTitle: data.aboutContent?.storyTitle || "",
          storyParagraphs: Array.isArray(data.aboutContent?.storyParagraphs) ? data.aboutContent.storyParagraphs.join("\n\n") : "",
          contactHeroBadge: data.contactContent?.heroBadge || "",
          contactHeroDescription: data.contactContent?.heroDescription || "",
          hoursWeekday: data.contactContent?.hoursWeekday || "",
          hoursSaturday: data.contactContent?.hoursSaturday || "",
          hoursSunday: data.contactContent?.hoursSunday || "",
          homeVideoBurgerUrl: data.homeVideoBurger?.url || "",
          homeVideoBurgerTitle: data.homeVideoBurger?.title || "",
          homeVideoBurgerDesc: data.homeVideoBurger?.desc || "",
          sliderVideos: JSON.stringify(padded),
        };

        setName(data.superAdminName ?? "");
        setEmail(data.superAdminEmail ?? "");
        setPhone(data.superAdminPhone ?? "");
        setAddress(data.superAdminAddress ?? "");
        setRestaurantName(data.appName ?? "");
        setLogoPreview(data.logo ?? "");
        setContactEmail(data.contactEmail ?? "");
        setContactPhone(data.contactPhone ?? "");
        setLocation(data.location ?? "");

        const ac = data.aboutContent;
        if (ac) {
          setHeroBadge(ac.heroBadge || "");
          setHeroDescription(ac.heroDescription || "");
          setStoryTitle(ac.storyTitle || "");
          setStoryParagraphs(Array.isArray(ac.storyParagraphs) ? ac.storyParagraphs.join("\n\n") : "");
        }

        const cc = data.contactContent;
        if (cc) {
          setContactHeroBadge(cc.heroBadge || "");
          setContactHeroDescription(cc.heroDescription || "");
          setHoursWeekday(cc.hoursWeekday || "");
          setHoursSaturday(cc.hoursSaturday || "");
          setHoursSunday(cc.hoursSunday || "");
          setDeliveryAreas(Array.isArray(cc.deliveryAreas) ? cc.deliveryAreas.join(", ") : "");
        }

        if (data.homeVideoBurger) {
          setHomeVideoBurgerUrl(data.homeVideoBurger.url || "");
          setHomeVideoBurgerTitle(data.homeVideoBurger.title || "");
          setHomeVideoBurgerDesc(data.homeVideoBurger.desc || "");
        }
        setHomeVideoBurgerFile(null);
        if (Array.isArray(sv) && sv.length > 0) {
          setSliderVideos(padded);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function saveSection(section: string, body: FormData | object) {
    setSaving(prev => ({ ...prev, [section]: true }));
    setMessages(prev => ({ ...prev, [section]: "" }));

    try {
      const isFormData = body instanceof FormData;
      const res = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        ...(isFormData ? { body } : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      });

      const data = await res.json();
      if (data.error) {
        setMessages(prev => ({ ...prev, [section]: data.error }));
      } else {
        setMessages(prev => ({ ...prev, [section]: "✓ Saved" }));
      }
    } catch {
      setMessages(prev => ({ ...prev, [section]: "✗ Failed" }));
    } finally {
      setSaving(prev => ({ ...prev, [section]: false }));
    }
  }

  function handleSaveAdmin() {
    if (!hasChanges("admin")) { setMessages(prev => ({ ...prev, admin: "No changes" })); return; }
    const fd = new FormData();
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("address", address);
    saveSection("admin", fd);
  }

  function handleSaveRestaurant() {
    if (!hasChanges("restaurant")) { setMessages(prev => ({ ...prev, restaurant: "No changes" })); return; }
    const fd = new FormData();
    fd.append("restaurantName", restaurantName);
    if (logo) fd.append("logo", logo);
    saveSection("restaurant", fd);
  }

  function handleSaveContact() {
    if (!hasChanges("contact")) { setMessages(prev => ({ ...prev, contact: "No changes" })); return; }
    const fd = new FormData();
    fd.append("contactEmail", contactEmail);
    fd.append("contactPhone", contactPhone);
    fd.append("location", location);
    saveSection("contact", fd);
  }

  function handleSaveAbout() {
    if (!hasChanges("about")) { setMessages(prev => ({ ...prev, about: "No changes" })); return; }
    saveSection("about", {
      aboutContent: {
        heroBadge,
        heroHeading: "Fresh Food.",
        heroHeadingAccent: "Delivered Fast.",
        heroDescription,
        stats: [
          { value: "10K+", label: "Orders Delivered" },
          { value: "500+", label: "Daily Customers" },
          { value: "4.9\u2605", label: "Customer Rating" },
          { value: "30 min", label: "Average Delivery" },
        ],
        storySectionTitle: "Our Story",
        storyTitle,
        storyParagraphs: storyParagraphs
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean),
        storyImage: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200",
        featuresTitle: "Why Customers Love Us",
        featuresSubtitle: "More than just food delivery.",
        features: [
          { title: "Premium Ingredients", desc: "Fresh ingredients sourced daily." },
          { title: "Fast Delivery", desc: "Delivered quickly and safely." },
          { title: "Always On Time", desc: "Efficient kitchen workflow." },
          { title: "Healthy Choices", desc: "Nutritious options for everyone." },
        ],
        processTitle: "How It Works",
        process: [
          { number: "01", title: "Choose Your Meal", desc: "Browse our curated menu." },
          { number: "02", title: "We Prepare It", desc: "Freshly cooked by expert chefs." },
          { number: "03", title: "Delivered To You", desc: "Fast delivery to your doorstep." },
        ],
        testimonialsTitle: "Customer Reviews",
        testimonials: [
          { text: "Amazing food quality, quick delivery, and excellent packaging. Highly recommended!", name: "Happy Customer", title: "Food Lover" },
          { text: "Great variety and always fresh. My go-to for office lunches!", name: "Satisfied Client", title: "Regular Customer" },
          { text: "The best cloud kitchen in town. Never been disappointed!", name: "Food Enthusiast", title: "Verified Buyer" },
        ],
        ctaTitle: "Ready to Taste Something Amazing?",
        ctaDescription: "Join thousands of happy customers ordering delicious meals every day.",
        ctaButtonText: "Order Now",
      },
    });
  }

  function handleSaveContactPage() {
    if (!hasChanges("contactPage")) { setMessages(prev => ({ ...prev, contactPage: "No changes" })); return; }
    saveSection("contactPage", {
      contactContent: {
        heroBadge: contactHeroBadge,
        heroHeading: "We'd Love To",
        heroHeadingAccent: "Hear From You",
        heroDescription: contactHeroDescription,
        deliveryAreas: deliveryAreas.split(",").map((s) => s.trim()).filter(Boolean),
        hoursWeekday,
        hoursSaturday,
        hoursSunday,
        ctaTitle: "Hungry Right Now?",
        ctaDescription: "Browse our menu and get delicious meals delivered to your doorstep in minutes.",
        ctaButtonText: "Order Now",
      },
    });
  }

  function handleSaveVideos() {
    if (!hasChanges("videos")) { setMessages(prev => ({ ...prev, videos: "No changes" })); return; }
    const fd = new FormData();
    if (homeVideoBurgerFile) fd.append("homeVideoBurgerFile", homeVideoBurgerFile);
    fd.append("homeVideoBurger", JSON.stringify({
      url: homeVideoBurgerUrl,
      title: homeVideoBurgerTitle,
      desc: homeVideoBurgerDesc,
    }));
    const activeVideos = sliderVideos.filter((v, i) => v.url.trim() !== "" || sliderVideoFiles[i] !== null);
    fd.append("home3dSliderVideos", JSON.stringify(activeVideos));
    sliderVideoFiles.forEach((file, i) => {
      if (file) fd.append(`sliderVideoFile_${i}`, file);
    });
    saveSection("videos", fd);
  }

  function hasChanges(section: string): boolean {
    const init = initial.current;
    switch (section) {
      case "admin": return init.name !== name || init.email !== email || init.phone !== phone || init.address !== address;
      case "restaurant": return init.restaurantName !== restaurantName || !!logo;
      case "contact": return init.contactEmail !== contactEmail || init.contactPhone !== contactPhone || init.location !== location || init.deliveryAreas !== deliveryAreas;
      case "about": return init.heroBadge !== heroBadge || init.heroDescription !== heroDescription || init.storyTitle !== storyTitle || init.storyParagraphs !== storyParagraphs;
      case "contactPage": return init.contactHeroBadge !== contactHeroBadge || init.contactHeroDescription !== contactHeroDescription || init.hoursWeekday !== hoursWeekday || init.hoursSaturday !== hoursSaturday || init.hoursSunday !== hoursSunday;
      case "videos": return init.homeVideoBurgerUrl !== homeVideoBurgerUrl || init.homeVideoBurgerTitle !== homeVideoBurgerTitle || init.homeVideoBurgerDesc !== homeVideoBurgerDesc || !!homeVideoBurgerFile || JSON.stringify(sliderVideos) !== init.sliderVideos || sliderVideoFiles.some(f => f !== null);
      default: return true;
    }
  }



  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">

        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">System Settings</h1>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">
              Manage admin, restaurant and website settings
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            {/* <button onClick={() => setOpen(true)} className=" flex gap-2 rounded-xl bg-orange-500 px-5 py-3 text-white font-semibold hover:bg-orange-600"><CircleArrowDown />
              <select onChange={(e) => handleDownload(e.target.value)} className="bg-transparent cursor-pointer">
                <option className="text-black" value="">Export</option>
                <option className="text-black" value="pdf">PDF</option>
                <option className="text-black" value="csv">CSV</option>
                <option className="text-black" value="excel">Excel</option>
              </select>
            </button> */}
          </div>
        </div>

        <div className="grid gap-6">

          {/* Admin */}
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-2">
              <User size={20} />
              <h2 className="font-bold text-lg">Admin Profile</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Address" className={`${inputClass} md:col-span-1`} disabled={!can("UPDATE_SETTINGS")} />
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveAdmin} disabled={saving["admin"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["admin"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="admin" />
              </div>
            )}
          </div>

          {/* Restaurant */}
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-2">
              <Store size={20} />
              <h2 className="font-bold text-lg">Restaurant Details</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurant Name" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              <div className="rounded-xl border border-dashed border-gray-300 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon size={18} />
                  Upload Logo
                </div>
                <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} disabled={!can("UPDATE_SETTINGS")} />
                {logoPreview && !logo && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  </div>
                )}
              </div>
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveRestaurant} disabled={saving["restaurant"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["restaurant"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="restaurant" />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-2">
              <Phone size={20} />
              <h2 className="font-bold text-lg">Contact Information</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-4 text-gray-400" />
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" className={`${inputClass} pl-10`} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={`${inputClass} pl-10`} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <input value={deliveryAreas} onChange={(e) => setDeliveryAreas(e.target.value)} placeholder="Delivery Areas (comma separated)" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveContact} disabled={saving["contact"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["contact"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="contact" />
              </div>
            )}
          </div>

          {/* About Page Content */}
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="font-bold text-lg">About Page Content</h2>
              <p className="text-sm text-gray-500">Customize the About page text</p>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Badge</label>
                <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="Nepal's Favorite Cloud Kitchen" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Description</label>
                <textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={3} placeholder="Describe your kitchen..." className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Story Title</label>
                <input value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="Built for the Digital Food Era" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Story Paragraphs (separate with blank line)</label>
                <textarea value={storyParagraphs} onChange={(e) => setStoryParagraphs(e.target.value)} rows={4} placeholder="Paragraph 1&#10;&#10;Paragraph 2&#10;&#10;Paragraph 3" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveAbout} disabled={saving["about"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["about"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="about" />
              </div>
            )}
          </div>

          {/* Contact Page Content */}
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="font-bold text-lg">Contact Page Content</h2>
              <p className="text-sm text-gray-500">Customize the Contact page text</p>
            </div>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Badge</label>
                <input value={contactHeroBadge} onChange={(e) => setContactHeroBadge(e.target.value)} placeholder="Contact Us" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Description</label>
                <textarea value={contactHeroDescription} onChange={(e) => setContactHeroDescription(e.target.value)} rows={3} placeholder="Describe your contact page..." className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Mon-Fri)</label>
                  <input value={hoursWeekday} onChange={(e) => setHoursWeekday(e.target.value)} placeholder="9:00 AM - 11:00 PM" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Saturday)</label>
                  <input value={hoursSaturday} onChange={(e) => setHoursSaturday(e.target.value)} placeholder="10:00 AM - 11:00 PM" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Sunday)</label>
                  <input value={hoursSunday} onChange={(e) => setHoursSunday(e.target.value)} placeholder="10:00 AM - 10:00 PM" className={inputClass} disabled={!can("UPDATE_SETTINGS")} />
                </div>
              </div>
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveContactPage} disabled={saving["contactPage"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["contactPage"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="contactPage" />
              </div>
            )}
          </div>

          {/* Homepage Videos */}
          <div className={cardClass}>
            <div className="mb-5">
              <h2 className="font-bold text-lg">Homepage Videos</h2>
              <p className="text-sm text-gray-500">Manage videos displayed on the homepage</p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-md mb-3 text-gray-700">Featured Video (VideoBurger Section)</h3>
              <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center">
                <input
                  value={homeVideoBurgerUrl}
                  onChange={(e) => {
                    if (homeVideoBurgerFile) {
                      toast.error("Cannot set URL while a file is uploaded");
                      return;
                    }
                    setHomeVideoBurgerUrl(e.target.value);
                  }}
                  placeholder="Upload Landscape (e.g., /videos/featured.mp4)"
                  className={inputClass}
                  disabled={!can("UPDATE_SETTINGS")}
                />
                <input
                  value={homeVideoBurgerTitle}
                  onChange={(e) => setHomeVideoBurgerTitle(e.target.value)}
                  placeholder="Video Title (optional)"
                  className={inputClass}
                  disabled={!can("UPDATE_SETTINGS")}
                />
                <input
                  value={homeVideoBurgerDesc}
                  onChange={(e) => setHomeVideoBurgerDesc(e.target.value)}
                  placeholder="Video Description (optional)"
                  className={inputClass}
                  disabled={!can("UPDATE_SETTINGS")}
                />
                <div className="flex flex-col gap-1">
                  <label className={`flex items-center gap-2 px-3 py-3 rounded-xl border border-dashed border-gray-300 cursor-pointer text-sm text-gray-500 hover:border-orange-400 ${!can("UPDATE_SETTINGS") ? "opacity-50 pointer-events-none" : ""}`}>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      disabled={!can("UPDATE_SETTINGS")}
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        if (file) {
                          const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
                          if (!validTypes.includes(file.type)) {
                            alert("Only MP4, WebM, and MOV files are supported.");
                            e.target.value = "";
                            return;
                          }
                          if (file.size > 50 * 1024 * 1024) {
                            alert("File size must be under 50MB.");
                            e.target.value = "";
                            return;
                          }
                        }
                        if (homeVideoBurgerUrl) {
                          toast.error("Cannot upload when a URL is set");
                          e.target.value = "";
                          return;
                        }
                        setHomeVideoBurgerFile(file);
                      }}
                    />
                    {homeVideoBurgerFile?.name || "Upload"}
                  </label>
                  <span className="text-xs text-gray-400 ml-1">MP4, WebM, MOV · max 50MB</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-md mb-3 text-gray-700">3D Slider Videos (up to 5)</h3>
              <div className="grid gap-3">
                {sliderVideos.map((video, index) => (
                  <div key={index} className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 items-center">
                    <input
                      value={video.url}
                      onChange={(e) => {
                        if (sliderVideoFiles[index]) {
                          toast.error(`Cannot set URL for Video ${index + 1} while a file is uploaded`);
                          return;
                        }
                        const updated = [...sliderVideos];
                        updated[index] = { ...updated[index], url: e.target.value };
                        setSliderVideos(updated);
                      }}
                      placeholder={`Video ${index + 1} URL`}
                      className={inputClass}
                      disabled={!can("UPDATE_SETTINGS")}
                    />
                    <input
                      value={video.title}
                      onChange={(e) => {
                        const updated = [...sliderVideos];
                        updated[index] = { ...updated[index], title: e.target.value };
                        setSliderVideos(updated);
                      }}
                      placeholder={`Title ${index + 1} (optional)`}
                      className={inputClass}
                      disabled={!can("UPDATE_SETTINGS")}
                    />
                    <input
                      value={video.desc}
                      onChange={(e) => {
                        const updated = [...sliderVideos];
                        updated[index] = { ...updated[index], desc: e.target.value };
                        setSliderVideos(updated);
                      }}
                      placeholder={`Desc ${index + 1} (optional)`}
                      className={inputClass}
                      disabled={!can("UPDATE_SETTINGS")}
                    />
                    <div className="flex flex-col gap-1">
                      <label className={`flex items-center gap-2 px-3 py-3 rounded-xl border border-gray-200 cursor-pointer text-sm text-gray-500 hover:border-orange-400 ${!can("UPDATE_SETTINGS") ? "opacity-50 pointer-events-none" : ""}`}>
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          className="hidden"
                          disabled={!can("UPDATE_SETTINGS")}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (file) {
                              const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
                              if (!validTypes.includes(file.type)) {
                                alert("Only MP4, WebM, and MOV files are supported.");
                                e.target.value = "";
                                return;
                              }
                              if (file.size > 50 * 1024 * 1024) {
                                alert("File size must be under 50MB.");
                                e.target.value = "";
                                return;
                              }
                            }
                            if (sliderVideos[index].url) {
                              toast.error(`Cannot upload Video ${index + 1} when a URL is set`);
                              e.target.value = "";
                              return;
                            }
                            const files = [...sliderVideoFiles];
                            files[index] = file;
                            setSliderVideoFiles(files);
                          }}
                        />
                        {sliderVideoFiles[index]?.name || "Upload"}
                      </label>
                      <span className="text-xs text-gray-400 ml-1">MP4, WebM, MOV · max 50MB</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {can("UPDATE_SETTINGS") && (
              <div className="mt-4 flex items-center justify-end gap-3">
                <button onClick={handleSaveVideos} disabled={saving["videos"]} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50">
                  {saving["videos"] ? "Saving..." : "Save"}
                </button>
                <Msg messages={messages} section="videos" />
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}