import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const company_id = body?.company_id || null;
    const res = NextResponse.json({ ok: true, company_id });
    if (company_id) {
      // set a cookie for server-side reads; secure/httpOnly omitted for dev convenience
      res.cookies.set('active_company_id', company_id, { path: '/', maxAge: 60 * 60 * 24 * 30 });
    } else {
      res.cookies.delete('active_company_id');
    }
    return res;
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as any)?.message || 'invalid' }, { status: 400 });
  }
}
