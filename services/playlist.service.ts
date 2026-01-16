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

    async getTrack(trackId: string) {
        // Try both MongoDB _id and string id field for backward compatibility
        let track = await Track.findById(trackId);
        if (!track) {
            track = await Track.findOne({ id: trackId });
        }
        return track;
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
        // Track uses string 'id' field like Category
        // Try both MongoDB _id and string id field for backward compatibility
        let track = await Track.findByIdAndUpdate(trackId, updates, {
            new: true,
        });
        
        // If not found by _id, try by string id field
        if (!track) {
            track = await Track.findOneAndUpdate(
                { id: trackId },
                updates,
                { new: true }
            );
        }
        
        if (!track) throw new Error("Track not found");
        return track;
    }

    async updateCategory(categoryId: string, updates: any) {
        // Category still uses 'id' string field
        const category = await Category.findOneAndUpdate(
            { id: categoryId },
            updates,
            { new: true }
        );
        if (!category) throw new Error("Category not found");
        return category;
    }

    async deleteTrack(trackId: string) {
        // Track uses string 'id' field like Category
        // Try both MongoDB _id and string id field for backward compatibility
        let result = await Track.findByIdAndDelete(trackId);
        
        // If not found by _id, try by string id field
        if (!result) {
            result = await Track.findOneAndDelete({ id: trackId });
        }
        
        if (!result) throw new Error("Track not found");
    }

    async deleteCategory(categoryId: string) {
        await Category.findOneAndDelete({ id: categoryId });
        // Also delete tracks associated with this category
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
