import type { PlaceWithRefs } from "@/lib/types";

export function PlaceCTAs({ place }: { place: PlaceWithRefs }) {
  const dirQuery = encodeURIComponent(`${place.name} ${place.address ?? ""} ${place.city.name}`);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dirQuery}`;
  return (
    <div className="grid gap-2">
      {place.website && (
        <a
          href={place.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-full bg-coral text-white text-center px-4 py-3 font-semibold hover:bg-coral-300 transition-colors"
        >
          Visit Website
        </a>
      )}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-full border border-ink text-center px-4 py-3 font-semibold hover:bg-blush transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5z"/></svg>
        See Directions
      </a>
      {place.booking_link && (
        <a
          href={place.booking_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-full bg-ink text-white text-center px-4 py-3 font-semibold hover:bg-coral transition-colors"
        >
          Book / Get tickets
        </a>
      )}
      {place.instagram && (
        <a
          href={place.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-coral text-center hover:underline"
        >
          @ Instagram
        </a>
      )}
    </div>
  );
}
