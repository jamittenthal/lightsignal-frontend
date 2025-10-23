"use client";

import { useRouter } from "next/navigation";

/**
 * Demo-aware navigation utility that prefixes /demo when the current path starts with /demo
 */
export function useDemoAwareNavigation() {
  const router = useRouter();
  
  const navigate = (path: string) => {
    try {
      const currentPath = window.location?.pathname || '';
      const isDemo = currentPath.startsWith('/demo');
      
      // If we're in demo and the path is an internal absolute path, prefix with /demo
      if (isDemo && path.startsWith('/') && !path.startsWith('/demo')) {
        router.push(`/demo${path}`);
      } else {
        router.push(path);
      }
    } catch (e) {
      // Fallback to regular navigation
      router.push(path);
    }
  };
  
  return { navigate, router };
}