import { NextRequest, NextResponse } from "next/server";

const EXPLORER_API = "https://explorer-bradbury.genlayer.com/api/v1";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const page  = searchParams.get("page")  ?? "1";
  const limit = searchParams.get("limit") ?? "10";
  const ca    = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ?? "";

  const url = `${EXPLORER_API}/transactions?address=${ca}&limit=${limit}&page=${page}`;

  try {
    const res  = await fetch(url, { next: { revalidate: 15 } });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
