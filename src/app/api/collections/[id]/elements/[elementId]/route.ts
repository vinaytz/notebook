import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Element from "@/lib/models/element";
import Collection from "@/lib/models/collection";
import { getUserFromHeaders } from "@/lib/api-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; elementId: string }> }
) {
  try {
    await dbConnect();
    const { id, elementId } = await params;
    const user = getUserFromHeaders(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await Collection.findById(id).select("userId").lean();
    if (!collection || collection.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const body = await req.json();
    const allowedUpdates: Record<string, unknown> = {};
    if (body.description !== undefined) allowedUpdates.description = body.description;
    if (body.tags !== undefined) allowedUpdates.tags = body.tags;

    const element = await Element.findOneAndUpdate(
      { _id: elementId, collectionId: id },
      allowedUpdates,
      { new: true }
    ).lean();

    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    return NextResponse.json(element);
  } catch (error) {
    console.error("Error updating element:", error);
    return NextResponse.json({ error: "Failed to update element" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; elementId: string }> }
) {
  try {
    await dbConnect();
    const { id, elementId } = await params;
    const user = getUserFromHeaders(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership — only fetch userId field
    const collection = await Collection.findById(id).select("userId").lean();
    if (!collection || collection.userId.toString() !== user.userId) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const element = await Element.findOneAndDelete({
      _id: elementId,
      collectionId: id,
    });

    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    await Collection.findByIdAndUpdate(id, { $inc: { elementCount: -1 } });

    return NextResponse.json({ message: "Element deleted successfully" });
  } catch (error) {
    console.error("Error deleting element:", error);
    return NextResponse.json({ error: "Failed to delete element" }, { status: 500 });
  }
}
