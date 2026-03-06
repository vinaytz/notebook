import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Element from "@/lib/models/element";
import Collection from "@/lib/models/collection";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");

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

    // Verify collection exists
    const collection = await Collection.findById(id);
    if (!collection) {
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

    // Update element count
    await Collection.findByIdAndUpdate(id, { $inc: { elementCount: 1 } });

    return NextResponse.json(element, { status: 201 });
  } catch (error) {
    console.error("Error creating element:", error);
    return NextResponse.json({ error: "Failed to create element" }, { status: 500 });
  }
}
