"use client";

// app/admin/views/VideosView.tsx

import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Play } from 'lucide-react';
import type { Video } from '../types';

interface VideosViewProps {
  onEdit: (video: Video) => void;
  onDelete: (id: string, title: string) => void;
  refreshTrigger: number;
}

export function VideosView({ onEdit, onDelete, refreshTrigger }: VideosViewProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, [refreshTrigger]);

  const loadVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/videos');
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Failed to load videos:', error);
      alert('Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Views
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Video URL
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {videos.map((video) => (
              <tr key={video.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center w-16 h-16 bg-black rounded">
                    <Play className="text-white" size={24} />
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{video.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{video.views ?? '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{video.duration ?? '—'}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-blue-600 hover:underline max-w-xs truncate">
                    <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                      {video.videoUrl}
                    </a>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(video)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(video.id, video.title)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Play className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No videos</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by adding a new video.</p>
        </div>
      )}
    </div>
  );
}