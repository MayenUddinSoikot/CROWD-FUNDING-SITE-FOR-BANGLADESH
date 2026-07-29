import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { CharityForm } from "./CharityForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Charities — Shohay admin" };

type Charity = {
  id: string;
  name: string;
  description: string | null;
  bkash_number: string | null;
  bank_name: string | null;
};

export default async function AdminCharitiesPage() {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { data } = await supabase
    .from("charities")
    .select("id, name, description, bkash_number, bank_name")
    .order("name");
  const charities = (data ?? []) as Charity[];

  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <p className="mt-8 text-sm">
          <Link href="/admin" className="opacity-60 hover:text-brand">
            ← Dashboard
          </Link>
        </p>
        <h1 className="mt-2 text-2xl font-bold">
          Verified charities · <span className="font-bengali">দাতব্য সংস্থা</span>
        </h1>
        <p className="mt-1 text-sm opacity-60">
          These are the charities occasion/birthday fundraisers can raise for.
          Money goes to these accounts — vet them carefully.
        </p>

        <div className="mt-6">
          <CharityForm />
        </div>

        <h2 className="mt-8 text-lg font-bold">
          {charities.length} charit{charities.length === 1 ? "y" : "ies"}
        </h2>
        <ul className="mt-3 space-y-2">
          {charities.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-foreground/10 bg-card p-4"
            >
              <p className="font-semibold">{c.name}</p>
              {c.description ? (
                <p className="text-sm opacity-70">{c.description}</p>
              ) : null}
              <p className="mt-1 text-xs opacity-50">
                Payout: {c.bkash_number ?? c.bank_name ?? "not set — add it"}
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
