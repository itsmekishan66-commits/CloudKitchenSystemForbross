import Link from "next/link";
import AuthForm from "../../_components/AuthForm";
import { getSiteSettings } from "@/lib/get-site-settings";

export const metadata = {
  title: "Register",
};

export default async function RegisterPage() {
  const { siteName } = await getSiteSettings();

  return (
    <main className="relative min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="absolute inset-0">
        <img
          src="/hero1.jpg"
          alt="Food Background"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-2xl">
        <div className="backdrop-blur-xl bg-black/20 border border-white/10 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              <span className="text-white">{siteName.split(" ").slice(0, -1).join(" ")}</span>
              <span className="text-orange-400"> {siteName.split(" ").pop()}</span>
            </h1>

            <h2 className="mt-4 text-3xl md:text-4xl font-bold text-white">
              SIGN-UP
            </h2>
          </div>

          <div className="mt-8">
            <AuthForm mode="register" role="customer" />
          </div>

          <p className="mt-6 flex justify-center text-sm text-white/70">
            Already have an account?
            <Link
              href="/login"
              className="ml-2 text-orange-300 underline hover:text-orange-400"
            >
              Login Now
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
