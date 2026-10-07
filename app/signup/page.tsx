import type { Metadata } from "next";

import AuthForm from "@/app/components/auth-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Sign up for StudySync to start organizing study groups.",
};

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
