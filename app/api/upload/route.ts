import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/server/utils/apiResponse';
import { Logger } from '@/server/utils/logger';
import { addCloudinaryOriginalFlag } from '@/server/utils/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return createErrorResponse(
        'Cloudinary credentials are not configured. Please define CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.',
        'CONFIG_MISSING',
        400
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });

    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return createErrorResponse('Invalid multipart form data', 'INVALID_FORM', 400);
    }

    const folder = (formData.get('folder') as string) || 'aapla_jalgaonwala';

    // Support both multiple 'files' entries and single 'file' entry
    const rawFiles = formData.getAll('files') as File[];
    const rawSingleFile = formData.get('file') as File | null;

    let filesToUpload: File[] = [];
    if (rawFiles && rawFiles.length > 0) {
      filesToUpload = rawFiles.filter((f) => f && f.size > 0);
    }
    if (filesToUpload.length === 0 && rawSingleFile && rawSingleFile.size > 0) {
      filesToUpload = [rawSingleFile];
    }

    if (filesToUpload.length === 0) {
      return createErrorResponse('No files provided for upload', 'NO_FILES', 400);
    }

    const { CloudinaryAssetRepository } = await import('@/server/repositories/CloudinaryAssetRepository');

    const uploadedResults: Array<{
      url: string;
      publicId: string;
      format: string;
      bytes: number;
      name: string;
    }> = [];

    for (const file of filesToUpload) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const originalFileName = file.name || 'uploaded_image';
      const lastDotIndex = originalFileName.lastIndexOf('.');
      const baseFileName = lastDotIndex !== -1 ? originalFileName.substring(0, lastDotIndex) : originalFileName;

      // Clean filename for Cloudinary public_id (preserves original name, spaces converted to underscores)
      const sanitizedBaseName = baseFileName
        .trim()
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-\.]/g, '')
        || `file_${Date.now()}`;

      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'auto',
            public_id: sanitizedBaseName,
            use_filename: true,
            unique_filename: false,
            overwrite: true,
            filename_override: originalFileName,
            display_name: baseFileName,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      const deliveryUrl = addCloudinaryOriginalFlag(uploadResult.secure_url || uploadResult.url);

      // Record asset tracking safely
      try {
        await CloudinaryAssetRepository.addAsset({
          url: deliveryUrl,
          publicId: uploadResult.public_id,
          name: originalFileName,
          bytes: uploadResult.bytes,
          format: uploadResult.format
        });
      } catch (e) {
        await Logger.warn('Could not save uploaded asset to repository tracker', {
          module: 'upload',
          metadata: { assetUrl: deliveryUrl, error: String(e) }
        });
      }

      uploadedResults.push({
        url: deliveryUrl,
        publicId: uploadResult.public_id,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        name: originalFileName
      });
    }

    const primaryResult = uploadedResults[0];
    const responseData = {
      count: uploadedResults.length,
      url: primaryResult.url,
      publicId: primaryResult.publicId,
      format: primaryResult.format,
      bytes: primaryResult.bytes,
      urls: uploadedResults.map(r => r.url),
      results: uploadedResults
    };

    return NextResponse.json({
      success: true,
      message: 'Files uploaded successfully',
      ...responseData,
      data: responseData
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, req, 'upload', 'POST');
  }
}

