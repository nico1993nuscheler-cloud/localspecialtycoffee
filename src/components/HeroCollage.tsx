import Image from "next/image";
import { BRAND } from "@/lib/brand";

/**
 * Mirrors the Webflow hero collage layout: 3 columns of cafe scenes.
 * Col 1: 2 images (Dark Matter, Bike & Coffee)
 * Col 2: 3 images (Rosslyn, Party at Pavillon, Praxis)
 * Col 3: 2 images (cupping barista, Assembly)
 */
export function HeroCollage() {
  const [col1a, col1b, col2a, col2b, col2c, col3a, col3b] = BRAND.heroCollage;
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <div className="flex flex-col gap-3 md:gap-4 pt-8">
        <ImgTile src={col1a} alt="Dark Matter Coffee, specialty roaster" priority />
        <ImgTile src={col1b} alt="Bike and specialty coffee shop scene" tall />
      </div>
      <div className="flex flex-col gap-3 md:gap-4">
        <ImgTile src={col2a} alt="Rosslyn Coffee, London" priority />
        <ImgTile src={col2b} alt="Party at Pavillon, Berlin" />
        <ImgTile src={col2c} alt="Praxis Coffee Roasters, Austin" />
      </div>
      <div className="flex flex-col gap-3 md:gap-4 pt-12">
        <ImgTile src={col3a} alt="Specialty coffee cupping with barista" tall />
        <ImgTile src={col3b} alt="Assembly Coffee" />
      </div>
    </div>
  );
}

function ImgTile({
  src,
  alt,
  tall = false,
  priority = false,
}: {
  src: string;
  alt: string;
  tall?: boolean;
  priority?: boolean;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-blush ${tall ? "aspect-[4/5]" : "aspect-square"}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 33vw, 250px"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
