"use client";
// import { CircleArrowDown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  User,
  Store,
  Phone,
  Mail,
  MapPin,
  ImageIcon,
} from "lucide-react";
import { usePermissions } from "@/lib/permission-context";

const cardClass =
  "bg-white rounded-2xl shadow-sm border border-gray-100 p-6";

const inputClass =
  "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

export default function SettingsClient() {
  const permissions = usePermissions();
  const can = (p: string) => permissions.includes(p);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

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
        if (!data.error) {
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
            setStoryParagraphs(
              Array.isArray(ac.storyParagraphs)
                ? ac.storyParagraphs.join("\n\n")
                : ""
            );
          }

          const cc = data.contactContent;
          if (cc) {
            setContactHeroBadge(cc.heroBadge || "");
            setContactHeroDescription(cc.heroDescription || "");
            setHoursWeekday(cc.hoursWeekday || "");
            setHoursSaturday(cc.hoursSaturday || "");
            setHoursSunday(cc.hoursSunday || "");
            setDeliveryAreas(
              Array.isArray(cc.deliveryAreas)
                ? cc.deliveryAreas.join(", ")
                : ""
            );
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("address", address);

      formData.append("restaurantName", restaurantName);
      formData.append("contactEmail", contactEmail);
      formData.append("contactPhone", contactPhone);
      formData.append("location", location);

      if (logo) {
        formData.append("logo", logo);
      }

      const aboutContent = {
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
        storyImage:
          "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200",
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
        ctaDescription:
          "Join thousands of happy customers ordering delicious meals every day.",
        ctaButtonText: "Order Now",
      };

      const contactContent = {
        heroBadge: contactHeroBadge,
        heroHeading: "We'd Love To",
        heroHeadingAccent: "Hear From You",
        heroDescription: contactHeroDescription,
        deliveryAreas: deliveryAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        hoursWeekday,
        hoursSaturday,
        hoursSunday,
        ctaTitle: "Hungry Right Now?",
        ctaDescription:
          "Browse our menu and get delicious meals delivered to your doorstep in minutes.",
        ctaButtonText: "Order Now",
      };

      formData.append("aboutContent", JSON.stringify(aboutContent));
      formData.append("contactContent", JSON.stringify(contactContent));

      const res = await fetch("/api/superadmin/settings", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (data.error) {
        setMessage(data.error);
      } else {
        setMessage("Settings updated successfully");
      }
    } catch {
      setMessage("Failed to save settings");
    } finally {
      setSaving(false);
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

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="mt-2 text-gray-500">
              Manage admin, restaurant and website settings
            </p>
          </div>
          <div className="flex items-center justify-end gap-4">
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

        {message && (
          <div className="mb-6 rounded-xl bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        <div className="grid gap-6">

          {/* Admin */}
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-2">
              <User size={20} />
              <h2 className="font-bold text-lg">Admin Profile</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={inputClass} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={inputClass} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" className={inputClass} />
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} placeholder="Address" className={`${inputClass} md:col-span-1`} />
            </div>
          </div>

          {/* Restaurant */}
          <div className={cardClass}>
            <div className="mb-5 flex items-center gap-2">
              <Store size={20} />
              <h2 className="font-bold text-lg">Restaurant Details</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurant Name" className={inputClass} />
              <div className="rounded-xl border border-dashed border-gray-300 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ImageIcon size={18} />
                  Upload Logo
                </div>
                <input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
                {logoPreview && !logo && (
                  <div className="mt-2">
                    <img src={logoPreview} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                  </div>
                )}
              </div>
            </div>
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
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="Email" className={`${inputClass} pl-10`} />
              </div>
              <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Phone" className={inputClass} />
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-4 text-gray-400" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={`${inputClass} pl-10`} />
              </div>
              <input value={deliveryAreas} onChange={(e) => setDeliveryAreas(e.target.value)} placeholder="Delivery Areas (comma separated)" className={inputClass} />
            </div>
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
                <input value={heroBadge} onChange={(e) => setHeroBadge(e.target.value)} placeholder="Nepal's Favorite Cloud Kitchen" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Description</label>
                <textarea value={heroDescription} onChange={(e) => setHeroDescription(e.target.value)} rows={3} placeholder="Describe your kitchen..." className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Story Title</label>
                <input value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="Built for the Digital Food Era" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Story Paragraphs (separate with blank line)</label>
                <textarea value={storyParagraphs} onChange={(e) => setStoryParagraphs(e.target.value)} rows={4} placeholder="Paragraph 1&#10;&#10;Paragraph 2&#10;&#10;Paragraph 3" className={inputClass} />
              </div>
            </div>
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
                <input value={contactHeroBadge} onChange={(e) => setContactHeroBadge(e.target.value)} placeholder="Contact Us" className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Hero Description</label>
                <textarea value={contactHeroDescription} onChange={(e) => setContactHeroDescription(e.target.value)} rows={3} placeholder="Describe your contact page..." className={inputClass} />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Mon-Fri)</label>
                  <input value={hoursWeekday} onChange={(e) => setHoursWeekday(e.target.value)} placeholder="9:00 AM - 11:00 PM" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Saturday)</label>
                  <input value={hoursSaturday} onChange={(e) => setHoursSaturday(e.target.value)} placeholder="10:00 AM - 11:00 PM" className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Hours (Sunday)</label>
                  <input value={hoursSunday} onChange={(e) => setHoursSunday(e.target.value)} placeholder="10:00 AM - 10:00 PM" className={inputClass} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Save Button */}
        {can("UPDATE_SETTINGS") && (
        <div className="sticky bottom-5 mt-8 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-orange-500 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
        )}

      </div>
    </>
  );
}