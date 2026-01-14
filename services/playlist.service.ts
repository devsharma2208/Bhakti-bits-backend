import Category, { ICategory } from "../models/Category.js";
import Track, { ITrack } from "../models/Track.js";
import crypto from "crypto";

class PlaylistService {
    private cachedEtag: string | null = null;

    private updateEtag(data: string) {
        this.cachedEtag = `"${crypto.createHash("md5").update(data).digest("hex")}"`;
    }

    async getPlaylist() {
        const categories = await Category.find();
        const tracks = await Track.find();
        const data = {
            version: 1,
            updatedAt: new Date().toISOString(),
            categories,
            tracks,
        };
        const dataString = JSON.stringify(data);
        this.updateEtag(dataString);
        return {
            body: data,
            etag: this.cachedEtag,
        };
    }

    async getCategory(categoryId: string) {
        return await Category.findOne({ id: categoryId });
    }

    async getTracksByCategory(categoryId: string) {
        return await Track.find({ categoryId });
    }

    async getCategories(page: number = 1, limit: number = 10, search?: string) {
        const query: any = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Category.countDocuments(query);
        const categories = await Category.find(query)
            .skip((page - 1) * limit)
            .limit(limit);

        return {
            categories,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getTracks(page: number = 1, limit: number = 10, categoryId?: string, search?: string) {
        const query: any = {};
        if (categoryId && categoryId !== "all") {
            query.categoryId = categoryId;
        }
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { artist: { $regex: search, $options: "i" } },
                { album: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Track.countDocuments(query);
        const tracks = await Track.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return {
            tracks,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async addTrack(trackData: any) {
        const track = new Track(trackData);
        await track.save();
        return track;
    }

    async addCategory(categoryData: any) {
        const category = new Category(categoryData);
        await category.save();
        return category;
    }

    async updateTrack(trackId: string, updates: any) {
        const track = await Track.findOneAndUpdate({ id: trackId }, updates, {
            new: true,
        });
        if (!track) throw new Error("Track not found");
        return track;
    }

    async updateCategory(categoryId: string, updates: any) {
        const category = await Category.findOneAndUpdate(
            { id: categoryId },
            updates,
            { new: true }
        );
        if (!category) throw new Error("Category not found");
        return category;
    }

    async deleteTrack(trackId: string) {
        await Track.findOneAndDelete({ id: trackId });
    }

    async deleteCategory(categoryId: string) {
        await Category.findOneAndDelete({ id: categoryId });
        await Track.deleteMany({ categoryId });
    }

    async getStats() {
        const totalTracks = await Track.countDocuments();
        const totalCategories = await Category.countDocuments();
        const tracks = await Track.find();
        const totalDurationMs = tracks.reduce(
            (acc: number, t: any) => acc + (t.durationMs || 0),
            0
        );

        const recentTracks = await Track.find()
            .sort({ updatedAt: -1 })
            .limit(5);

        return {
            totalTracks,
            totalCategories,
            totalDurationMinutes: Math.floor(totalDurationMs / 60000),
            recentTracks,
            lastUpdate: new Date().toISOString(),
        };
    }
}

export default new PlaylistService();
