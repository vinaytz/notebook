import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Element from "@/lib/models/element";
import Collection from "@/lib/models/collection";
import { getUserFromHeaders } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = getUserFromHeaders(req);

    const collection = await Collection.findById(id)
      .select("userId isPublic")
      .lean();
    if (!collection) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Allow access if public or if user is the owner
    const isOwner = user && collection.userId.toString() === user.userId;
    if (!collection.isPublic && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tags = await Element.distinct("tags", { collectionId: id });
    return NextResponse.json(tags.sort());
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
