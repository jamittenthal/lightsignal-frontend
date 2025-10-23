"use client";

import React from "react";
import Link from "next/link";
import { useDemo } from "./DemoModeProvider";

export default function PrefixedLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const { isDemo } = useDemo();
  const resolved = isDemo && href.startsWith('/') ? `/demo${href}` : href;
  return <Link href={resolved} className={className}>{children}</Link>;
}
