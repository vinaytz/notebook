import { NextResponse } from "next/server";
import { getRemoveAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  try {
    const response = NextResponse.json({ message: "Logged out successfully" });
    const cookie = getRemoveAuthCookieOptions();
    response.cookies.set(cookie.name, cookie.value, {
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      maxAge: cookie.maxAge,
      path: cookie.path,
    });
    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to logout" }, { status: 500 });
  }
}
