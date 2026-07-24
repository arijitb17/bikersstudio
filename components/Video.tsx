// components/RecommendedVideos.tsx
export const dynamic = 'force-dynamic'
import { readFile } from 'fs/promises';
import { join } from 'path';
import { Sparkles } from 'lucide-react';
import VideoCard from './VideoCard';

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  views: string;
  duration: string;
}

async function getVideos(): Promise<Video[]> {
  try {
    const filePath = join(process.cwd(), 'data', 'videos.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.videos || [];
  } catch (error) {
    console.error('Error loading videos:', error);
    return [];
  }
}

export default async function RecommendedVideos() {
  const videos = await getVideos();

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-white">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-14">
          <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold tracking-[0.3em] uppercase mb-3">
            <Sparkles size={14} className="fill-yellow-500" />
            Watch & Shop
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-black tracking-tight uppercase">
            Recommended For You
          </h2>
          <div className="mt-4 h-1.5 w-20 bg-gradient-to-r from-yellow-400 to-yellow-200 rounded-full skew-x-[-20deg]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}