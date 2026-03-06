import mongoose, { Schema, Document, Model } from "mongoose";

export interface IElement extends Document {
  _id: mongoose.Types.ObjectId;
  collectionId: mongoose.Types.ObjectId;
  imageUrl: string;
  imageFileId: string;
  thumbnailUrl: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ElementSchema = new Schema<IElement>(
  {
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: "Collection",
      required: true,
      index: true,
    },
    imageUrl: { type: String, required: true },
    imageFileId: { type: String, required: true },
    thumbnailUrl: { type: String, default: "" },
    description: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
  },
  { timestamps: true }
);

ElementSchema.index({ tags: 1 });

const Element: Model<IElement> =
  mongoose.models.Element || mongoose.model<IElement>("Element", ElementSchema);

export default Element;
