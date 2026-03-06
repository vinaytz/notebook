import { NextRequest } from "next/server";

export function getUserFromHeaders(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const email = req.headers.get("x-user-email");
  const name = req.headers.get("x-user-name");

  if (!userId) return null;
  return { userId, email, name };
}
