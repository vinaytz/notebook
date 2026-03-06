import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Element from "@/lib/models/element";
import Collection from "@/lib/models/collection";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; elementId: string }> }
) {
  try {
    await dbConnect();
    const { id, elementId } = await params;

    const element = await Element.findOneAndDelete({
      _id: elementId,
      collectionId: id,
    });

    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    // Update element count
    await Collection.findByIdAndUpdate(id, { $inc: { elementCount: -1 } });

    return NextResponse.json({ message: "Element deleted successfully" });
  } catch (error) {
    console.error("Error deleting element:", error);
    return NextResponse.json({ error: "Failed to delete element" }, { status: 500 });
  }
}
