"use client";

import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Share2, Heart, ShoppingCart } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  views: string;
  duration: string;
  slug?: string;
}

interface VideoCardProps {
  video: Video;
}

function convertToEmbedUrl(url: string): string {
  // YouTube Shorts
  if (url.includes('youtube.com/shorts/')) {
    const videoId = url.split('shorts/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
  }
  // Regular YouTube
  if (url.includes('youtube.com/watch?v=')) {
    const videoId = url.split('v=')[1]?.split('&')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
  }
  // YouTube short link
  if (url.includes('youtu.be/')) {
    const videoId = url.split('youtu.be/')[1]?.split('?')[0];
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0`;
  }
  // Vimeo
  if (url.includes('vimeo.com/')) {
    const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&controls=0`;
  }
  return url;
}

function isYouTubeOrVimeo(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

export default function VideoCard({ video }: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isEmbed = isYouTubeOrVimeo(video.videoUrl);
  const embedUrl = isEmbed ? convertToEmbedUrl(video.videoUrl) : video.videoUrl;

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: video.videoUrl,
      });
    } else {
      navigator.clipboard.writeText(video.videoUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleShopNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.slug) {
      window.location.href = `/categories/${video.slug}`;
    }
  };

  return (
    <div
      className="group relative bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 ease-out hover:-translate-y-3 shadow-xl hover:shadow-2xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Video Player - Vertical Rectangle Format */}
      <div className="relative bg-black aspect-[9/16]">
        {isEmbed ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        )}

        {/* Gradient Overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-70'}`} />

        {/* Top Info Bar - Shows on hover */}
        <div className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-start transition-all duration-300 z-20 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {/* Views Badge */}
          <div className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            {video.views}
          </div>
          
          {/* Duration Badge */}
          <div className="bg-black/90 text-white px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg">
            {video.duration}
          </div>
        </div>

        {/* Center Play/Pause Button - Shows on hover for direct videos */}
        {!isEmbed && (
          <div className={`absolute inset-0 flex items-center justify-center z-20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={togglePlayPause}
              className="w-16 h-16 rounded-full bg-white/95 flex items-center justify-center transform transition-all duration-300 hover:scale-110 hover:bg-white shadow-2xl"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 text-black" fill="currentColor" />
              ) : (
                <Play className="w-7 h-7 text-black ml-1" fill="currentColor" />
              )}
            </button>
          </div>
        )}

        {/* Bottom Section - Title and Controls */}
        <div className={`absolute bottom-0 left-0 right-0 p-5 transition-all duration-300 z-10 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Video Title */}
          <h3 className="text-white font-bold text-base mb-4 line-clamp-2 leading-tight drop-shadow-lg">
            {video.title}
          </h3>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            {/* Mute/Unmute Button - Only for direct videos */}
            {!isEmbed && (
              <button
                onClick={toggleMute}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:bg-white/30 hover:scale-110 shadow-lg"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="w-5 h-5 text-white" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
            )}
            
            {/* Like Button */}
            <button
              onClick={toggleLike}
              className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg ${
                isLiked ? 'bg-red-600' : 'bg-white/20 hover:bg-white/30'
              }`}
              title="Like"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'text-white fill-white' : 'text-white'}`} />
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-200 hover:bg-white/30 hover:scale-110 shadow-lg"
              title="Share"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>

            {/* Shop Now Button */}
            <button 
              onClick={handleShopNow}
              className="ml-auto px-4 py-2 rounded-full bg-red-600 text-white font-bold text-sm transition-all duration-200 hover:bg-red-700 hover:scale-105 shadow-lg flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Shop Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
