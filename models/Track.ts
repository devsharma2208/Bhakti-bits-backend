import mongoose, { Schema, Document } from "mongoose";

export interface ITrack extends Document {
    id: string;
    title: string;
    artist: string;
    album: string;
    artworkUrl: string;
    audioUrl: string;
    durationMs: number;
    categoryId: string;
    tags: string[];
    transcript?: any[];
}

const TrackSchema: Schema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        artist: { type: String, required: true },
        album: { type: String, required: true },
        artworkUrl: { type: String, required: true },
        audioUrl: { type: String, required: true },
        durationMs: { type: Number, required: true },
        categoryId: { type: String, required: true },
        tags: [{ type: String }],
        transcript: { type: Array, default: [] },
    },
    { timestamps: true }
);

export default mongoose.model<ITrack>("Track", TrackSchema);
