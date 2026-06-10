import ImageStackSlider from "./components/Imagestack";
import CravingSection from "./home/CravingSection";
import FeatureCards from "./home/FeatureCards";
import FeaturedMenu from "./home/FeaturedMenu";
import HeroSection from "./home/HeroSection";
import StorySection from "./home/StorySection";
import PopularKitchen from "./home/ourPopularKitchen";

export default function Home() {
  return (
    <>
      <HeroSection />

      <StorySection />

      <ImageStackSlider />

      <FeatureCards />

      <CravingSection />

      <FeaturedMenu />

      <PopularKitchen />
    </>
  );
}
