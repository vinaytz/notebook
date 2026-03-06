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
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const user = getUserFromHeaders(req);

    // Check collection access — only fetch needed fields
    const collection = await Collection.findById(id)
      .select("userId isPublic")
      .lean();
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const isOwner = user && collection.userId?.toString() === user.userId;
    if (!collection.isPublic && !isOwner) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const query: Record<string, unknown> = { collectionId: id };
    if (tag) {
      query.tags = tag.toLowerCase();
    }

    const elements = await Element.find(query).sort({ createdAt: -1 }).lean();
    return NextResponse.json(elements);
  } catch (error) {
    console.error("Error fetching elements:", error);
    return NextResponse.json({ error: "Failed to fetch elements" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = getUserFromHeaders(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership — only fetch userId field
    const collection = await Collection.findById(id).select("userId").lean();
    if (!collection || collection.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const body = await req.json();
    const { imageUrl, imageFileId, thumbnailUrl, description, tags } = body;

    if (!imageUrl || !description) {
      return NextResponse.json(
        { error: "Image URL and description are required" },
        { status: 400 }
      );
    }

    const element = await Element.create({
      collectionId: id,
      imageUrl,
      imageFileId: imageFileId || "",
      thumbnailUrl: thumbnailUrl || imageUrl,
      description: description.trim(),
      tags: (tags || []).map((t: string) => t.trim().toLowerCase()).filter(Boolean),
    });

    await Collection.findByIdAndUpdate(id, { $inc: { elementCount: 1 } });

    return NextResponse.json(element, { status: 201 });
  } catch (error) {
    console.error("Error creating element:", error);
    return NextResponse.json({ error: "Failed to create element" }, { status: 500 });
  }
}
