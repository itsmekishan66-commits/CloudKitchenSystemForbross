import { CartProvider } from "../_components/frontend/cart/CartContext";
import Footer from "../_components/frontend/Footer";
import Navbar from "../_components/frontend/Navbar";
import { Toaster } from "react-hot-toast";


export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <Toaster position="top-right" />
      <Navbar />
      <main>
        {children}
      </main>
      <Footer />
    </CartProvider>


  );
}