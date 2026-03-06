import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Element from "@/lib/models/element";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    // Get all unique tags for a collection
    const tags = await Element.distinct("tags", { collectionId: id });
    return NextResponse.json(tags.sort());
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}
