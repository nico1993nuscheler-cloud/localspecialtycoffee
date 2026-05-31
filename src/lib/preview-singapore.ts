// Local-only Singapore preview overlay.
//
// Enabled when env var `LSC_PREVIEW=singapore` is set (intended for `next dev`).
// data.ts merges the City + 15 Place objects from here into the Supabase-backed
// API responses so the SG launch can be reviewed in the real UI before any DB push.
//
// Images use Helsinki's R2 URLs as placeholders since SG image pipeline (Step 5/6)
// has not run yet. Replace with real R2 URLs at injection time.

import "server-only";
import type { City, Place } from "./types";

export const PREVIEW_CITY_SLUG = "specialty-coffee-singapore";
export const PREVIEW_CITY_WEBFLOW_ID = "preview-singapore";
export const PREVIEW_ENABLED = process.env.LSC_PREVIEW === "singapore";

// City images — Unsplash (heritage shophouse register, picked editorially).
// At injection time these get downloaded → cropped → TinyPNG → R2; for preview
// we serve them straight from images.unsplash.com with crop params.
const PH_CITY_HERO = "https://images.unsplash.com/photo-1615392105814-c9fbad4d25a2?w=2880&h=1328&fit=crop&q=85";
const PH_CITY_THUMB_V1 = "https://images.unsplash.com/photo-1615393120732-f20d2d15a9ad?w=568&h=680&fit=crop&q=85";
const PH_CITY_THUMB_V2 = "https://images.unsplash.com/photo-1610016799660-9186ac63b50f?w=1080&h=680&fit=crop&q=85";
const PH_CITY_THUMB_V3 = "https://images.unsplash.com/photo-1522012188892-24beb302783d?w=240&h=240&fit=crop&q=85";
const PH_CITY_GALLERY = [
  "https://images.unsplash.com/photo-1604276920180-34b7df1cc6dc?w=520&h=520&fit=crop&q=85",
  "https://images.unsplash.com/photo-1615391842423-01cd70edfdf1?w=520&h=520&fit=crop&q=85",
  "https://images.unsplash.com/photo-1644072267093-cbbfdb74303c?w=520&h=520&fit=crop&q=85",
  "https://images.unsplash.com/photo-1610016799660-9186ac63b50f?w=520&h=520&fit=crop&q=85",
];

// Per-cafe Places photo #1, auto-picked per Nico's instruction on 2026-05-16.
// At injection time these get downloaded via Places Photo API → cropped → TinyPNG → R2.
const CAFE_PHOTOS: Record<string, string> = {
  "apartment-coffee-singapore": "https://lh3.googleusercontent.com/places/ANXAkqH1GWAiFBnJ_DF9J24Ncp0BWMtuZTrQgm-EAibA2Vm-MhmYrgm2BGiH8g37UtGPLO9ywp-xnDLoT5GPj6JpOM_9gk3raF5PROE=s4800-w1080",
  "nylon-coffee-roasters-singapore": "https://lh3.googleusercontent.com/places/ANXAkqHffbn969L1b2O-Gt4Dj4CbR6J4r6iV78IC7mmMy2nIk3nTqf2QLsVwJbf7xFRU5JDW_oRV42U6iYkWd8iWbABTn056E6BCh6I=s4800-w844",
  "common-man-coffee-roasters-singapore": "https://lh3.googleusercontent.com/places/ANXAkqEdMHgUgtTgL-mnQClLjR74QBkQheVvd3eXOYmjD1WnR7sFqHrXeNPqG2bh_vDIVRb_D5yic8LYCnEpHQk4GQVJ_bvKMLjh9gY=s4800-w2560",
  "chye-seng-huat-hardware-singapore": "https://lh3.googleusercontent.com/places/ANXAkqHkahu3sHhoug43baU6QeWel39lFAN7Ko-rdutX9h_nuWn13-qZooQ01yM-Cs8_w51nF1yg4ia0_CaZPIKqmJqgb80FF0ZpAWc=s4800-w1500",
  "ppp-coffee-singapore": "https://lh3.googleusercontent.com/places/ANXAkqHMDZLixWgDp4VUSTrkLArFjnixjLsLtFK5vmV4mVeEEOBjXm3RMEsBXYN1lXSup7N25ygMhXMmfQ4rKX6DJ_zJzNKe0SCRC_w=s4800-w1440",
  "tiong-hoe-specialty-coffee-singapore": "https://lh3.googleusercontent.com/places/ANXAkqEi2dq8OQ_Gues1J0rY9l31u7plkQc9R0r364N-zvH2B7wtm7ZPRgL0cLRmCsfxJrLwW-HCmj81Eu2ZYfM2avr9aRUFnTpTZb0=s4800-w1082",
  "kurasu-singapore": "https://lh3.googleusercontent.com/places/ANXAkqHVwoxq9ihHCsajtoEp5aKZCEPny5Ywk4uoFnlx3yQpRTN3YJl86Ix-4pLHblAZrVEPCFLSwJgoOPbs0TJPPYsGBGllVxrwWME=s4800-w1920",
  "maxi-coffee-bar-singapore": "https://lh3.googleusercontent.com/place-photos/AJRVUZOR9_DVl1SS_8iovnemLFn492AIW5oCqb970dbrMt3k48xugOVgcHKAwkTMVTWTYWeM8JzhFt5-zTspkGEDNPh5ArgMOc0Mlbq71Gyg814u90Wi_KuhHsm2ElWaK7YqlhFBWAq4C0f9SSYe6Q=s4800-w2560",
  "alchemist-coffee-singapore": "https://lh3.googleusercontent.com/place-photos/AJRVUZM8QAkGXFOv2gcaLSv-b4L1oFBIgVIgKB-82FKRc8ngnxm0YqH3ouuT82WPHB-ZKVdxzdmv6TaVODQUKWCBmMKfBVSbwquH10gbF2oMyCqkavn5cQ6Kd2fFzkpGRyecDiLcMWdiKNXolCZcmQ=s4800-w2560",
  "foreword-coffee-roasters-singapore": "https://lh3.googleusercontent.com/places/ANXAkqF4RtvC_BQHqDXrZTjsp6dvLxMqZFSQLKehBxOe8tjsOyU-Rg_6sMxkb28ESeTQy9qHCh8ZtGoM0_V1V8R_3Z82YVxRBPoXvv8=s4800-w2560",
  "homeground-coffee-roasters-singapore": "https://lh3.googleusercontent.com/place-photos/AJRVUZOlJWy9GG9e_vR1byw1p6Ak8T4moSvcJQoEKcgEiXeg6IVyVoeqMCIGBaWd-hc-IGQ0xBJpFkFt74n_XJWfYcBDz1qyyD_rF2xn8msp4zHdSfSixZHH-ScsBDyFZGrdkXc3e3fs2UNG4MJGSK8=s4800-w2560",
  "glyph-supply-co-singapore": "https://lh3.googleusercontent.com/place-photos/AJRVUZOyBacvvornmcq1scFMSqks-cr1uOG-hyKVpiSrGivkPqogaV1dI4kqahJ7crASI1oVEpMPLimvjsA8ZdW-3mRnpd7dBXxAzGlpOcjPxmLLqNjJGIdEXwPJM0xp-ZNnsglYrFAUKa5ho9Mt5Tw=s4800-w2560",
  "rookies-coffee-shop-singapore": "https://lh3.googleusercontent.com/places/ANXAkqEHT1lrhQjI4zkyjUUsJWKJd1ENj45Nm2lr5DoeK-6A7yBrpA3szUIWSQZcFKjCWgvslDwklTKmanc3MY4DZBrmRSGa2jeJbjo=s4800-w1170",
  "dutch-colony-coffee-co-singapore": "https://lh3.googleusercontent.com/place-photos/AJRVUZMJGzOYcV3ganWLNazy2JATJPevxaA1oMK9XlJz104PACwEwzhX4Myg-6bOLcMy3oIjmb55h3comA37W6gAZr0qwLgr3o7h8o6NzlHP4ozmVdDBDRRaiicNSMCgdwETq7oI0efcFr0d3UwlPA=s4800-w2560",
  "brawn-and-brains-coffee-singapore": "https://lh3.googleusercontent.com/places/ANXAkqEkgLy58na3XSUizzak6vYpgPLoSE4y-qy12YNpxwj4zaMI81liRb9PYO3IpHa_P90oKHU26D3F-igJisL-x44pegie7VcG23E=s4800-w2560",
};

