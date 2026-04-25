// app/admin/views/TestimonialsView.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { Trash2, Edit, Star } from 'lucide-react';
import Image from 'next/image';
import { api } from '../api';
import { AdminItem, Testimonial } from '../types';

interface TestimonialsViewProps {
  onEdit: (item: AdminItem) => void;
  onDelete: (id: string, name: string) => void;
  refreshTrigger: number;
}

export function TestimonialsView({ onEdit, onDelete, refreshTrigger }: TestimonialsViewProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, [refreshTrigger]);

  const loadTestimonials = async () => {
    try {
      setLoading(true);
      const data = await api.fetchData<Testimonial[]>('/testimonials');
      setTestimonials(data);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="bg-white rounded-lg shadow p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            {testimonial.image ? (
              <Image
                src={testimonial.image as string}
                alt={testimonial.name as string}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                {(testimonial.name as string)?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{testimonial.name as string}</p>
              {testimonial.location && (
                <p className="text-sm text-gray-500">{testimonial.location as string}</p>
              )}
            </div>
          </div>

          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= (testimonial.rating as number)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }
              />
            ))}
          </div>

          <p className="text-gray-700 text-sm flex-1 line-clamp-4">{testimonial.review as string}</p>

          <div className="flex gap-2 pt-2 border-t">
            <button
              onClick={() => onEdit(testimonial)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <Edit size={14} />
              Edit
            </button>
            <button
              onClick={() => onDelete(testimonial.id as string, testimonial.name as string)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      ))}

      {testimonials.length === 0 && (
        <div className="col-span-full text-center py-16 text-gray-500">
          No testimonials yet. Add your first one!
        </div>
      )}
    </div>
  );
}