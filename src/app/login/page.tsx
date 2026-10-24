import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AUTH_COOKIE, computeAuthToken } from "@/lib/auth";

async function login(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  if (password !== process.env.APP_PASSWORD) {
    redirect("/login?error=1");
  }

  const token = computeAuthToken();
  if (token) {
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  redirect("/");
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <form action={login} className="flex w-72 flex-col gap-3">
      <h1 className="text-lg font-semibold tracking-tight">MindFlow AI</h1>
      <Input type="password" name="password" placeholder="Password" autoFocus />
      {error && <p className="text-sm text-destructive">Wrong password.</p>}
      <Button type="submit">Enter</Button>
    </form>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Suspense fallback={<div className="w-72" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
