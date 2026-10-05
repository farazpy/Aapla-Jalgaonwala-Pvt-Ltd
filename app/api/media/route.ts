import { NextRequest } from 'next/server';
import { MediaRepository } from '@/server/repositories/MediaRepository';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';

    const gallery = await MediaRepository.getGallery();
    const videos = await MediaRepository.getVideos();

    if (type === 'gallery') {
      return createSuccessResponse(gallery);
    }
    if (type === 'videos') {
      return createSuccessResponse(videos);
    }

    return createSuccessResponse({
      gallery,
      videos
    });
  } catch (error) {
    return handleApiError(error, req, 'media', 'GET');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return createErrorResponse('Invalid media payload', 'INVALID_PAYLOAD', 400);
    }

    const mediaType = body.mediaType || 'gallery';

    if (mediaType === 'video') {
      if (!body.title || !body.videoUrl) {
        return createErrorResponse('Title and Video URL are required', 'INVALID_VIDEO', 400);
      }
      const newVideo = await MediaRepository.addVideo({
        title: String(body.title).trim(),
        duration: body.duration || '02:00',
        thumbnail: body.thumbnail || body.imgUrl || 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=1000&q=80',
        videoUrl: String(body.videoUrl).trim(),
        description: body.description || body.caption || '',
        category: body.category || 'Brand Story',
        speaker: body.speaker || 'Founders'
      });
      return createSuccessResponse(newVideo, 'Video added successfully', 201);
    } else {
      if (!body.title || !body.imgUrl) {
        return createErrorResponse('Title and Image URL are required', 'INVALID_GALLERY_ITEM', 400);
      }
      const newItem = await MediaRepository.addGalleryItem({
        title: String(body.title).trim(),
        category: body.category || 'farmgate',
        categoryLabel: body.categoryLabel || 'Gallery',
        imgUrl: String(body.imgUrl).trim(),
        caption: body.caption || '',
        date: body.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        location: body.location || 'Jalgaon'
      });
      return createSuccessResponse(newItem, 'Gallery item added successfully', 201);
    }
  } catch (error) {
    return handleApiError(error, req, 'media', 'POST');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return createErrorResponse('Media ID is required', 'INVALID_ID', 400);
    }
    const id = String(body.id);
    const isVideo = Boolean(
      body.mediaType === 'video' ||
      body.type === 'video' ||
      body.videoUrl ||
      body.duration ||
      body.speaker
    );

    let updated = isVideo
      ? await MediaRepository.updateVideo(id, body)
      : await MediaRepository.updateGalleryItem(id, body);

    if (!updated) {
      updated = isVideo
        ? await MediaRepository.updateGalleryItem(id, body)
        : await MediaRepository.updateVideo(id, body);
    }

    if (!updated) {
      return createErrorResponse('Media item not found', 'NOT_FOUND', 404);
    }
    return createSuccessResponse(updated, 'Media updated successfully');
  } catch (error) {
    return handleApiError(error, req, 'media', 'PUT');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const mediaType = searchParams.get('type') || 'gallery';

    if (!id) {
      return createErrorResponse('Media ID is required', 'INVALID_ID', 400);
    }

    let success = false;
    if (mediaType === 'video') {
      success = await MediaRepository.deleteVideo(id);
      if (!success) success = await MediaRepository.delete(id);
    } else {
      success = await MediaRepository.deleteGalleryItem(id);
      if (!success) success = await MediaRepository.delete(id);
    }

    if (!success) {
      return createErrorResponse('Media item not found or already deleted', 'NOT_FOUND', 404);
    }

    return createSuccessResponse({ id, deleted: true }, 'Media deleted successfully');
  } catch (error) {
    return handleApiError(error, req, 'media', 'DELETE');
  }
}

