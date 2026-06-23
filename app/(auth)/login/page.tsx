import Link from "next/link";
import AuthForm from "../../_components/AuthForm";
import { getSiteSettings } from "@/lib/get-site-settings";

export const metadata = {
  title: "Login",
};

export default async function LoginPage() {
  const { siteName } = await getSiteSettings();

  return (
    <main className="relative w-full max-w-screen h-screen overflow-hidden shadow-2xl">
      <div className="flex items-center justify-center h-full">
        <img
          src="/hero1.jpg"
          alt={siteName}
          className="absolute inset-0 h-full w-full object-fit"
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative h-full w-full md:w-[75%] lg:w-[55%] mx-auto backdrop-blur-xl bg-black/20 border-x border-white/10 flex flex-col justify-center px-6 sm:px-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold">
              <span className="text-white">{siteName.split(" ").slice(0, -1).join(" ")}</span>
              <span className="text-orange-400"> {siteName.split(" ").pop()}</span>
            </h1>

            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-8">
              LOGIN
            </h2>

            <p className="text-gray-300 mt-2">
              Sign in to your account
            </p>
          </div>

          <div className="w-full max-w-md mx-auto">
            <AuthForm mode="login" role="customer" />

            <p className="flex justify-center items-center mt-6 text-sm text-gray-300">
              Don&apos;t have an account?
              <Link
                href="/register"
                className="ml-2 text-orange-400 hover:text-orange-300 underline"
              >
                Sign up now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
