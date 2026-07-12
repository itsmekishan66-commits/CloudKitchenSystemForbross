import dynamic from "next/dynamic";

const ThreeDSlider = dynamic(() => import("../_components/frontend/home/3DSlider"));
const ThreeDVideoSlider = dynamic(() => import("../_components/frontend/home/3DVideoSlider"));
const HandShake = dynamic(() => import("../_components/frontend/home/HandShake"));
const HeroSection = dynamic(() => import("../_components/frontend/home/HeroSection"));
const VideoBurger = dynamic(() => import("../_components/frontend/home/VideoBurger"));
const PopularKitchen = dynamic(() => import("../_components/frontend/home/ourPopularKitchen"));
const OffersPopup = dynamic(() => import("../_components/frontend/OffersPopup"));

export default function Home() {
  return (
    <>
      <HeroSection />
      <ThreeDSlider />
      <VideoBurger />
      <ThreeDVideoSlider />
      <HandShake />
      <OffersPopup />
      <PopularKitchen />
    </>
  );
}
