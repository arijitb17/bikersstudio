"use client";

import React, { useState, useEffect } from 'react';

interface Video {
  id: string;
  title: string;
  videoUrl: string;
  views: string;
  duration: string;
}

type VideoFormData = Omit<Video, 'id'>;

interface VideoModalFormProps {
  video: Video | null;
  onSave: (data: VideoFormData) => void;
  loading: boolean;
}

export function VideoModalForm({ video, onSave, loading }: VideoModalFormProps) {
  const [formData, setFormData] = useState<VideoFormData>({
    title: '',
    videoUrl: '',
    views: '',
    duration: ''
  });

  useEffect(() => {
    if (video) {
      setFormData({
        title: video.title,
        videoUrl: video.videoUrl,
        views: video.views,
        duration: video.duration
      });
    }
  }, [video]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title *
        </label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="HOW TO WHEELIE A BIG CC BIKE"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video URL *
        </label>
        <input
          type="url"
          required
          value={formData.videoUrl}
          onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="https://example.com/video.mp4"
        />
        <p className="mt-1 text-xs text-gray-500">
          Direct video URL (.mp4, .webm) or YouTube/Vimeo embed URL
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Views *
          </label>
          <input
            type="text"
            required
            value={formData.views}
            onChange={(e) => setFormData({ ...formData, views: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="125K"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration *
          </label>
          <input
            type="text"
            required
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0:58"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : video ? 'Update Video' : 'Add Video'}
        </button>
      </div>
    </form>
  );
}