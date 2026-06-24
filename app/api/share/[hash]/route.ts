import { NextRequest, NextResponse } from "next/server";
import { getCachedShare } from "@/lib/server/aiFixGenerator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  if (!hash || hash.length !== 64) {
    return NextResponse.json(
      { error: "not_found", message: "Share link not found or expired" },
      { status: 404 }
    );
  }

  const cachedResult = getCachedShare(hash);

  if (!cachedResult) {
    return NextResponse.json(
      { error: "not_found", message: "Share link not found or expired" },
      { status: 404 }
    );
  }

  return NextResponse.json(cachedResult);
}