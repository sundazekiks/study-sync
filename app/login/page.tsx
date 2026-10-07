import type { Metadata } from "next";

import AuthForm from "@/app/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to StudySync to reach your dashboard and course workspaces.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
