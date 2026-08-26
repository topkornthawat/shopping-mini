"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StoreHeader from "@/components/StoreHeader";
import { createClient } from "@/lib/supabase/client";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsEmailConfirm, setNeedsEmailConfirm] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setError("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      return;
    }
    if (password.length < 6) {
      setError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านและการยืนยันไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(
        signUpError.message.includes("already registered")
          ? "อีเมลนี้ถูกใช้สมัครสมาชิกไปแล้ว"
          : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่"
      );
      return;
    }

    if (data.session) {
      // Email confirmation is disabled in this Supabase project - user is
      // already logged in, continue straight to where they came from.
      router.push(next);
      router.refresh();
    } else {
      // Email confirmation is required before the user can log in.
      setNeedsEmailConfirm(true);
    }
  }

  if (needsEmailConfirm) {
    return (
      <div className="min-h-screen">
        <StoreHeader />
        <main className="mx-auto max-w-sm px-4 py-10">
          <div className="card p-6 text-center">
            <p className="mb-2 text-3xl">📧</p>
            <h1 className="mb-1 text-lg font-bold">ยืนยันอีเมลของคุณ</h1>
            <p className="text-sm text-muted">
              เราส่งอีเมลยืนยันไปที่ {email} แล้ว
              กรุณาเปิดอีเมลและกดยืนยันก่อนเข้าสู่ระบบ
            </p>
            <Link
              href="/login"
              className="btn-primary mt-5 inline-block px-6 py-2"
            >
              ไปหน้าเข้าสู่ระบบ
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <StoreHeader />
      <main className="mx-auto max-w-sm px-4 py-10">
        <div className="card p-6">
          <h1 className="mb-1 text-xl font-bold">สมัครสมาชิก</h1>
          <p className="mb-5 text-sm text-muted">
            ไม่ต้องกรอกข้อมูลส่วนตัวตอนนี้ ระบบจะบันทึกชื่อ ที่อยู่
            และเบอร์โทรให้อัตโนมัติตอนสั่งซื้อครั้งแรก
          </p>

          <form onSubmit={handleSignup} className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">อีเมล</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 text-sm"
                placeholder="อย่างน้อย 6 ตัวอักษร"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full p-2 text-sm"
                placeholder="พิมพ์รหัสผ่านอีกครั้ง"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="text-brand underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
