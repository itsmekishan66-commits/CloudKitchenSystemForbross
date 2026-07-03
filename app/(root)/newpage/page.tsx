export default function Home() {
  return (
    <section className="relative min-h-screen bg-[url(/smoky-atmosphere-background.jpg)] bg-no-repeat bg-cover bg-bottom">
      <main className="relative h-screen overflow-hidden text-white">

        {/* Smoke layers */}
        {/* <div
        className="absolute inset-0 opacity-65"
        style={{
          background: `
            radial-gradient(circle at 20% 70%, rgba(255,255,255,.08), transparent 30%),
            radial-gradient(circle at 80% 20%, rgba(255,255,255,.06), transparent 35%),
            radial-gradient(circle at 50% 100%, rgba(255,255,255,.1), transparent 40%)
          `,
          filter: "blur(20px)",
        }}
      /> */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.7))",
          }}
        />

        {/* smoke at bottom */}
        {/* <div
          className="absolute -bottom-25 left-0 w-full h-75"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,.16), transparent 70%)",
            filter: "blur(80px)",
          }}
        /> */}

        <div className="relative z-20 flex h-full">

          {/* LEFT */}

          <div className="flex w-1/2 flex-col justify-center pl-24 pt-10">
            <h1
              className="max-w-175 text-[72px] leading-[1.1] font-light"
              style={{
                fontFamily:
                  "Baskerville, Georgia, serif",
              }}
            >
              Fresh, Fast &
              Delivered
              <br />
              From Our Cloud
              Kitchen
            </h1>

            <p className="mt-6 max-w-135 text-[22px] text-gray-300 leading-relaxed">
              Order chef-crafted meals made with fresh ingredients
              and delivered hot to your doorstep.
            </p>

            {/* buttons */}

            <div className="mt-12 flex gap-6">

              <button className="bg-orange-600 px-10 py-4 text-lg hover:bg-orange-700 transition">
                Order Now
              </button>

              <button className="border border-orange-500 px-10 py-4 text-lg text-orange-500 hover:bg-orange-500 hover:text-white transition">
                View Menu
              </button>

            </div>

          </div>

          {/* RIGHT */}

          <div className="relative w-1/2">

            {/* Main orange circle */}

            <div className="absolute right-25 top-45 h-114 w-114 rounded-full bg-orange-600" />

            {/* Orbit lines */}

            <div className="absolute right-15 top-35 h-130 w-130 rounded-full border border-orange-500/80" />

            <div className="absolute right-8 top-28 h-144 w-143 rounded-full border border-orange-500/50" />

            <div className="absolute right-0 top-22 h-155 w-155 rounded-full border border-orange-500/30" />

            {/* little orbit dot */}

            <div className="absolute right-25 top-70 h-5 w-5 rounded-full bg-orange-500" />

            {/* TOP FOOD */}

            {/* <img
            src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800"
            alt=""
            className="
            absolute
            top-[120px]
            right-[220px]
            h-[320px]
            w-[320px]
            rounded-full
            object-cover
            shadow-[0_20px_60px_rgba(0,0,0,.8)]
          "
          /> */}

            {/* BOTTOM FOOD */}

            {/* <img
            src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"
            alt=""
            className="
            absolute
            bottom-[80px]
            right-[80px]
            h-[260px]
            w-[260px]
            rounded-full
            object-cover
            shadow-[0_20px_60px_rgba(0,0,0,.8)]
          "
          /> */}

            {/* Floating leaf */}
            {/* 
          <img
            src="https://pngimg.com/d/spinach_PNG32.png"
            alt=""
            className="
            absolute
            left-[70px]
            bottom-[110px]
            w-[110px]
            rotate-[-20deg]
          "
          /> */}

            {/* tomato */}

            {/* <img
            src="https://pngimg.com/d/tomato_PNG12588.png"
            alt=""
            className="
            absolute
            right-[-30px]
            bottom-[170px]
            w-[100px]
          "
          /> */}

          </div>
        </div>
      </main>
    </section >
  );
}