export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <p className="mb-4 rounded-full border border-brand/30 bg-brand/10 px-4 py-1 text-sm font-medium text-brand">
        Coming soon · শীঘ্রই আসছে
      </p>

      <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
        <span className="text-brand">Shohay</span>{" "}
        <span className="font-bengali">সহায়</span>
      </h1>

      <p className="mt-6 max-w-xl text-lg leading-relaxed opacity-80">
        A crowdfunding platform for Bangladesh. Support verified campaigns for
        medical care, education, and disaster relief — with bKash, Nagad, and
        cards.
      </p>

      <p className="font-bengali mt-3 max-w-xl text-lg leading-relaxed opacity-80">
        বাংলাদেশের জন্য একটি ক্রাউডফান্ডিং প্ল্যাটফর্ম। যাচাইকৃত ক্যাম্পেইনে
        পাশে দাঁড়ান — বিকাশ, নগদ ও কার্ডের মাধ্যমে।
      </p>

      <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { en: "Verified campaigns", bn: "যাচাইকৃত ক্যাম্পেইন" },
          { en: "Local payments", bn: "বিকাশ · নগদ · কার্ড" },
          { en: "Transparent tracking", bn: "স্বচ্ছ হিসাব" },
        ].map((item) => (
          <div
            key={item.en}
            className="rounded-xl border border-foreground/10 p-4"
          >
            <p className="font-semibold">{item.en}</p>
            <p className="font-bengali mt-1 text-sm opacity-70">{item.bn}</p>
          </div>
        ))}
      </div>

      <footer className="mt-16 text-sm opacity-50">
        © {new Date().getFullYear()} Shohay · Made in Bangladesh 🇧🇩
      </footer>
    </main>
  );
}
