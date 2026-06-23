import ImageStackSlider from "../_components/frontend/Imagestack";
import CravingSection from "../_components/frontend/home/CravingSection";
import FeatureCards from "../_components/frontend/home/FeatureCards";
import FeaturedMenu from "../_components/frontend/home/FeaturedMenu";
import HeroSection from "../_components/frontend/home/HeroSection";
import StorySection from "../_components/frontend/home/StorySection";
import PopularKitchen from "../_components/frontend/home/ourPopularKitchen";



export default function Home() {
  return (
    <>
      <HeroSection />

      <StorySection />

      <FeatureCards />
      
      <ImageStackSlider />

      <CravingSection />

      <FeaturedMenu />

      <PopularKitchen />
    </>
  );
}
