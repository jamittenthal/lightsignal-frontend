import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const API = process.env.NEXT_PUBLIC_API_URL || "";
  
  try {
    // Call backend logout with forwarded cookies
    await fetch(`${API}/auth/logout`, { 
      method: "POST", 
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
  } catch (e) {
    // ignore backend errors
  }
  
  // Redirect to login page
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

// Also support POST method for logout
export async function POST(request: NextRequest) {
  return GET(request);
}
