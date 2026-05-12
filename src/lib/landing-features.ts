// Programmatic-landing-page catalog. Each entry produces an indexable page
// per city under /cities/[citySlug]/[featureSlug].
//
// Each feature maps to:
//  - a Place boolean (the field we filter places on)
//  - SEO-friendly URL slug
//  - Human label + plural noun for headlines/meta
//  - A short "why-look-for-this" lead so descriptions vary across pages

import type { Place } from "@/lib/types";

export type Feature = {
  slug: string;                        // URL path piece, kebab-case
  boolean: keyof Place;                // boolean field on Place to filter on
  label: string;                       // chip label, "Work-friendly"
  noun: string;                        // "work-friendly spots", "single-origin cafés"
  metaTitleWord: string;               // word that fits into title formula
  intro: string;                       // first paragraph blurb, max ~25 words
  searchHint: string;                  // small helper line on the page
};

export const LANDING_FEATURES: Feature[] = [
  {
    slug: "work-friendly",
    boolean: "work_friendly",
    label: "Work-friendly",
    noun: "work-friendly coffee shops",
    metaTitleWord: "Work-Friendly",
    intro:
      "Spacious, plug-rich, with the right kind of background hum — the spots in this guide are built for laptop hours without sacrificing the brew.",
    searchHint: "WiFi + outlets + room to think.",
  },
  {
    slug: "single-origin",
    boolean: "single_origin",
    label: "Single origin",
    noun: "single-origin coffee shops",
    metaTitleWord: "Single-Origin",
    intro:
      "Traceable beans, one farm or one terroir at a time — these spots showcase the difference between a country, a region, and the hand on the cupping spoon.",
    searchHint: "One origin, one story per cup.",
  },
  {
    slug: "in-house-roasting",
    boolean: "in_house_roasting",
    label: "Roasts in-house",
    noun: "in-house roasters",
    metaTitleWord: "In-House Roasting",
    intro:
      "From green bean to finished cup under one roof. These cafés roast their own beans, so what you taste is exactly what their roaster intended.",
    searchHint: "Bean to brew in one building.",
  },
  {
    slug: "pet-friendly",
    boolean: "pet_friendly",
    label: "Pet-friendly",
    noun: "pet-friendly coffee shops",
    metaTitleWord: "Pet-Friendly",
    intro:
      "Bring the dog. These cafés welcome four-legged companions — some have water bowls, treats, or a patio that's especially good for a coffee-and-paws break.",
    searchHint: "Dogs welcome here.",
  },
  {
    slug: "outdoor-seating",
    boolean: "outdoor_seating",
    label: "Outdoor seating",
    noun: "coffee shops with outdoor seating",
    metaTitleWord: "with Outdoor Seating",
    intro:
      "Sunshine, sidewalks, terraces and rooftops — coffee tastes better in the open air, and these spots have the seating to prove it.",
    searchHint: "Coffee al fresco.",
  },
  {
    slug: "alt-milk",
    boolean: "alt_milk",
    label: "Alt milk options",
    noun: "alt-milk-friendly cafés",
    metaTitleWord: "with Alt Milk",
    intro:
      "Oat, almond, soy, coconut — these cafés take alternative milks as seriously as their espresso. No surcharge dismissals, no afterthought offerings.",
    searchHint: "Oat or almond, no apology.",
  },
  {
    slug: "cold-brew",
    boolean: "cold_brew",
    label: "Cold brew",
    noun: "cold brew coffee shops",
    metaTitleWord: "Cold Brew",
    intro:
      "Slow-steeped, smooth and low-acid. These spots take cold brew seriously — fresh batches, considered ratios, sometimes nitro and seasonal infusions.",
    searchHint: "12-24 hour steep, properly done.",
  },
  {
    slug: "buy-beans-online",
    boolean: "online_beans",
    label: "Beans online",
    noun: "roasters that ship beans online",
    metaTitleWord: "Beans Online",
    intro:
      "Loved the cup? Take the beans home. These roasters offer their coffee online, with fresh roasts and detailed origin notes.",
    searchHint: "Cup today, beans on your doorstep.",
  },
];

export const FEATURE_BY_SLUG: Record<string, Feature> = Object.fromEntries(
  LANDING_FEATURES.map((f) => [f.slug, f]),
);
