import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICollection extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  elementCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CollectionSchema = new Schema<ICollection>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    elementCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Collection: Model<ICollection> =
  mongoose.models.Collection || mongoose.model<ICollection>("Collection", CollectionSchema);

export default Collection;
