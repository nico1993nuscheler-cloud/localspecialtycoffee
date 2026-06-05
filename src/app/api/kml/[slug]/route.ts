import { getAllMapPoints, getCityBySlug, getPlacesInCity } from "@/lib/data";
import { placesToMapPoints } from "@/lib/geo-points";
import { kmlForPoints } from "@/lib/maps-export";

export const revalidate = 86400;

// GET /api/kml/all                       → every geocoded spot
// GET /api/kml/best-coffee-in-brussels   → one city's spots
// Returns a downloadable KML to import into Google My Maps (Import → file).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let title: string;
  let points;
  if (slug === "all") {
    title = "Local Specialty Coffee — Every Spot";
    points = await getAllMapPoints();
  } else {
    const city = await getCityBySlug(slug);
    if (!city) return new Response("Not found", { status: 404 });
    title = `Specialty Coffee in ${city.name} — Local Specialty Coffee`;
    points = placesToMapPoints(await getPlacesInCity(city.webflow_id));
  }

  const kml = kmlForPoints(points, title);
  const filename = `lsc-${slug}.kml`;
  return new Response(kml, {
    headers: {
      "Content-Type": "application/vnd.google-earth.kml+xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "public, max-age=86400",
    },
  });
}
