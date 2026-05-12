// Brand asset URLs lifted from the Webflow CDN — they continue to serve from
// Webflow's CDN after migration. Phase 4 will move these into the repo (or
// Supabase Storage) so they survive a Webflow plan cancellation.

const CDN = "https://cdn.prod.website-files.com/67d40637d300a0e9ce062510";
const CAT_CDN = "https://cdn.prod.website-files.com/67d40638d300a0e9ce06264e";

export const BRAND = {
  logo: `${CDN}/67d563468b5918265ae11dff_brandmark-design_2%20(1).png`,
  newsletterIcon: `${CDN}/67e282473803f79eac315745_48x48_Newsletter_Icon%20(3).svg`,
  brewtifulMapVisual: `${CDN}/67ec41bcc721c1659c005b6c_Specialty_Coffee_Map_Visual%20(2).png`,
  searchLoupe: `${CDN}/680b4ec792d3117c37ea8922_Vector.svg`,
  highlightArrow: `${CDN}/6810cc8f1863e651519da90a_16x16px%20Highlight%20Specialty%20Coffee-Arrow%20(1).svg`,
  faceWithBandage: `${CDN}/680b4ec792d3117c37ea8920_face-with-head-bandage_1f915.png`,
  // Hero collage: 7 cafe + scene images, arranged in 3 columns on Webflow
  heroCollage: [
    `${CDN}/6808a076f7ec8300bb6ae05c_Dark%20Matter%20Coffee_500x500.avif`,
    `${CDN}/67db27d4dfa53c16ae20848c_Bike%20and%20Coffee%20shop.avif`,
    `${CDN}/6808a037b3a6c3b875a7641a_Rosslyn_500x500.avif`,
    `${CDN}/6808abcc024139c740f1655e_Party%20at%20Pavillon_500x500.avif`,
    `${CDN}/6808a96fe51fadf5bf0ce52c_Praxis%20Coffee%20Roasters_500x500.avif`,
    `${CDN}/67db280d8badcdfab67efa23_specialty%20coffee%20cupping%20barista.avif`,
    `${CDN}/6808a0b4352c710288e28f00_Assembly%20Cofffee_500x500.avif`,
  ],
  // Category icons used in pill badges on place cards (lifted from CMS, but
  // hard-coded here for stable lookup; the place-card pill always shows the
  // small cup icon for "Specialty Coffee Shop" by default).
  categoryIcons: {
    "specialty-coffee-shops": `${CAT_CDN}/67e275bb08a5ef1fe0ec2b1a_Specialty%20coffee%20icon%20%20(1).svg`,
    "coffee-roasters": `${CAT_CDN}/67e2767aac1a28f7ecb38ab3_Coffee%20Roaster%20Large%20Icon.svg`,
    "barista-course": `${CAT_CDN}/67e2759d87bd4e92002b8008_Coffee%20Classes%20icon%20(2).svg`,
  } as Record<string, string>,
};

// Public Google Maps Embed API key used on the live Webflow site.
// (Restricted to www.localspecialtycoffee.com referrers — also works on
// localspecialtycoffee.vercel.app and the apex domain.)
export const GOOGLE_MAPS_EMBED_KEY = "AIzaSyAUK4rvE7KbKAAOnjyLaKw2BpVEmJqmzNE";
