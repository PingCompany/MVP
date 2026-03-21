import { getSignInUrl } from "@workos-inc/authkit-nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo");
  const safeReturnTo =
    returnTo?.startsWith("/") && !returnTo.startsWith("//")
      ? returnTo
      : undefined;
  const url = await getSignInUrl(
    safeReturnTo ? { returnTo: safeReturnTo } : undefined,
  );
  return NextResponse.redirect(url);
}
