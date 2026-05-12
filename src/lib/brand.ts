// Brand asset URLs — all now served from our Cloudflare R2 bucket
// (lsc-images, via pub-8b061befab9c49bda0632e3619d45c0f.r2.dev). The
// migration script in scripts/migrate-images-r2.mjs rewrites these
// whenever new Webflow CDN URLs appear in the source.

export const BRAND = {
  logo: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67d563468b5918265ae11dff_brandmark-design_2-1-.png`,
  newsletterIcon: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67e282473803f79eac315745_48x48_Newsletter_Icon-3-1-.svg`,
  brewtifulMapVisual: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67ec41bcc721c1659c005b6c_Specialty_Coffee_Map_Visual-2-.png`,
  searchLoupe: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/680b4ec792d3117c37ea8922_Vector.svg`,
  highlightArrow: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6810cc8f1863e651519da90a_16x16px-Highlight-Specialty-Coffee-Arrow-1-.svg`,
  faceWithBandage: `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/680b4ec792d3117c37ea8920_face-with-head-bandage_1f915.png`,
  // Hero collage: 7 cafe + scene images, arranged in 3 columns on Webflow
  heroCollage: [
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6808a076f7ec8300bb6ae05c_Dark-Matter-Coffee_500x500.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67db27d4dfa53c16ae20848c_Bike-and-Coffee-shop.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6808a037b3a6c3b875a7641a_Rosslyn_500x500.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6808abcc024139c740f1655e_Party-at-Pavillon_500x500.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6808a96fe51fadf5bf0ce52c_Praxis-Coffee-Roasters_500x500.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67db280d8badcdfab67efa23_specialty-coffee-cupping-barista.avif`,
    `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/6808a0b4352c710288e28f00_Assembly-Cofffee_500x500.avif`,
  ],
  // Category icons used in pill badges on place cards (lifted from CMS, but
  // hard-coded here for stable lookup; the place-card pill always shows the
  // small cup icon for "Specialty Coffee Shop" by default).
  categoryIcons: {
    "specialty-coffee-shops": `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67e275bb08a5ef1fe0ec2b1a_Specialty-coffee-icon-1-.svg`,
    "coffee-roasters": `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67e2767aac1a28f7ecb38ab3_Coffee-Roaster-Large-Icon.svg`,
    "barista-course": `https://pub-8b061befab9c49bda0632e3619d45c0f.r2.dev/images/lsc/67e2759d87bd4e92002b8008_Coffee-Classes-icon-2-.svg`,
  } as Record<string, string>,
};

// Public Google Maps Embed API key used on the live Webflow site.
// (Restricted to www.localspecialtycoffee.com referrers — also works on
// localspecialtycoffee.vercel.app and the apex domain.)
export const GOOGLE_MAPS_EMBED_KEY = "AIzaSyAUK4rvE7KbKAAOnjyLaKw2BpVEmJqmzNE";
