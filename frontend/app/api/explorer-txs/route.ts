import { NextRequest, NextResponse } from "next/server";

const EXPLORER_API = "https://explorer-bradbury.genlayer.com/api/v1";

/** Clamp a query param to a bounded positive integer (defends against
 *  query-param injection — e.g. `limit=10&address=<other>` — by never passing
 *  raw user input into the upstream URL). */
function boundedInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page  = boundedInt(searchParams.get("page"), 1, 1, 10_000);
  const limit = boundedInt(searchParams.get("limit"), 10, 1, 100);
  const ca    = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

  const url = `${EXPLORER_API}/transactions?address=${encodeURIComponent(ca)}&limit=${limit}&page=${page}`;

  try {
    const res  = await fetch(url, { next: { revalidate: 15 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
