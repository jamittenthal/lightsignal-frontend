"use client";

import React from "react";
import { AuthGate } from "@/lib/auth";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}