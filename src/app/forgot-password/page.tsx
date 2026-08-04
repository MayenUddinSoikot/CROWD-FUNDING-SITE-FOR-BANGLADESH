import type { Metadata } from "next";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password — Shohay সহায়",
};

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pb-16">
      <h1 className="mt-14 text-center text-2xl font-bold">
        Forgot your password?
      </h1>
      <p className="font-bengali mt-1 text-center opacity-70">
        পাসওয়ার্ড ভুলে গেছেন?
      </p>
      <p className="mt-3 text-center text-sm opacity-70">
        Enter the email you signed up with and we&rsquo;ll send you a link to
        set a new password.
      </p>

      <ForgotPasswordForm />

      <p className="mt-8 text-center text-xs leading-relaxed opacity-50">
        Forgot which email you used? Message us on our Facebook page or email
        support and our team will help you find your account.
      </p>
    </main>
  );
}
