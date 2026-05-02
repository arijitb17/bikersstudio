// components/RecommendedVideos.tsx
export const dynamic = 'force-dynamic'
import { readFile } from 'fs/promises';
import { join } from 'path';
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
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="w-full px-6 lg:px-16 xl:px-24">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-12 drop-shadow-md text-center">
          Recommended For You
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </section>
  );
}
