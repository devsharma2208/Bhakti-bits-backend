import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    id: string;
    name: string;
    description: string;
    artworkUrl: string;
    trackCount: number;
}

const CategorySchema: Schema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        description: { type: String, required: true },
        artworkUrl: { type: String, required: true },
        trackCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model<ICategory>("Category", CategorySchema);
