import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminClient } from "@/lib/admin";
import { EditCharityForm } from "./EditCharityForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit charity — Shohay admin" };

export default async function EditCharityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await getAdminClient();
  if (!supabase) redirect("/");

  const { id } = await params;
  const { data } = await supabase
    .from("charities")
    .select(
      "id, name, description, logo_url, bkash_number, bank_name, bank_account_name, bank_account_number, bank_branch"
    )
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 pb-16">
      <p className="mt-8 text-sm">
        <Link href="/admin/charities" className="opacity-60 hover:text-brand">
          ← Charities
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">Edit charity</h1>
      <div className="mt-6">
        <EditCharityForm charity={data} />
      </div>
    </main>
  );
}
