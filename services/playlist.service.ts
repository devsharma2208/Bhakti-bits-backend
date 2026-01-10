import fs from "fs";
import { promises as fsp } from "fs";
import crypto from "crypto";
import { PLAYLIST_PATH } from "../config/env.js";

class PlaylistService {
    private cachedData: any = null;
    private cachedEtag: string | null = null;

    constructor() {
        this.load();
        this.watch();
    }

    private async load() {
        const file = await fsp.readFile(PLAYLIST_PATH, "utf8");
        this.cachedData = JSON.parse(file);
        this.updateEtag(file);
    }

    private async save() {
        const data = JSON.stringify(this.cachedData, null, 2);
        await fsp.writeFile(PLAYLIST_PATH, data, "utf8");
        this.updateEtag(data);
    }

    private updateEtag(data: string) {
        this.cachedEtag = `"${crypto.createHash("md5").update(data).digest("hex")}"`;
    }

    private watch() {
        fs.watch(PLAYLIST_PATH, () => this.load());
    }

    getPlaylist() {
        return {
            body: this.cachedData,
            etag: this.cachedEtag,
        };
    }

    getCategory(categoryId: string) {
        return this.cachedData.categories.find((c: any) => c.id === categoryId);
    }

    getTracksByCategory(categoryId: string) {
        return this.cachedData.tracks.filter(
            (t: any) => t.categoryId === categoryId
        );
    }

    async addTrack(track: any) {
        this.cachedData.tracks.push(track);
        await this.save();
        return track;
    }

    async addCategory(category: any) {
        this.cachedData.categories.push(category);
        await this.save();
        return category;
    }

    async updateTrack(trackId: string, updates: any) {
        const index = this.cachedData.tracks.findIndex(
            (t: any) => t.id === trackId
        );
        if (index === -1) throw new Error("Track not found");

        this.cachedData.tracks[index] = {
            ...this.cachedData.tracks[index],
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        await this.save();
        return this.cachedData.tracks[index];
    }

    async updateCategory(categoryId: string, updates: any) {
        const index = this.cachedData.categories.findIndex(
            (c: any) => c.id === categoryId
        );
        if (index === -1) throw new Error("Category not found");

        this.cachedData.categories[index] = {
            ...this.cachedData.categories[index],
            ...updates,
        };

        await this.save();
        return this.cachedData.categories[index];
    }

    async deleteTrack(trackId: string) {
        this.cachedData.tracks = this.cachedData.tracks.filter(
            (t: any) => t.id !== trackId
        );
        await this.save();
    }

    async deleteCategory(categoryId: string) {
        this.cachedData.categories = this.cachedData.categories.filter(
            (c: any) => c.id !== categoryId
        );

        this.cachedData.tracks = this.cachedData.tracks.filter(
            (t: any) => t.categoryId !== categoryId
        );

        await this.save();
    }
}

export default new PlaylistService();
