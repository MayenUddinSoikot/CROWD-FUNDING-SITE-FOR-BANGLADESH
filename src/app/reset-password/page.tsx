import type { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password — Shohay সহায়",
};

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pb-16">
      <h1 className="mt-14 text-center text-2xl font-bold">
        Set a new password
      </h1>
      <p className="font-bengali mt-1 text-center opacity-70">
        নতুন পাসওয়ার্ড দিন
      </p>

      <ResetPasswordForm />
    </main>
  );
}
