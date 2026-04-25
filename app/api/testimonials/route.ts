// app/api/testimonials/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  location: string;
  image: string;
}
const TESTIMONIALS_FILE = join(process.cwd(), 'data', 'testimonials.json');

async function readTestimonials() {
  try {
    const fileContent = await readFile(TESTIMONIALS_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.testimonials || [];
  } catch (error) {
    console.error('Error reading testimonials:', error);
    return [];
  }
}

async function writeTestimonials(testimonials: Testimonial[]): Promise<void> {
  const data = { testimonials };
  await writeFile(TESTIMONIALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// GET all testimonials
export async function GET() {
  try {
    const testimonials = await readTestimonials();
    return NextResponse.json(testimonials);
  } catch (error:unknown) {
    console.error('GET testimonials error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// POST create new testimonial
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const testimonials = await readTestimonials();
    
    // Generate new ID
   const maxId = testimonials.reduce((max: number, t: Testimonial) => {
  const id = parseInt(t.id);
  return id > max ? id : max;
}, 0);
    
    const newTestimonial = {
      id: String(maxId + 1),
      name: body.name,
      review: body.review,
      rating: body.rating,
      location: body.location || '',
      image: body.image || ''
    };
    
    testimonials.push(newTestimonial);
    await writeTestimonials(testimonials);
    
    console.log('Created testimonial:', newTestimonial);
    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error:unknown) {
    console.error('POST testimonials error:', error);
    return NextResponse.json(
      { error: 'Failed to create testimonial' },
      { status: 500 }
    );
  }
}
