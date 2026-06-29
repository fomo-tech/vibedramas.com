import { Menu, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 pt-safe">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden p-2">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </button>

          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/icons/phim-ngan-hay-logo-alpha.png"
              alt="Phim Ngắn Hay"
              width={908}
              height={299}
              priority
              className="h-auto w-36 sm:w-40"
            />
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search dramas..."
              className="h-9 w-64 rounded-md border border-input bg-transparent pl-8 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Login
          </button>
        </div>
      </div>
    </header>
  );
}
