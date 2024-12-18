import HeroSlider from "@/components/home/HeroSlider";
import CategoryGrid from "@/components/home/CategoryGrid";
import ClosingStatement from "@/components/home/ClosingStatement";
export default function HomePage() {
  return (
    <main>
      <HeroSlider />
      <CategoryGrid />
      <ClosingStatement />
    </main>
  );
}