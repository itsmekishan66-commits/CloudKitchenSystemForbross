"use client";
import { useCart } from "../context/CartContext";
import Image from "next/image";
import {
  FaSearch,
  FaHamburger,
  FaPizzaSlice,
  FaLeaf,
  FaIceCream,
  FaCoffee,
  FaMapMarkerAlt,
  FaPlusCircle,
} from "react-icons/fa";

const foods = [
  {
    id: 1,
    name: "Wagyu Gold Burger",
    price: "218.50",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
    description:
      "Double-pressed wagyu Chicken, truffle aioli, aged cheddar, and house-made pickles.",
  },
  {
    id: 2,
    name: "Zen Poke Bowl",
    price: "314.00",
    image:
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800",
    description:
      "Fresh sashimi grade salmon, avocado, edamame and spicy mayo drizzle.",
  },
  {
    id: 3,
    name: "Pizza",
    price: "614.00",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800",
    description:
      "Loaded with fresh ingredients and melted mozzarella cheese.",
  },
  {
    id: 4,
    name: "Crispy Truffle Fries",
    price: "114.00",
    image:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?w=800",
    description:
      "Hand-cut fries tossed in white truffle oil and Grana Padano cheese.",
  },
  {
    id: 5,
    name: "Molten Lava Core",
    price: "214.00",
    image:
      "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=800",
    description:
      "70% dark cocoa cake with a warm flowing center and vanilla bean gelato.",
  },
  {
    id: 6,
    name: "Artisan Roast Salad",
    price: "312.95",
    image:
      "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800",
    description:
      "Herb-roasted chicken breast, organic greens, feta and toasted nuts.",
  },
  {
    id: 7,
    name: "Thai Red Prawn",
    price: "216.25",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800",
    description:
      "Jumbo prawns in aromatic coconut red curry with jasmine rice.",
  },
];

export default function MenuPage() {
  const { addToCart } = useCart();
  return (
    <main className="bg-[#f4f1ed] min-h-screen py-8 my-18 md:my-12">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid grid-cols-1 md:grid-cols-[230px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="hidden md:block bg-white backdrop:blur-2xl rounded-xl shadow-sm h-fit p-5">

            <h2 className=" hidden md:flex text-xl font-bold mb-5">
              Categories
            </h2>

            <div className="space-y-3">

              <button className="w-full flex items-center gap-3 text-black px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                ☕ All
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                <FaHamburger />
                Burgers
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                <FaPizzaSlice />
                Pizza
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                🍜 Asian
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                <FaLeaf />
                Healthy
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-800 hover:scale-105 transition-all text-sm">
                <FaIceCream />
                Desserts
              </button>

              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg  hover:bg-red-800 hover:scale-105 transition-all text-sm">
                <FaCoffee />
                Beverages
              </button>

            </div>
          </aside>

          {/* Content */}
          <section>

            {/* Search + Delivery */}
            <div className="flex flex-col lg:flex-row gap-4 mb-8">

              <div className="relative flex-1">
                <FaSearch className="absolute left-4 top-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search for dishes, flavors, or ingredients..."
                  className="w-full bg-white rounded-xl border border-gray-200 pl-12 pr-4 py-4 outline-none"
                />
              </div>

              <div className="bg-white px-5 py-4 rounded-xl shadow-sm flex items-center gap-3 min-w-60">
                <FaMapMarkerAlt className="text-orange-500" />

                <div>
                  <p className="text-xs text-gray-500">
                    DELIVERY TO
                  </p>
                  <p className="font-semibold text-sm">
                    Biratnagar • 35-45 mins
                  </p>
                </div>
              </div>

            </div>

            {/* Food Grid */}
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-8">

              {foods.map((food) => (
                <div
                  key={food.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition duration-300"
                >
                  <div className="relative h-52">

                    <Image
                      src={food.image}
                      alt={food.name}
                      fill
                      className="object-cover"
                    />

                    {food.id === 1 && (
                      <>
                        <span className="absolute top-3 left-3 bg-black text-white text-[10px] px-2 py-1 rounded">
                          Non-Veg
                        </span>

                        <span className="absolute bottom-3 right-3 bg-red-500 text-white text-[10px] px-2 py-1 rounded">
                          15% Off
                        </span>
                      </>
                    )}
                  </div>

                  <div className="p-4">

                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-xl leading-tight">
                        {food.name}
                      </h3>

                      <span className="font-bold text-orange-700">
                        {food.price}
                      </span>
                    </div>

                    <p className="text-sm text-gray-500 mt-3 min-h-15">
                      {food.description}
                    </p>

                    <button onClick={() => addToCart({ id: String(food.id), title: food.name, image: food.image, price: Number(food.price), quantity: 1 })} className="mt-4 w-full bg-[#7c0a02] hover:bg-[#600702] text-white py-2.5 rounded-lg flex justify-center items-center gap-2 transition">
                      <FaPlusCircle />
                      Add to Cart
                    </button>

                  </div>
                </div>
              ))}

            </div>

          </section>

        </div>
      </div>
    </main>
  );
}