"use client";
import { post } from "./client";
export function LogoutButton({ className = "btn btn-ghost btn-sm" }: { className?: string }) {
  return <button className={className} onClick={async () => { await post("/api/auth/logout"); window.location.href = "/"; }}>Sign out</button>;
}
