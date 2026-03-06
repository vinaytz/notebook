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

    const collections = await Collection.find({ userId: user.userId })
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
    const { name, description, isPublic } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Collection name is required" }, { status: 400 });
    }

    const collection = await Collection.create({
      userId: user.userId,
      name: name.trim(),
      description: description?.trim() || "",
      isPublic: isPublic || false,
    });

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Failed to create collection" }, { status: 500 });
  }
}
