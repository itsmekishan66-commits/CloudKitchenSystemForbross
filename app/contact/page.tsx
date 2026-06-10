import {
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";

export default function ContactPage() {
  return (
    <main className="bg-white">

      {/* Hero */}
      <section className="bg-linear-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">

          <span className="bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium">
            Contact Mama&apos;s Kitchen
          </span>

          <h1 className="mt-6 text-5xl lg:text-6xl font-bold">
            We&apos;d Love To
            <span className="text-orange-500 block">
              Hear From You
            </span>
          </h1>

          <p className="max-w-2xl mx-auto mt-6 text-gray-600 text-lg">
            Questions about your order, partnership opportunities, or feedback?
            Our team is ready to help.
          </p>

        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
                <FaPhoneAlt />
              </div>

              <h3 className="font-bold text-xl mt-5">
                Phone
              </h3>

              <p className="text-gray-500 mt-2">
                +977 9800000000
              </p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
                <FaEnvelope />
              </div>

              <h3 className="font-bold text-xl mt-5">
                Email
              </h3>

              <p className="text-gray-500 mt-2">
                hello@mamaskitchen.com
              </p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
                <FaMapMarkerAlt />
              </div>

              <h3 className="font-bold text-xl mt-5">
                Location
              </h3>

              <p className="text-gray-500 mt-2">
                Biratnagar, Nepal
              </p>
            </div>

            <div className="bg-white shadow-lg rounded-3xl p-8 text-center hover:-translate-y-1 transition">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center text-orange-500 text-xl">
                <FaClock />
              </div>

              <h3 className="font-bold text-xl mt-5">
                Open Hours
              </h3>

              <p className="text-gray-500 mt-2">
                9 AM - 11 PM
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Form + Info */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">

          <div className="grid lg:grid-cols-2 gap-12">

            {/* Contact Form */}
            <div className="bg-white shadow-xl rounded-4xl p-8">

              <h2 className="text-3xl font-bold">
                Send Us a Message
              </h2>

              <p className="text-gray-500 mt-2">
                Fill out the form below and we&apos;ll get back to you shortly.
              </p>

              <form className="mt-8 space-y-5">

                <div>
                  <label className="block mb-2 font-medium">
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Subject
                  </label>

                  <input
                    type="text"
                    placeholder="Order Inquiry"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-orange-400"
                  />
                </div>

                <div>
                  <label className="block mb-2 font-medium">
                    Message
                  </label>

                  <textarea
                    rows={6}
                    placeholder="Type your message here..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none resize-none focus:border-orange-400"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl flex items-center gap-3 font-semibold transition"
                >
                  <FaPaperPlane />
                  Send Message
                </button>

              </form>
            </div>

            {/* Right Side */}
            <div className="space-y-8">

              {/* Delivery Areas */}
              <div className="bg-orange-50 rounded-4xl p-8">
                <h3 className="text-2xl font-bold">
                  Delivery Areas
                </h3>

                <p className="text-gray-600 mt-3">
                  We currently deliver across the following areas:
                </p>

                <div className="flex flex-wrap gap-3 mt-6">

                  {[
                    "Biratnagar",
                    "Itahari",
                    "Dharan",
                    "Inaruwa",
                    "Sundarharaicha",
                    "Belbari",
                  ].map((area) => (
                    <span
                      key={area}
                      className="bg-white px-4 py-2 rounded-full shadow-sm"
                    >
                      {area}
                    </span>
                  ))}

                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white shadow-lg rounded-4xl p-8">
                <h3 className="text-2xl font-bold">
                  Operating Hours
                </h3>

                <div className="mt-6 space-y-4">

                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span>9:00 AM - 11:00 PM</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Saturday</span>
                    <span>10:00 AM - 11:00 PM</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Sunday</span>
                    <span>10:00 AM - 10:00 PM</span>
                  </div>

                </div>
              </div>

              {/* Map */}
              <div className="rounded-4xl overflow-hidden shadow-lg">

                <div className="h-75 bg-linear-to-br from-orange-100 to-orange-200 flex items-center justify-center">

                  <div className="text-center">
                    <FaMapMarkerAlt className="text-5xl text-orange-500 mx-auto" />

                    <h3 className="mt-4 text-2xl font-bold">
                      Biratnagar, Nepal
                    </h3>

                    <p className="text-gray-600 mt-2">
                      Google Maps Embed Here
                    </p>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">

          <div className="bg-linear-to-r from-orange-500 to-red-500 rounded-[40px] text-white text-center p-12">

            <h2 className="text-4xl font-bold">
              Hungry Right Now?
            </h2>

            <p className="mt-4 text-orange-100 text-lg">
              Browse our menu and get delicious meals delivered to your
              doorstep in minutes.
            </p>

            <button className="mt-8 bg-white text-orange-600 px-8 py-4 rounded-xl font-bold hover:scale-105 transition">
              Order Now
            </button>

          </div>

        </div>
      </section>

    </main>
  );
}