import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-brand">Shohay</span>{" "}
          <span className="font-bengali">সহায়</span>
        </Link>
        <nav className="text-sm opacity-80">
          <Link href="/#campaigns" className="hover:text-brand">
            Campaigns · <span className="font-bengali">ক্যাম্পেইন</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
