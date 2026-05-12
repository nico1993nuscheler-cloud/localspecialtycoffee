import type { PlaceWithRefs } from "@/lib/types";

function isMapsDirectionsUrl(url: string | null): boolean {
  if (!url) return false;
  return /maps\.google\.com|google\.com\/maps/i.test(url);
}

export function PlaceCTAs({ place }: { place: PlaceWithRefs }) {
  const dirQuery = encodeURIComponent(`${place.name} ${place.address ?? ""} ${place.city.name}`);
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dirQuery}`;
  // Some legacy Webflow entries store a Google Maps URL in the booking field — skip
  // it to avoid showing a redundant "Book" button next to "See Directions".
  const showBookingButton = !!place.booking_link && !isMapsDirectionsUrl(place.booking_link);

  return (
    <div className="grid gap-2">
      {place.website && (
        <a
          href={place.website}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-full bg-coral-bright text-ink text-center px-4 py-3 font-bold hover:bg-coral hover:text-white transition-colors"
        >
          Visit Website
        </a>
      )}
      <a
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-full border-2 border-ink text-ink text-center px-4 py-2.5 font-semibold hover:bg-ink hover:text-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.71 11.29l-9-9a1 1 0 00-1.42 0l-9 9a1 1 0 000 1.42l9 9a1 1 0 001.42 0l9-9a1 1 0 000-1.42zM14 14.5V12h-4v3H8v-4a1 1 0 011-1h5V7.5l3.5 3.5z"/>
        </svg>
        See Directions
      </a>
      {showBookingButton && place.booking_link && (
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
          className="flex items-center justify-center gap-1.5 text-sm font-medium text-coral hover:underline pt-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.06 1.81.25 2.23.41a3.7 3.7 0 011.39.9 3.7 3.7 0 01.9 1.4c.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.06 1.17-.25 1.81-.41 2.23a3.7 3.7 0 01-.9 1.39 3.7 3.7 0 01-1.4.9c-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.06-1.81-.25-2.23-.41a3.7 3.7 0 01-1.39-.9 3.7 3.7 0 01-.9-1.4c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.06-1.17.25-1.81.41-2.23a3.7 3.7 0 01.9-1.39 3.7 3.7 0 011.4-.9c.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.16.27-2.92.56a5.86 5.86 0 00-2.13 1.39A5.86 5.86 0 00.63 4.13c-.3.76-.5 1.64-.56 2.92C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.27 2.16.56 2.92.31.81.71 1.5 1.39 2.13a5.86 5.86 0 002.13 1.39c.76.3 1.64.5 2.92.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.16-.27 2.92-.56a5.86 5.86 0 002.13-1.39 5.86 5.86 0 001.39-2.13c.3-.76.5-1.64.56-2.92.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.27-2.16-.56-2.92a5.86 5.86 0 00-1.39-2.13A5.86 5.86 0 0019.87.63c-.76-.3-1.64-.5-2.92-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 100 12.32 6.16 6.16 0 000-12.32zm0 10.16a4 4 0 110-8 4 4 0 010 8zm7.85-10.4a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/>
          </svg>
          View on Instagram
        </a>
      )}
    </div>
  );
}
