import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-blush bg-bg sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-sm font-light tracking-wider text-coral lowercase">local</span>
          <span className="text-base font-bold tracking-tight lowercase">specialty coffee</span>
        </Link>
        <ul className="hidden md:flex items-center gap-8 text-sm font-medium">
          <li><Link href="/cities" className="hover:text-coral transition-colors">Cities</Link></li>
          <li><Link href="/categories/specialty-coffee-shops" className="hover:text-coral transition-colors">Coffee Shops</Link></li>
          <li><Link href="/categories/coffee-roasters" className="hover:text-coral transition-colors">Roasters</Link></li>
          <li><Link href="/about" className="hover:text-coral transition-colors">About</Link></li>
          <li>
            <Link
              href="/submissions"
              className="rounded-full bg-coral text-white px-5 py-2 hover:bg-coral-300 transition-colors"
            >
              Submit a Spot
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
