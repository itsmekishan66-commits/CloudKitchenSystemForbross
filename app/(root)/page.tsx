// import ImageStackSlider from "../_components/frontend/Imagestack";
// import ThreeDVideo from "../_components/frontend/home/3DVideoSlider";
// import CravingSection from "../_components/frontend/home/CravingSection";
// import FeatureCards from "../_components/frontend/home/FeatureCards";
// import FeaturedMenu from "../_components/frontend/home/FeaturedMenu";
// import StorySection from "../_components/frontend/home/StorySection";

import ThreeDSlider from "../_components/frontend/home/3DSlider";
import ThreeDVideoSlider from "../_components/frontend/home/3DVideoSlider";
import HandShake from "../_components/frontend/home/HandShake";
import HeroSection from "../_components/frontend/home/HeroSection";
import VideoBurger from "../_components/frontend/home/VideoBurger";
import PopularKitchen from "../_components/frontend/home/ourPopularKitchen";
import OffersPopup from "../_components/frontend/OffersPopup";



export default function Home() {
  return (
    <>
      <HeroSection />

      <ThreeDSlider />

      <VideoBurger />

      <ThreeDVideoSlider />

      <HandShake />

      <OffersPopup />

      {/* <StorySection /> */}

      {/* <FeatureCards /> */}
      
      {/* <ImageStackSlider /> */}

      {/* <CravingSection /> */}

      {/* <FeaturedMenu /> */}

      <PopularKitchen />
    </>
  );
}
