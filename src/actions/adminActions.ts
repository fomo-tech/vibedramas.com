"use server";

import connectDB from "@/lib/db";
import Drama from "@/models/Drama";
import Episode from "@/models/Episode";
import { deleteCacheByPattern } from "@/lib/cache";
import { revalidatePath } from "next/cache";

/**
 * Delete a drama and its associated episodes
 */
export async function deleteDramaAction(id: string) {
  try {
    await connectDB();

    // Find drama to get slug for cache invalidation
    const drama = await Drama.findById(id);
    if (!drama) return { success: false, error: "Drama not found" };

    // Delete episodes and drama
    await Promise.all([
      Episode.deleteMany({ dramaId: id }),
      Drama.findByIdAndDelete(id),
    ]);

    // Invalidate caches
    await deleteCacheByPattern("admin:*");

    // Revalidate the pages
    revalidatePath("/admin");
    revalidatePath("/admin/dramas");

    return { success: true };
  } catch (error: any) {
    console.error("Delete Drama Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update drama metadata
 */
export async function updateDramaAction(id: string, data: any) {
  try {
    await connectDB();

    const updatedDrama = await Drama.findByIdAndUpdate(id, data, {
      returnDocument: "after",
    });
    if (!updatedDrama) return { success: false, error: "Drama not found" };

    // Invalidate caches
    await deleteCacheByPattern("admin:*");

    revalidatePath("/admin/dramas");

    return { success: true, data: JSON.parse(JSON.stringify(updatedDrama)) };
  } catch (error: any) {
    console.error("Update Drama Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Create a new drama
 */
export async function createDramaAction(data: any) {
  try {
    await connectDB();

    // Generate slug from name if not provided
    if (!data.slug && data.name) {
      data.slug = data.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }

    const drama = await Drama.create(data);
    await deleteCacheByPattern("admin:*");
    revalidatePath("/admin/dramas");

    return { success: true, data: JSON.parse(JSON.stringify(drama)) };
  } catch (error: any) {
    console.error("Create Drama Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get episodes for a drama
 */
export async function getEpisodesAction(dramaId: string) {
  try {
    await connectDB();
    const episodes = await Episode.find({ dramaId }).sort({ name: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(episodes)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Create a new episode
 */
export async function createEpisodeAction(dramaId: string, data: any) {
  try {
    await connectDB();
    const episode = await Episode.create({ dramaId, ...data });
    await deleteCacheByPattern("admin:*");
    revalidatePath("/admin/dramas");
    return { success: true, data: JSON.parse(JSON.stringify(episode)) };
  } catch (error: any) {
    console.error("Create Episode Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Update an episode
 */
export async function updateEpisodeAction(episodeId: string, data: any) {
  try {
    await connectDB();
    const episode = await Episode.findByIdAndUpdate(episodeId, data, {
      returnDocument: "after",
    });
    if (!episode) return { success: false, error: "Episode not found" };
    await deleteCacheByPattern("admin:*");
    revalidatePath("/admin/dramas");
    return { success: true, data: JSON.parse(JSON.stringify(episode)) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete an episode
 */
export async function deleteEpisodeAction(episodeId: string) {
  try {
    await connectDB();
    await Episode.findByIdAndDelete(episodeId);
    await deleteCacheByPattern("admin:*");
    revalidatePath("/admin/dramas");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