// Fallback (Helsinki kaffa) for any cafe whose Places photo URL ever 401s.
const FALLBACK_CAFE_IMAGE = "https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/places/kaffa-roastery-helsinki/hero.jpg";

const CAT_SPECIALTY = "67d40638d300a0e9ce062804"; // Specialty Coffee Shop
const CAT_ROASTER = "67d40638d300a0e9ce0627d1"; // Coffee Roaster

const SG_CITY: City = {
  webflow_id: PREVIEW_CITY_WEBFLOW_ID,
  slug: PREVIEW_CITY_SLUG,
  name: "Singapore",
  h1: "Specialty Coffee Singapore",
  meta_description: "Discover Singapore's best specialty coffee — from Apartment, Asia's #1 cafe, to pioneer roasters like Nylon and Common Man. Your curated city guide.",
  summary: "Singapore's specialty coffee scene jumped from third-wave outsider to world stage in a decade — our guide covers the cafés worth your time.",
  excerpt_short: "Discover Singapore's specialty coffee scene — from Asia's #1 cafe to the pioneer roasters who built it",
  excerpt_long: "Singapore's specialty coffee scene punches far above its size — home to Apartment Coffee, named #1 in Asia at the World's 100 Best Coffee Shops two years running. From Jalan Besar's specialty corridor to Eastside roasteries and Ann Siang shophouse cafés, our guide covers the cafés, roasters, and brew bars that put this city on the global coffee map.",
  seo_h2: "Singapore's Specialty Coffee: From Kopitiam to Asia's #1",
  seo_paragraph: `<p>Specialty coffee in Singapore has gone from niche to globally recognised in just over a decade — <a href="/specialty-coffee-place/apartment-coffee-singapore">Apartment Coffee</a>'s #1-in-Asia placement on the World's 100 Best Coffee Shops list (two years running) is the loudest signal yet. The scene's origin story runs through <a href="/specialty-coffee-place/nylon-coffee-roasters-singapore">Nylon Coffee Roasters</a>, the 2012 Everton Park hole-in-the-wall whose annual origin trips to El Salvador and Ethiopia set the template every Singapore roaster followed.</p><p>Today the city's specialty corridor stretches across Jalan Besar — <a href="/specialty-coffee-place/chye-seng-huat-hardware-singapore">Chye Seng Huat Hardware</a>'s Probat roastery anchors a strip that runs from Tyrwhitt to Hamilton Road, where <a href="/specialty-coffee-place/brawn-and-brains-coffee-singapore">Brawn &amp; Brains</a> has been roasting since 2013. Tanjong Pagar and Bukit Merah hold the craft outposts — <a href="/specialty-coffee-place/tiong-hoe-specialty-coffee-singapore">Tiong Hoe</a>'s twenty-plus single origins, <a href="/specialty-coffee-place/alchemist-coffee-singapore">Alchemist</a>'s rotating blends, <a href="/specialty-coffee-place/rookies-coffee-shop-singapore">Rookie's</a> AeroPress-championship pedigree — while Ann Siang Hill's restored shophouses give cafés like <a href="/specialty-coffee-place/maxi-coffee-bar-singapore">Maxi</a> their distinctive setting. Out west, <a href="/specialty-coffee-place/homeground-coffee-roasters-singapore">Homeground</a>'s reopened Bukit Timah roastery serves a quieter, neighbourhood crowd.</p><p>What ties it all together is Singapore's coffee culture itself: a city where kopitiam stalls pulling sock-filtered robusta sit a block from light-roast filter bars, and both feel essential. Discover the best specialty coffee in Singapore below.</p>`,
  thumbnail_v1_url: PH_CITY_THUMB_V1,
  thumbnail_v2_url: PH_CITY_THUMB_V2,
  thumbnail_v3_url: PH_CITY_THUMB_V3,
  featured_image_url: PH_CITY_HERO,
  photo_gallery: PH_CITY_GALLERY,
  google_maps_url: "https://www.google.com/maps/search/specialty+coffee+singapore",
  created_at: null,
  updated_at: null,
};

type SgCafeSeed = {
  slug: string;
  name: string;
  category: typeof CAT_SPECIALTY | typeof CAT_ROASTER;
  excerpt_short: string;
  excerpt_long: string;
  summary: string;
  flavour_profile: string;
  about: string;
  rating: string;
  address: string;
  hours_weekday: string;
  hours_saturday: string;
  hours_sunday: string;
  website: string;
  booleans: Array<keyof Place>;
  is_featured?: boolean;
};

