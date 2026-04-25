import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
interface Video {
  id: string;
  title: string;
  videoUrl: string;
  views: number;
  duration: string;
}

interface VideoStore {
  videos: Video[];
}
const dataDir = join(process.cwd(), 'data');
const videosPath = join(dataDir, 'videos.json');

// Ensure data directory exists
async function ensureDataDir() {
  if (!existsSync(dataDir)) {
    await mkdir(dataDir, { recursive: true });
  }
  if (!existsSync(videosPath)) {
    await writeFile(videosPath, JSON.stringify({ videos: [] }, null, 2));
  }
}

async function readVideos() {
  await ensureDataDir();
  const content = await readFile(videosPath, 'utf-8');
  return JSON.parse(content);
}
async function writeVideos(data: VideoStore): Promise<void> {
  await ensureDataDir();
  await writeFile(videosPath, JSON.stringify(data, null, 2));
}


// GET - Read all videos
export async function GET() {
  try {
    const data = await readVideos();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading videos:', error);
    return NextResponse.json({ videos: [] }, { status: 500 });
  }
}

// POST - Create new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readVideos();
    
    const newVideo = {
      id: Date.now().toString(),
      title: body.title,
      videoUrl: body.videoUrl,
      views: body.views,
      duration: body.duration
    };

    data.videos.push(newVideo);
    await writeVideos(data);

    return NextResponse.json({ success: true, video: newVideo });
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

// PUT - Update existing video
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await readVideos();
    
    const index = data.videos.findIndex((v: Video) => v.id === body.id);
    if (index === -1) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    data.videos[index] = {
      ...data.videos[index],
      title: body.title,
      videoUrl: body.videoUrl,
      views: body.views,
      duration: body.duration
    };

    await writeVideos(data);
    return NextResponse.json({ success: true, video: data.videos[index] });
  } catch (error) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE - Remove video
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    const data = await readVideos();
    data.videos = data.videos.filter((v: Video) => v.id !== id);
    await writeVideos(data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
