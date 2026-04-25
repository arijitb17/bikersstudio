import HeroSection from '@/components/Herosection';
import ShopByBikes from '@/components/ShopbyBikes';
import HotDeals from '@/components/HotDeals';
import ShopByCategories from '@/components/Categories';
import NewArrivals from '@/components/New Arrivals';
import RecommendedVideos from '@/components/Video';
import AboutUs from '@/components/About';
import Footer from '@/components/Footer';
import TestimonialsServer from '@/components/TestimonialsServer';
import FogLights from '@/components/FogLights';
import CrashGuards from '@/components/CrashGuards';

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <ShopByBikes />
      <HotDeals />
      <ShopByCategories limit={4} offset={0} />
      <FogLights />
      <ShopByCategories limit={4} offset={4} showTitle={false} />
      <NewArrivals />
      <ShopByCategories limit={4} offset={8} showTitle={false} />
      <CrashGuards />
      <RecommendedVideos />
      <TestimonialsServer/>
      <AboutUs />
      <Footer />
    </div>
  );
}