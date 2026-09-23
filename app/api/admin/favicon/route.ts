import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { 
  FaviconSettings, 
  MasterIcon, 
  generateFaviconFiles, 
  generateFaviconHtml, 
  IconTransformationType 
} from '@realfavicongenerator/generate-favicon';
import { getNodeImageAdapter, loadAndConvertToSvg } from "@realfavicongenerator/image-adapter-node";

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, storeName, themeColor } = await req.json();

    if (!imageUrl) {
      return NextResponse.json({ success: false, error: 'No image URL provided' }, { status: 400 });
    }

    // 1. Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageUrl}`);
    }
    const buffer = Buffer.from(await response.arrayBuffer());

    // 2. Write to a temp file in a safe writable directory
    const tempDir = '/tmp';
    await fs.mkdir(tempDir, { recursive: true });

    // Determine correct file extension
    const ext = imageUrl.toLowerCase().includes('.svg') ? '.svg' : '.png';
    const tempFilePath = path.join(tempDir, `favicon_master_${Date.now()}${ext}`);
    await fs.writeFile(tempFilePath, buffer);

    // 3. Initialize the RealFaviconGenerator adapter & load MasterIcon
    const imageAdapter = await getNodeImageAdapter();
    const masterIcon: MasterIcon = {
      icon: await loadAndConvertToSvg(tempFilePath),
    };

    // 4. Configure Favicon Design settings using the library initializer
    const shortName = (storeName || 'Store').substring(0, 12);
    const resolvedThemeColor = themeColor || '#9B111E'; // Default Aapla Jalgaonwala crimson

    const faviconSettings: FaviconSettings = {
      icon: {
        desktop: {
          regularIconTransformation: {
            type: IconTransformationType.None,
            backgroundColor: '#ffffff',
            backgroundRadius: 0.7,
            imageScale: 0.7,
            brightness: 1,
          },
          darkIconType: "none",
          darkIconTransformation: {
            type: IconTransformationType.None,
            backgroundColor: '#ffffff',
            backgroundRadius: 0.7,
            imageScale: 0.7,
            brightness: 1,
          },
        },
        touch: {
          transformation: {
            type: IconTransformationType.None,
            backgroundColor: '#ffffff',
            backgroundRadius: 0,
            imageScale: 0.7,
            brightness: 1,
          },
          appTitle: storeName || 'Aapla Jalgaonwala',
        },
        webAppManifest: {
          transformation: {
            type: IconTransformationType.None,
            backgroundColor: '#ffffff',
            backgroundRadius: 0,
            imageScale: 0.7,
            brightness: 1,
          },
          backgroundColor: '#ffffff',
          themeColor: resolvedThemeColor,
          name: storeName || 'Aapla Jalgaonwala',
          shortName: shortName,
        }
      },
      path: "/",
      skipMetadataInjection: false,
    };

    // 5. Generate files and HTML
    const files = await generateFaviconFiles(masterIcon, faviconSettings, imageAdapter);
    const faviconMarkups = generateFaviconHtml(faviconSettings);
    const htmlMarkup = Array.isArray(faviconMarkups?.markups) 
      ? faviconMarkups.markups.join('\n') 
      : String(faviconMarkups || '');

    // 6. Write all generated files to Next.js public directory
    const publicDir = path.join(process.cwd(), 'public');
    await fs.mkdir(publicDir, { recursive: true });

    const savedFiles: string[] = [];
    for (const [fileName, fileContent] of Object.entries(files)) {
      if (fileName && fileContent) {
        const destPath = path.join(publicDir, fileName);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        
        if (typeof fileContent === 'string') {
          await fs.writeFile(destPath, fileContent, 'utf8');
        } else if (Buffer.isBuffer(fileContent)) {
          await fs.writeFile(destPath, fileContent);
        } else if (fileContent instanceof Blob) {
          const arrayBuffer = await fileContent.arrayBuffer();
          await fs.writeFile(destPath, Buffer.from(arrayBuffer));
        } else {
          await fs.writeFile(destPath, fileContent as any);
        }
        savedFiles.push(fileName);
      }
    }

    // Clean up temp file
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Silently ignore temp cleanup errors
    }

    return NextResponse.json({
      success: true,
      message: 'Favicons generated successfully',
      htmlMarkup,
      files: savedFiles,
      faviconUrl: '/favicon.ico'
    });

  } catch (error: any) {
    console.error('Error generating favicon:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Error occurred during favicon generation' 
    }, { status: 500 });
  }
}
