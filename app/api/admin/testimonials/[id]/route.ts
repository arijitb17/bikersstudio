// app/api/admin/testimonials/[id]/route.ts
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

// PUT update testimonial
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await context.params;
    const body = await request.json();
    const testimonials = await readTestimonials();
    
    console.log('PUT - Looking for ID:', id);
    console.log('Available testimonials:', testimonials.map((t: Testimonial) => ({ id: t.id, name: t.name })));
    
    const index = testimonials.findIndex((t: Testimonial) => t.id === id);
    
    if (index === -1) {
      console.log('Testimonial not found with ID:', id);
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }
    
    testimonials[index] = {
      id: id, // Keep original ID
      name: body.name,
      review: body.review,
      rating: body.rating,
      location: body.location || '',
      image: body.image || ''
    };
    
    await writeTestimonials(testimonials);
    
    console.log('Updated testimonial:', testimonials[index]);
    return NextResponse.json(testimonials[index]);
  } catch (error) {
    console.error('PUT testimonials error:', error);
    return NextResponse.json(
      { error: 'Failed to update testimonial' },
      { status: 500 }
    );
  }
}

// DELETE testimonial
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Await params in Next.js 15+
    const { id } = await context.params;
    const testimonials = await readTestimonials();
    
    console.log('DELETE - Looking for ID:', id);
    console.log('Available testimonials:', testimonials.map((t: Testimonial) => ({ id: t.id, name: t.name })));
    
   const index = testimonials.findIndex((t: Testimonial) => t.id === id);
    
    if (index === -1) {
      console.log('Testimonial not found with ID:', id);
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }
    
    const deletedTestimonial = testimonials[index];
    testimonials.splice(index, 1);
    await writeTestimonials(testimonials);
    
    console.log('Deleted testimonial:', deletedTestimonial);
    return NextResponse.json({ 
      message: 'Testimonial deleted successfully',
      deleted: deletedTestimonial
    });
  } catch (error) {
    console.error('DELETE testimonials error:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}