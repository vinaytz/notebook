import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Collection from "@/lib/models/collection";

export async function GET() {
  try {
    await dbConnect();
    const collections = await Collection.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const collection = await Collection.create({
      name: name.trim(),
      description: description?.trim() || "",
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
