import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collection from "@/lib/models/collection";
import { getUserFromHeaders } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromHeaders(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parentId = req.nextUrl.searchParams.get("parentId");
    const query: Record<string, unknown> = { userId: user.userId };
    if (parentId) {
      query.parentId = parentId;
    } else {
      query.parentId = null;
    }

    const collections = await Collection.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const user = getUserFromHeaders(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, isPublic, parentId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    // If creating a sub-collection, verify parent ownership
    if (parentId) {
      const parent = await Collection.findById(parentId).select("userId").lean();
      if (!parent || parent.userId.toString() !== user.userId) {
        return NextResponse.json({ error: "Parent collection not found" }, { status: 404 });
      }
    }

    const collection = await Collection.create({
      userId: user.userId,
      parentId: parentId || null,
      name: name.trim(),
      description: description?.trim() || "",
      isPublic: isPublic || false,
    });

    // Update parent sub-collection count
    if (parentId) {
      await Collection.findByIdAndUpdate(parentId, { $inc: { subCollectionCount: 1 } });
    }

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
