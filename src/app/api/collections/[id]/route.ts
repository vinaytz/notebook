import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collection from "@/lib/models/collection";
import Element from "@/lib/models/element";
import { getUserFromHeaders } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const user = getUserFromHeaders(req);

    const collection = await Collection.findById(id).lean();
    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Allow access if public, or if the owner is requesting
    const isOwner = user && collection.userId?.toString() === user.userId;
    if (!collection.isPublic && !isOwner) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    return NextResponse.json({ ...collection, isOwner });
  } catch (error) {
    console.error("Error fetching collection:", error);
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 500 });
  }
}

export async function PATCH(
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
    const existing = await Collection.findById(id).select("userId").lean();
    if (!existing || existing.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const body = await req.json();
    // Only allow updating specific fields
    const allowedUpdates: Record<string, unknown> = {};
    if (body.name !== undefined) allowedUpdates.name = body.name;
    if (body.description !== undefined) allowedUpdates.description = body.description;
    if (body.isPublic !== undefined) allowedUpdates.isPublic = body.isPublic;

    const collection = await Collection.findByIdAndUpdate(id, allowedUpdates, {
      new: true,
    }).lean();

    return NextResponse.json(collection);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Failed to update collection" }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await Collection.findById(id).select("userId").lean();
    if (!existing || existing.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    await Element.deleteMany({ collectionId: id });
    await Collection.findByIdAndDelete(id);

    return NextResponse.json({ message: "Collection deleted successfully" });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Failed to delete collection" }, { status: 500 });
  }
}
