export type Category = {
  webflow_id: string;
  slug: string;
  name: string;
  description: string | null;
  icon_large_url: string | null;
  icon_small_url: string | null;
  icon_dark_small_url: string | null;
};

export type City = {
  webflow_id: string;
  slug: string;
  name: string;
  h1: string | null;
  meta_description: string | null;
  summary: string | null;
  excerpt_short: string | null;
  excerpt_long: string | null;
  seo_paragraph: string | null;
  seo_h2: string | null;
  thumbnail_v1_url: string | null;
  thumbnail_v2_url: string | null;
  thumbnail_v3_url: string | null;
  featured_image_url: string | null;
  photo_gallery: string[];
  google_maps_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type Place = {
  webflow_id: string;
  slug: string;
  name: string;
  city_webflow_id: string;
  category_webflow_id: string;
  excerpt_short: string | null;
  excerpt_long: string | null;
  summary: string | null;
  flavour_profile: string | null;
  about: string | null;
  button_text: string | null;
  rating: string | null;
  address: string | null;
  // WGS84 coordinates, geocoded via scripts/geocode-places.mjs. Null until
  // geocoded — map layers must filter these out.
  latitude: number | null;
  longitude: number | null;
  hours_weekday: string | null;
  hours_saturday: string | null;
  hours_sunday: string | null;
  thumbnail_v1_url: string | null;
  thumbnail_v2_url: string | null;
  thumbnail_v3_url: string | null;
  featured_image_url: string | null;
  photo_gallery: string[];
  website: string | null;
  instagram: string | null;
  booking_link: string | null;
  phone: string | null;
  email: string | null;
  // 27 booleans (clean semantic names; Webflow legacy slugs were misleading)
  is_featured: boolean;
  in_house_roasting: boolean;
  ethical_sourcing: boolean;
  single_origin: boolean;
  award_winning: boolean;
  micro_lots: boolean;
  experimental_styles: boolean;
  hand_brews: boolean;
  batch_brews: boolean;
  espresso_milk_drinks: boolean;
  decaf_options: boolean;
  alt_milk: boolean;
  cold_brew: boolean;
  offers_classes: boolean;
  retail_beans: boolean;
  online_beans: boolean;
  pastry_snacks: boolean;
  lunch_brunch: boolean;
  work_friendly: boolean;
  outdoor_seating: boolean;
  pet_friendly: boolean;
  certified_baristas: boolean;
  ships_internationally: boolean;
  subscription: boolean;
  to_go: boolean;
  byo_cup_loyalty: boolean;
  community_events: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type PlaceWithRefs = Place & {
  city: City;
  category: Category;
};
