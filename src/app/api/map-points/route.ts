import { getAllCategories, getAllCities, getAllPlaces } from "@/lib/data";
import type { MapPoint } from "@/lib/geo-points";

// All geocoded places as lightweight map points — powers the homepage globe
// overlay's world map (roam across every city). ~760 small objects; cached like
// the rest of the data layer and fetched lazily (only when the overlay opens).
export const revalidate = 2592000;

export async function GET() {
  const [places, cities, categories] = await Promise.all([
    getAllPlaces(),
    getAllCities(),
    getAllCategories(),
  ]);
  const cityBy = new Map(cities.map((c) => [c.webflow_id, c]));
  const catBy = new Map(categories.map((c) => [c.webflow_id, c]));

  const points: MapPoint[] = [];
  for (const p of places) {
    if (p.latitude == null || p.longitude == null) continue;
    const city = cityBy.get(p.city_webflow_id);
    const cat = catBy.get(p.category_webflow_id);
    if (!city || !cat) continue;
    points.push({
      slug: p.slug,
      name: p.name,
      lat: p.latitude,
      lng: p.longitude,
      citySlug: city.slug,
      cityName: city.name,
      categorySlug: cat.slug,
      categoryName: cat.name,
      flavour: p.flavour_profile,
      img: p.thumbnail_v3_url ?? p.featured_image_url ?? null,
    });
  }
  return Response.json({ points });
}