const SEEDS: SgCafeSeed[] = [
  {
    slug: "apartment-coffee-singapore",
    name: "Apartment Coffee",
    category: CAT_SPECIALTY,
    excerpt_short: "Apartment Coffee is Asia's #1 specialty café — ranked sixth in the World's 100 Best Coffee Shops 2026.",
    excerpt_long: "Apartment Coffee is Singapore's flagship specialty café — and the only Asian shop in the World's 100 Best Coffee Shops top ten, two years running. Founder Yeo Quing He, a Singapore Brewer's Cup champion, runs a tight programme of light-roast filters and origin-led espresso in a Selegie Road space with the calm of a design studio.",
    summary: "Apartment Coffee — Singapore's most awarded specialty café and Asia's #1 in the World's 100 Best Coffee Shops 2026. Light-roast filters, Synesso espresso, gallery-calm space.",
    flavour_profile: "World #6, Asia #1 (2026). Brewer's Cup-champion founder. Filter-coffee focus, single-origin programme, alt-milks, design-studio space.",
    about: `<p>Opened in 2018 by Singapore Brewer's Cup champion Yeo Quing He, Apartment Coffee has gone from quietly serious filter bar to the highest-ranked specialty café in Asia. The current flagship sits at 139 Selegie Road — a clean, considered space with white walls, generous windows, and Danish-modern furniture that lets the cup do the talking.</p><p>The menu is built around a small, rotating selection of light-roast single origins, served on a Synesso espresso machine and a precisely tuned filter programme. The bean list moves with the harvest calendar: expect washed Ethiopians, Kenyan SL28 lots, and the occasional honey-process Costa Rican when the season's right. Alt-milks are available; pastries rotate.</p><p>This is the only café in Asia ranked in the World's 100 Best Coffee Shops top ten — sixth globally, first in Asia in both 2025 and 2026. Order a filter, sit in for an hour, and you'll understand why this is the address every visiting specialty pro adds to their Singapore list.</p>`,
    rating: "4.6 (1447)",
    address: "139 Selegie Road, #01-01, Singapore 188309",
    hours_weekday: "Mon–Fri: 09:00–18:00",
    hours_saturday: "Saturday: 09:00–18:00",
    hours_sunday: "Sunday: 09:00–18:00",
    website: "https://apartmentcoffee.com.sg",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "award_winning", "micro_lots", "experimental_styles", "hand_brews", "espresso_milk_drinks", "alt_milk", "retail_beans", "online_beans", "pastry_snacks", "to_go", "certified_baristas", "community_events"],
  },
  {
    slug: "nylon-coffee-roasters-singapore",
    name: "Nylon Coffee Roasters",
    category: CAT_ROASTER,
    excerpt_short: "Nylon Coffee Roasters is Singapore's third-wave pioneer — the 2012 Everton Park hole-in-the-wall that started the city's specialty scene.",
    excerpt_long: "Nylon opened in 2012 in a hawker-block corner of Everton Park and is consistently named the pioneer of Singapore's third-wave coffee scene. The founders fly to producing countries every year — El Salvador, Nicaragua, Ethiopia, Colombia — to source the single origins they roast on-site, with a deliberate emphasis on light, transparent profiles.",
    summary: "Nylon Coffee Roasters — Singapore's third-wave pioneer (2012). Light-roast single origins, annual origin trips, the cornerstone roastery of the city's specialty scene.",
    flavour_profile: "SG's third-wave pioneer (2012). Direct-trade single origins from El Salvador, Nicaragua, Ethiopia, Colombia. Light roasts, La Marzocco, retail beans.",
    about: `<p>Open Nylon's website, look at any Singapore coffee guide, talk to any Singapore barista — they will all point to the same address. Tucked into the ground floor of an HDB block at Everton Park, Nylon Coffee Roasters has been pulling shots and roasting beans since 2012, and is the consensus pioneer of Singapore's third-wave movement.</p><p>The model is uncluttered. Founders Dennis Tang and Jia Min travel every year to producing countries — El Salvador, Nicaragua, Ethiopia, Colombia — building direct relationships with farms whose lots end up on the Nylon menu. Roasts run light, designed to let origin character through. The bar is a tight standing-room operation built around a La Marzocco machine and a small filter setup.</p><p>There's no music, no Wi-Fi, no laptops. You order, you taste, and if you've got questions the team will answer them in detail. For anyone serious about Singapore specialty coffee, Nylon is where the story begins — and is still essential reading.</p>`,
    rating: "4.7 (2243)",
    address: "4 Everton Park, #01-40, Singapore 080004",
    hours_weekday: "Mon–Fri: 08:30–17:30",
    hours_saturday: "Saturday: 09:00–17:30",
    hours_sunday: "Sunday: 09:00–17:30",
    website: "https://nyloncoffee.sg",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "award_winning", "micro_lots", "hand_brews", "espresso_milk_drinks", "alt_milk", "retail_beans", "online_beans", "ships_internationally", "subscription", "to_go"],
  },
  {
    slug: "common-man-coffee-roasters-singapore",
    name: "Common Man Coffee Roasters",
    category: CAT_ROASTER,
    excerpt_short: "Common Man Coffee Roasters is the Martin Road flagship that kickstarted Singapore's specialty scene — a roastery, café, and barista academy in one.",
    excerpt_long: "Common Man opened in 2013 on Martin Road and is widely credited with bringing third-wave coffee to a mainstream Singapore audience. The flagship combines a full-day kitchen, a partnership-roasted bean programme with Australia's Five Senses Coffee, and a barista academy that has trained much of the city's current specialty workforce.",
    summary: "Common Man Coffee Roasters — Singapore's mainstream specialty breakthrough (2013, Martin Road). 90+ tonnes a year, Five Senses Coffee partnership, all-day brunch, training academy.",
    flavour_profile: "Flagship since 2013. Five Senses Coffee partnership, 90+ tonnes/year, barista academy, all-day brunch, espresso + filter, multi-location.",
    about: `<p>Common Man Coffee Roasters opened the Martin Road flagship in 2013 and didn't so much join Singapore's specialty scene as expand it. The space is a roastery, full-service brunch restaurant, barista academy, and wholesale operation rolled into one — and is the place most Singaporeans first encountered third-wave coffee in a room that didn't feel like a hole-in-the-wall.</p><p>The coffee programme runs on a long-running partnership with Australia's Five Senses Coffee, producing 90-plus tonnes a year between blends and rotating single origins. Expect a clean, balanced house espresso plus seasonal filter options, and a kitchen that runs from morning eggs and crumpets through to evening plates without losing focus.</p><p>The barista academy on the floor above has trained much of the city's current specialty workforce. There are smaller outlets across Singapore and Malaysia, but Martin Road remains the mothership. Come hungry — the food is genuinely good, and the coffee is the reason you'll stay.</p>`,
    rating: "4.4 (3045)",
    address: "22 Martin Road, #01-00, Singapore 239058",
    hours_weekday: "Mon–Fri: 07:30–22:00",
    hours_saturday: "Saturday: 07:30–22:00",
    hours_sunday: "Sunday: 07:30–22:00",
    website: "https://commonmancoffeeroasters.com",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "award_winning", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "offers_classes", "pastry_snacks", "lunch_brunch", "work_friendly", "to_go", "certified_baristas", "community_events"],
  },
  {
    slug: "chye-seng-huat-hardware-singapore",
    name: "Chye Seng Huat Hardware",
    category: CAT_ROASTER,
    excerpt_short: "Chye Seng Huat Hardware is Papa Palheta's Art Deco roastery-café in Jalan Besar — and a specialty Singapore institution.",
    excerpt_long: "Set inside a converted Art Deco hardware shophouse on Tyrwhitt Road, Chye Seng Huat Hardware is the public face of veteran roaster Papa Palheta. The space pairs a glass-walled Probat roastery with a serious filter and espresso programme, including the occasional anaerobic-fermented lot that travels well beyond Singapore's specialty community.",
    summary: "Chye Seng Huat Hardware — Papa Palheta's Tyrwhitt Road flagship. Art Deco shophouse, Probat roastery, anaerobic-fermented single origins, cold brew on tap, training compound.",
    flavour_profile: "Papa Palheta flagship. Probat roastery, anaerobic-fermented single origins, cold brew on tap, Art Deco shophouse, espresso + filter, retail beans.",
    about: `<p>You arrive at Chye Seng Huat Hardware through the cast-iron gate of a 1940s Art Deco hardware shophouse on Tyrwhitt Road. Inside, a glass wall separates the café from a working Probat roaster — and behind everything sits Papa Palheta, one of Singapore's most respected specialty operations.</p><p>The coffee programme is genuinely ambitious. Expect a rotating filter menu of single origins from Ethiopia, Kenya, Colombia, and the occasional experimental fermentation lot — a recent Ethiopian Bensa Shanteweni went through a 72-hour anaerobic ferment before reaching the bar. Cold brew is on tap. Espresso runs through a tight house blend complemented by single-origin guest pours. The room itself is part of the appeal: high ceilings, mosaic flooring, mezzanine seating, plenty of natural light.</p><p>This is the place to come if you want to taste what a Singapore roaster can do at the top of its game, and you want to stay for a couple of hours. The retail wall stocks Papa Palheta and PPP beans, and the team often runs cuppings and brewing workshops at the on-site academy.</p>`,
    rating: "4.3 (2857)",
    address: "150 Tyrwhitt Road, Singapore 207563",
    hours_weekday: "Mon–Fri: 09:00–22:00",
    hours_saturday: "Saturday: 09:00–22:00",
    hours_sunday: "Sunday: 09:00–22:00",
    website: "https://cshhcoffee.com",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "micro_lots", "experimental_styles", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "retail_beans", "online_beans", "offers_classes", "pastry_snacks", "lunch_brunch", "work_friendly", "to_go", "certified_baristas", "community_events"],
  },
  {
    slug: "ppp-coffee-singapore",
    name: "PPP Coffee",
    category: CAT_ROASTER,
    excerpt_short: "PPP Coffee is Papa Palheta's retail-facing arm — small-batch single origins, daily-rotating filter menu, and a daily packed Funan outlet.",
    excerpt_long: "PPP — short for Papa Palheta — is the retail brand of the roaster behind Chye Seng Huat Hardware. Founded 2009, the Funan flagship offers a daily-rotating filter menu, vintage frozen-coffee collection, and the same small-batch single origins served at the parent operation, in a busier, more compact format suited to office-district mornings.",
    summary: "PPP Coffee — Papa Palheta's retail brand since 2009. Funan flagship, daily-rotating filter menu, vintage frozen coffees, espresso + pour-over, multi-outlet.",
    flavour_profile: "Papa Palheta retail since 2009. Daily-rotating filter menu, vintage frozen-coffee collection, small-batch single origins, multi-outlet.",
    about: `<p>PPP Coffee is the more compact, retail-driven sibling to Chye Seng Huat Hardware — same Papa Palheta beans, faster service, more locations. The Funan flagship sits inside the rebuilt Funan mall on North Bridge Road and runs a tight bar designed for the office crowd: espresso on a polished machine, a small but rotating pour-over menu, and a feature that sets the brand apart — a vintage frozen-coffee collection where cold-aged lots are pulled at different intervals for tasting.</p><p>The single origins follow Papa Palheta's wider sourcing philosophy: direct relationships, light-to-medium roasts, transparency on the bean cards. Expect Ethiopian washed coffees alongside Latin American lots and the occasional Asian micro-lot. Retail beans line the back wall.</p><p>For visitors short on time, PPP is the easier and more central CSHH experience. For Singaporeans, it's the daily-driver caffeine source that happens to roast its own coffee — and roast it well.</p>`,
    rating: "4.2 (673)",
    address: "107 North Bridge Road, #02-19, Funan, Singapore 179105",
    hours_weekday: "Mon–Fri: 08:00–20:00",
    hours_saturday: "Saturday: 10:00–20:00",
    hours_sunday: "Sunday: 10:00–20:00",
    website: "https://pppcoffee.com",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "to_go", "certified_baristas"],
  },
  {
    slug: "tiong-hoe-specialty-coffee-singapore",
    name: "Tiong Hoe Specialty Coffee",
    category: CAT_SPECIALTY,
    excerpt_short: "Tiong Hoe Specialty Coffee turns 50 years of family coffee history into one of Singapore's deepest single-origin programmes.",
    excerpt_long: "The Tiong Hoe family has been in Singapore coffee since 1958, but the specialty arm on Stirling Road only opened in 2014. The menu carries twenty-plus rotating single origins from Africa, Asia, and the Americas, alongside the family's signature Missing Ruby blend — an Ethiopian-Brazilian pairing that captures the operation's old-meets-new feel.",
    summary: "Tiong Hoe Specialty Coffee — Stirling Road specialty arm of a 50-year Singapore coffee family. 20+ single origins, Missing Ruby blend, training academy, retail wall.",
    flavour_profile: "50-year family legacy. 20+ rotating single origins, Missing Ruby blend (Ethiopian/Brazilian), in-house roasting, academy, retail beans.",
    about: `<p>The Tiong Hoe family has been roasting coffee in Singapore since 1958, but the specialty café you'll visit on Stirling Road only opened in 2014. The continuity matters: this is one of the few specialty operations in the city where you can taste fifty years of accumulated coffee knowledge in a cup.</p><p>The menu carries twenty-plus rotating single origins from across the producing world — Yirgacheffes, Geishas, Kenyan AAs, Sumatran lots, Brazilian naturals — alongside the family's signature Missing Ruby blend, an Ethiopian-Brazilian pairing that bridges the operation's old-trade and third-wave halves. Roasts run light enough to show origin, full enough to brew through espresso, batch, and pour-over.</p><p>The space is a warm, mostly utilitarian roastery-café in Stirling Road's HDB block, doubling as a barista training academy and retail shop. Locals come for the daily espresso and the bean wall; visitors come for the menu depth. Either way, it's one of the rare Singapore cafés where the staff genuinely have time to talk about the bean in your cup.</p>`,
    rating: "4.6 (757)",
    address: "170 Stirling Road, #01-1133, Singapore 140170",
    hours_weekday: "Mon–Fri: 08:00–18:00",
    hours_saturday: "Saturday: 08:00–18:00",
    hours_sunday: "Sunday: 08:00–18:00",
    website: "https://tionghoecoffee.com",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "offers_classes", "to_go", "certified_baristas"],
  },
  {
    slug: "kurasu-singapore",
    name: "Kurasu Singapore",
    category: CAT_SPECIALTY,
    excerpt_short: "Kurasu Singapore is the Kyoto roastery's Waterloo Street brew bar — weekly-fresh beans flown in from Japan.",
    excerpt_long: "Kurasu started in Kyoto and brought its meticulous brew-bar format to Singapore at 261 Waterloo Street. Beans arrive weekly from the Japanese roastery, served as a tight rotating selection of pour-overs alongside ceremonial matcha and a small range of espresso drinks. The format is precise, the service is unhurried, and the cups taste of distance well covered.",
    summary: "Kurasu Singapore — the Kyoto specialty brand's Waterloo Street brew bar. Weekly Kyoto-roasted beans, ceremonial matcha, pour-over focus, retail brewing equipment, kissaten precision.",
    flavour_profile: "Kyoto roastery in SG. Weekly-fresh beans from Japan, pour-over focus, ceremonial matcha, kissaten aesthetic, brewing equipment retail.",
    about: `<p>Kurasu Singapore is, in spirit and practice, an embassy of Kyoto coffee culture. The parent operation roasts in Japan; beans are flown weekly to the Waterloo Street brew bar near Bras Basah, served the way a Kyoto kissaten would serve them — slowly, precisely, with attention to water and weight.</p><p>The menu is short and rotating. Expect three to four single-origin filter options at any time, brewed primarily on hand pour-over, plus a small line of espresso drinks for those who want something quicker. Ceremonial matcha is part of the offer too, prepared with the same precision as the filter. The space is minimal — pale wood, clean lines, equipment displayed like instruments.</p><p>This is also one of the only places in Singapore where you can buy proper Japanese brewing gear: Kalita Wave drippers, Hario Mugen brewers, Origami cups, the lot. If you want to taste how Japanese specialty thinks about coffee, you don't need to fly to Kyoto. Kurasu has brought it to Bugis.</p>`,
    rating: "4.4 (1163)",
    address: "261 Waterloo Street, #01-24, Singapore 180261",
    hours_weekday: "Mon–Fri: 08:00–17:00",
    hours_saturday: "Saturday: 09:00–18:00",
    hours_sunday: "Sunday: 09:00–18:00",
    website: "https://kurasu.kyoto/sg",
    booleans: ["ethical_sourcing", "single_origin", "micro_lots", "hand_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "ships_internationally", "offers_classes", "to_go", "certified_baristas"],
  },
  {
    slug: "maxi-coffee-bar-singapore",
    name: "Maxi Coffee Bar",
    category: CAT_SPECIALTY,
    excerpt_short: "Maxi Coffee Bar is the Ann Siang Hill shophouse cafe known for cereal-milk lattes and seasonal single-origin filter rotations.",
    excerpt_long: "Tucked into a heritage shophouse on Ann Siang Hill, Maxi Coffee Bar is one of the central neighbourhood's most reliable specialty addresses. The menu pairs a tight rotation of seasonal single-origin filters with house-developed signatures — including the iced cereal-milk latte that became a local internet phenomenon — and a pastry case worth lingering over.",
    summary: "Maxi Coffee Bar — Ann Siang Hill specialty shophouse café. Seasonal single-origin filters, signature cereal-milk latte, house chai, weekend pastries, restored heritage interior.",
    flavour_profile: "Ann Siang shophouse. Seasonal single-origin filters, iced cereal-milk latte signature, house chai, pastries, weekend brunch.",
    about: `<p>The corner of Club Street and Ann Siang Hill is one of Singapore's most photographed central addresses, lined with pastel-painted heritage shophouses — and Maxi Coffee Bar has one of the best of them. The Club Street shophouse leans warm and minimal inside, with bar seating, small tables, and a quietly busy weekday morning crowd. (The rear entrance opens onto Ann Siang Hill itself.)</p><p>The coffee programme is more serious than the cosy frontage suggests. Expect a rotating filter menu of single-origin coffees — recent boards have featured washed Ethiopians and Kenyan SL34s — alongside a clean house espresso and house-developed signatures, including the iced cereal-milk latte that has become something of a Singapore specialty meme and is genuinely good. House chai is made from scratch.</p><p>The food side keeps pace: a tight breakfast and brunch menu plus a daily-changing pastry case from local bakeries. This is the kind of place locals slip into for a Tuesday espresso between meetings, and that visitors discover after walking up Ann Siang Hill on a Saturday afternoon. Worth the climb either way.</p>`,
    rating: "4.7 (738)",
    address: "64 Club Street, Singapore 069438",
    hours_weekday: "Mon–Fri: 08:00–17:00",
    hours_saturday: "Saturday: 09:00–17:00",
    hours_sunday: "Sunday: 09:00–17:00",
    website: "https://maxicoffeebar.com",
    booleans: ["single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "pastry_snacks", "lunch_brunch", "work_friendly", "to_go", "certified_baristas"],
  },
  {
    slug: "alchemist-coffee-singapore",
    name: "Alchemist",
    category: CAT_SPECIALTY,
    excerpt_short: "Alchemist is the Singapore specialty café-chain that started as a takeaway hatch and grew into a rotating-blend roastery institution.",
    excerpt_long: "Alchemist started as a takeaway coffee window inside International Plaza and has grown into one of Singapore's most recognised independent specialty operations. The Mill outlet at 5 Jalan Kilang is the flagship, anchored by the signature Equilibrium blend and a deeper menu of rotating signature blends, single origins, and seasonal filter coffees.",
    summary: "Alchemist — Singapore specialty café with rotating signature blends, Jalan Kilang flagship. Equilibrium blend, multi-outlet, espresso + filter, MacTaggart roastery, heritage landmark settings.",
    flavour_profile: "Independent multi-outlet specialty. Signature Equilibrium blend, rotating signatures, in-house roastery on MacTaggart, espresso + filter, retail beans.",
    about: `<p>Alchemist began life as a small takeaway hatch inside Tanjong Pagar's International Plaza, serving coffee to the office crowd. A decade on, it is one of Singapore's most recognised independent specialty brands, with a flagship at The Mill on Jalan Kilang, a roastery on MacTaggart Road, and a handful of outlets across central neighbourhoods.</p><p>The coffee programme is built around the signature Equilibrium blend — designed for both espresso and milk drinks — alongside a deeper menu of rotating signature blends, single origins, and seasonal filter options. Expect the operation to lean toward approachable medium-light profiles rather than experimental fermentations: this is specialty coffee aimed at the broadest sensible audience, executed well.</p><p>The Mill flagship occupies an industrial-conversion space with high ceilings, communal tables, and a steady weekday flow of remote workers and meeting-takers. Beans are sold retail and online; subscriptions are available. For visitors building a multi-stop Singapore specialty crawl, Alchemist is the dependable middle of the spectrum between hole-in-the-wall and roastery destination.</p>`,
    rating: "4.6 (419)",
    address: "5 Jalan Kilang, #02-02, The Mill, Singapore 159405",
    hours_weekday: "Mon–Fri: 08:00–17:00",
    hours_saturday: "Saturday: 09:00–17:00",
    hours_sunday: "Sunday: 09:00–17:00",
    website: "https://alchemist.com.sg",
    booleans: ["in_house_roasting", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "work_friendly", "to_go"],
  },
  {
    slug: "foreword-coffee-roasters-singapore",
    name: "Foreword Coffee Roasters",
    category: CAT_ROASTER,
    excerpt_short: "Foreword Coffee Roasters is the Singapore social enterprise sourcing direct from Asian smallholder farms and hiring inclusively across every outlet.",
    excerpt_long: "Foreword is one of Singapore's most distinctive specialty roasters: a social enterprise that sources directly from Asian smallholder coffee farms — Indonesia, Vietnam, Thailand, the Philippines — and runs a hiring model dedicated to employing persons with disabilities and mental health conditions. The Orchard Road flagship pairs that mission with a clean, well-trained specialty coffee programme.",
    summary: "Foreword Coffee Roasters — Singapore specialty social enterprise. Direct-trade Asian smallholder sourcing, inclusive hiring model, multi-outlet, espresso + filter, retail beans.",
    flavour_profile: "Social-enterprise roaster. Direct-trade Asian smallholder sourcing (Indonesia, Vietnam, Thailand, Philippines), inclusive hiring, espresso + filter, retail beans.",
    about: `<p>Foreword Coffee Roasters does two things differently. First, it sources directly from smallholder coffee farms across Asia — Indonesia, Vietnam, Thailand, the Philippines — rather than the more obvious Latin American and African origins most Singapore roasters lean on. Second, it operates as a social enterprise with an explicit hiring model: outlets are staffed by persons with disabilities and mental health conditions, with structured training, support, and progression in place.</p><p>The coffee programme stands up on its own terms. Expect light-to-medium roasts that draw out the distinctive character of less-familiar origins: a clean Vietnamese arabica, a fruit-forward Thai natural, a Sumatran washed lot. Espresso runs through a clean house blend; filter options rotate; cold brew is available year-round.</p><p>The Orchard Road outlet at Temasek Shophouse is the brand's most central location, with additional sites at Bras Basah, Funan, and across the city. Bags are sold retail. If you want a Singapore specialty stop that connects your cup to both a regional origin story and a social mission, Foreword is the answer.</p>`,
    rating: "4.6 (177)",
    address: "28 Orchard Road, Singapore 238832",
    hours_weekday: "Mon–Fri: 08:00–19:00",
    hours_saturday: "Saturday: 09:00–19:00",
    hours_sunday: "Sunday: 09:00–19:00",
    website: "https://forewordcoffee.com",
    booleans: ["in_house_roasting", "ethical_sourcing", "single_origin", "micro_lots", "hand_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "pastry_snacks", "work_friendly", "to_go", "community_events"],
  },
  {
    slug: "homeground-coffee-roasters-singapore",
    name: "Homeground Coffee Roasters",
    category: CAT_ROASTER,
    excerpt_short: "Homeground Coffee Roasters runs a quietly serious Bukit Timah café anchored by the conviction that the best brew is yours.",
    excerpt_long: "Homeground's tagline — \"the best brew is by you\" — captures the brand's home-brewing focus: rotating single origins designed to perform on simple equipment, friendly staff happy to talk through grind and water, and a Bukit Timah Road café that reopened in 2025 with a new look and remains a quiet specialty anchor for the western fringes.",
    summary: "Homeground Coffee Roasters — community-focused Bukit Timah specialty roastery. Rotating single origins, home-brewing emphasis, all-day brunch, retail beans, reopened 2025.",
    flavour_profile: "\"Best brew is by you\" community roaster. Rotating single origins, home-brewing focus, brunch menu, retail beans, friendly staff.",
    about: `<p>Homeground Coffee Roasters has built its identity around a single, slightly subversive idea — that the best version of the coffee they roast is the one you make at home. The Bukit Timah Road flagship, which reopened with a fresh look in 2025, reflects that philosophy. The bar is welcoming rather than performative; the team genuinely enjoys talking through grind size, water, ratios, and what would work on whatever brewer is in your kitchen.</p><p>The coffee programme runs on rotating single origins roasted in small batches. Profiles lean approachable — medium-light, balanced, designed to forgive slightly off home setups while still rewarding good ones. Espresso is clean; pour-over options rotate; cold brew is on the menu year-round. The brunch side does the job: eggs, sandwiches, pastries, the things Singaporeans want with a weekend filter coffee.</p><p>Locals come for the consistency. Visitors crossing into Bukit Timah come because Homeground is the friendliest entry point into Singapore specialty if you're new to it — and that's not a small thing.</p>`,
    rating: "4.4 (955)",
    address: "911 Bukit Timah Road, Singapore 589622",
    hours_weekday: "Mon–Fri: 08:00–16:30",
    hours_saturday: "Saturday: 12:00–16:30",
    hours_sunday: "Sunday: 12:00–16:30",
    website: "https://homegroundcoffeeroasters.com",
    booleans: ["in_house_roasting", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "pastry_snacks", "lunch_brunch", "work_friendly", "to_go", "community_events"],
  },
  {
    slug: "glyph-supply-co-singapore",
    name: "Glyph Supply Co",
    category: CAT_SPECIALTY,
    excerpt_short: "Glyph Supply Co is the Somerset cafe-roastery concept space serving minimalist filter coffee and oat cold brews.",
    excerpt_long: "Glyph Supply Co works as part café, part roastery, part minimalist concept space — tucked into Venture Avenue near Somerset. The menu is deliberately short: a tight filter selection that has recently featured rarities like CCD Don Ruben No. 16 from Panama, a clean house espresso, and an oat cold brew worth coming back for.",
    summary: "Glyph Supply Co — Somerset cafe-roastery concept. Minimalist filter selection, extensive single-origin rotation, oat cold brew, in-house roasting, Venture Avenue location, retail beans.",
    flavour_profile: "Cafe-roastery concept space. Minimalist filter menu, oat cold brew, rare single origins (CCD Don Ruben Panama), in-house roasting, retail beans.",
    about: `<p>Glyph Supply Co is a small, deliberately understated cafe-roastery near Somerset on Venture Avenue. The space borrows from Tokyo-style coffee bars and Scandinavian design in equal measure — pale wood, clean lines, minimal signage — and the menu follows the same philosophy: short, considered, and quietly ambitious.</p><p>The filter programme is the heart of the operation. Expect a small rotating board of single-origin pour-overs that runs from accessible washed Ethiopians and Kenyans through to the occasional rarity — a recent slot featured CCD Don Ruben No. 16 from Panama, a variety that doesn't show up often on Singapore menus. House espresso is clean, alt-milks are available, and the oat cold brew is a consistent local recommendation.</p><p>Glyph also functions as a working roastery, with beans sold retail at the bar and online through their store. The crowd skews specialty-curious rather than transactional, and the staff are happy to talk through any cup. A useful Somerset stop for anyone building a multi-cafe Singapore day.</p>`,
    rating: "4.3 (517)",
    address: "1 Venture Avenue, #02-04, Singapore 608521",
    hours_weekday: "Mon–Fri: 08:00–17:00",
    hours_saturday: "Saturday: 09:00–17:00",
    hours_sunday: "Sunday: 09:00–17:00",
    website: "https://www.glyphsupplyco.com",
    booleans: ["in_house_roasting", "single_origin", "micro_lots", "hand_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "pastry_snacks", "work_friendly", "to_go"],
  },
  {
    slug: "rookies-coffee-shop-singapore",
    name: "Rookie's Coffee Shop",
    category: CAT_SPECIALTY,
    excerpt_short: "Rookie's Coffee Shop is the Bukit Merah café run by former AeroPress champion Junior Lim — Singapore's most precise filter bar.",
    excerpt_long: "Rookie's Coffee Shop is a small, intensely focused specialty café in a Bukit Merah HDB block, run by former AeroPress champion Junior Lim. The menu is short and brew-method-driven — seasonal single origins served primarily on AeroPress, alongside a tight espresso programme — and the bar holds a 4.8★ rating from over 200 reviews, the highest on our Singapore shortlist.",
    summary: "Rookie's Coffee Shop — Bukit Merah specialty café by AeroPress champion Junior Lim. Highest-rated cafe on our SG shortlist. AeroPress brewing, seasonal single origins, espresso programme.",
    flavour_profile: "Run by former AeroPress champion Junior Lim. AeroPress focus, seasonal single origins, tight espresso programme, Bukit Merah HDB block, highest-rated SG specialty cafe.",
    about: `<p>Rookie's Coffee Shop occupies a small unit in a Bukit Merah HDB block, and is run by Junior Lim — a former AeroPress competition champion whose specialty cafe credentials genuinely show in every cup. This is the kind of place where the brew method is the headline, not the décor: a clean bar, simple seating, and a focus that has earned Rookie's the highest Google rating on our entire Singapore shortlist.</p><p>The menu is deliberately short. Expect a rotating selection of seasonal single origins, served primarily on AeroPress (Junior Lim's competition tool) but also available as pour-over on request. Espresso runs through a tight house programme that prioritises clarity over volume. The bean cards explain origin, process, and brew suggestion in detail — and the staff will happily talk through any of them.</p><p>This is a destination for the specialty enthusiast rather than a daily commuter spot. If you want to see what an AeroPress can do in the hands of someone who has competed at the top level, Rookie's is one of the only addresses in Singapore that delivers.</p>`,
    rating: "4.8 (239)",
    address: "123 Bukit Merah Lane 1, #01-112, Singapore 150123",
    hours_weekday: "Mon–Fri: 08:30–16:00",
    hours_saturday: "Saturday: 09:00–16:00",
    hours_sunday: "Sunday: 09:00–16:00",
    website: "https://rookiescoffee.sg",
    booleans: ["single_origin", "award_winning", "micro_lots", "hand_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "offers_classes", "pastry_snacks", "to_go", "certified_baristas"],
  },
  {
    slug: "dutch-colony-coffee-co-singapore",
    name: "Dutch Colony Coffee Co",
    category: CAT_ROASTER,
    excerpt_short: "Dutch Colony Coffee Co is one of Singapore's most established multi-location specialty roasters, anchored by its Frankel Avenue flagship.",
    excerpt_long: "Dutch Colony has been growing the Singapore specialty scene for over a decade, with a Frankel Avenue flagship plus outlets across the city. The bean programme leans toward approachable balance — espresso blends and rotating single origins designed to work in milk and on filter — and the cafés function as reliable neighbourhood specialty anchors.",
    summary: "Dutch Colony Coffee Co — established multi-location Singapore specialty roaster. Frankel Avenue flagship, balanced house espresso, rotating single origins, neighbourhood-focused outlets.",
    flavour_profile: "Established multi-location specialty roaster. Frankel Avenue flagship, balanced espresso blends, rotating single origins, neighbourhood outlets.",
    about: `<p>Dutch Colony Coffee Co has been one of the steady builders of Singapore's specialty scene — less photographed than Apartment, less written about than Nylon, but woven into the daily caffeine habits of more Singaporeans than either. The Frankel Avenue flagship in the East anchors the operation, with additional outlets spread across the city's central and Eastern neighbourhoods.</p><p>The coffee programme is built for repeat business. Expect a well-balanced house espresso blend, a rotating single-origin filter option, and a clean approach to milk-based drinks that holds up day after day. Roasts run medium — designed to perform across the menu rather than to spotlight a single brew method. Retail bags line the back wall.</p><p>The cafés themselves are unfussy: bright, well-laid-out, suitable for a quick takeaway or a slower sit-in. This is the answer to "where do specialty-minded Singaporeans go on a Tuesday morning?" — a roaster that earned its place in the daily rotation by being consistent over years rather than by chasing trends.</p>`,
    rating: "4.3 (1480)",
    address: "113 Frankel Avenue, Singapore 458230",
    hours_weekday: "Mon–Fri: 07:30–19:00",
    hours_saturday: "Saturday: 08:00–19:00",
    hours_sunday: "Sunday: 08:00–19:00",
    website: "https://dutchcolony.sg",
    booleans: ["in_house_roasting", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "to_go"],
  },
  {
    slug: "brawn-and-brains-coffee-singapore",
    name: "Brawn & Brains Coffee",
    category: CAT_ROASTER,
    excerpt_short: "Brawn & Brains Coffee is the Hamilton Road roaster behind some of Singapore's most carefully-roasted small-batch single origins since 2013.",
    excerpt_long: "Brawn & Brains has been roasting since 2013, with its original Guillemard Road flagship temporarily closed for the Old Badminton Hall renovation. The current home — a calm Hamilton Road space near Bendemeer MRT — runs a small-batch character-driven programme: light-to-medium roasts on coffees sourced for clarity, plus a tight rotating filter board worth crossing town for.",
    summary: "Brawn & Brains Coffee — Hamilton Road Singapore small-batch roaster since 2013. Bean-character-led light roasts, rotating single origins, espresso + filter, retail beans.",
    flavour_profile: "Hamilton Road roaster since 2013. Small-batch light-to-medium roasts, rotating single origins, bean-character focus, espresso + filter, retail beans.",
    about: `<p>Brawn & Brains Coffee has been roasting in Singapore since 2013, and the brand's current home on Hamilton Road in Kallang reflects what years of small-batch practice produces. The original Guillemard Road flagship — inside the Old Singapore Badminton Hall — has been closed since 2022 for renovation works, and Hamilton Road has taken over as the main café and roastery hub.</p><p>The coffee programme is unhurried and character-driven. Lots are sourced for clarity, roasts run light-to-medium, and the menu rotates as the harvest calendar moves. There is no signature blend that has to be everything to everyone — instead, every coffee is a deliberate choice. The café side runs a clean house espresso, a rotating single-origin filter option, and a small line of milk-based drinks, with retail bags stocked along the back wall.</p><p>A five-minute walk from Bendemeer MRT, this is one of Kallang's most reliable specialty stops and a useful detour for anyone exploring beyond Singapore's central specialty corridor. Order a filter, take a seat, and let the cup move at its own pace.</p>`,
    rating: "4.2 (191)",
    address: "16 Hamilton Road, #01-06, Singapore 209186",
    hours_weekday: "Mon–Fri: 08:00–17:00",
    hours_saturday: "Saturday: 08:30–17:00",
    hours_sunday: "Sunday: 08:30–17:00",
    website: "https://brawnandbrains.sg",
    booleans: ["in_house_roasting", "single_origin", "micro_lots", "hand_brews", "batch_brews", "espresso_milk_drinks", "alt_milk", "cold_brew", "retail_beans", "online_beans", "subscription", "pastry_snacks", "to_go"],
  },
];

const ALL_BOOLS: Array<keyof Place> = [
  "in_house_roasting", "ethical_sourcing", "single_origin", "award_winning", "micro_lots",
  "experimental_styles", "hand_brews", "batch_brews", "espresso_milk_drinks", "decaf_options",
  "alt_milk", "cold_brew", "offers_classes", "retail_beans", "online_beans", "pastry_snacks",
  "lunch_brunch", "work_friendly", "outdoor_seating", "pet_friendly", "certified_baristas",
  "ships_internationally", "subscription", "to_go", "byo_cup_loyalty", "community_events",
];

function seedToPlace(seed: SgCafeSeed): Place {
  const booleanFields: Partial<Place> = {};
  for (const b of ALL_BOOLS) (booleanFields as Record<string, boolean>)[b] = seed.booleans.includes(b);
  const photo = CAFE_PHOTOS[seed.slug] ?? FALLBACK_CAFE_IMAGE;
  return {
    webflow_id: `preview-${seed.slug}`,
    slug: seed.slug,
    name: seed.name,
    city_webflow_id: PREVIEW_CITY_WEBFLOW_ID,
    category_webflow_id: seed.category,
    excerpt_short: seed.excerpt_short,
    excerpt_long: seed.excerpt_long,
    summary: seed.summary,
    flavour_profile: seed.flavour_profile,
    about: seed.about,
    button_text: `Discover ${seed.name}`,
    rating: seed.rating,
    address: seed.address,
    hours_weekday: seed.hours_weekday,
    hours_saturday: seed.hours_saturday,
    hours_sunday: seed.hours_sunday,
    thumbnail_v1_url: photo,
    thumbnail_v2_url: photo,
    thumbnail_v3_url: photo,
    featured_image_url: photo,
    // Gallery is a premium-only feature — none of the SG cafes are premium listings.
    photo_gallery: [],
    website: seed.website,
    instagram: null,
    booking_link: null,
    phone: null,
    email: null,
    is_featured: !!seed.is_featured,
    ...booleanFields,
  } as Place;
}

export function getPreviewCity(): City {
  return SG_CITY;
}

export function getPreviewPlaces(): Place[] {
  return SEEDS.map(seedToPlace);
}
