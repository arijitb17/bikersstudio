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
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const testimonials = await readTestimonials();
    const index = testimonials.findIndex((t: Testimonial) => t.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    
    testimonials[index] = {
      id,
      name: body.name,
      review: body.review,
      rating: body.rating,
      location: body.location || '',
      image: body.image || ''
    };
    
    await writeTestimonials(testimonials);
    return NextResponse.json(testimonials[index]);
  } catch (error:unknown) {
    console.error('PUT testimonials error:', error);
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const testimonials = await readTestimonials();
    const index = testimonials.findIndex((t: Testimonial) => t.id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    
    const deletedTestimonial = testimonials[index];
    testimonials.splice(index, 1);
    await writeTestimonials(testimonials);

    return NextResponse.json({ 
      message: 'Testimonial deleted successfully',
      deleted: deletedTestimonial
    });
  } catch (error:unknown) {
    console.error('DELETE testimonials error:', error);
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}