import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collection from "@/lib/models/collection";
import User from "@/lib/models/user";

export async function GET() {
  try {
    await dbConnect();

    const collections = await Collection.find({ isPublic: true })
      .sort({ createdAt: -1 })
      .lean();

    // Attach user names
    const userIds = [...new Set(collections.map((c) => c.userId?.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("name")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u.name]));

    const result = collections.map((c) => ({
      ...c,
      ownerName: userMap.get(c.userId?.toString()) || "Unknown",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching public collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
