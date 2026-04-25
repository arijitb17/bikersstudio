// components/TestimonialsServer.tsx
export const dynamic = 'force-dynamic'
import { readFile } from 'fs/promises';
import { join } from 'path';
import CustomerTestimonials from './Testimonials';
interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
  image?: string;
  location?: string;
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const filePath = join(process.cwd(), 'data', 'testimonials.json');
    const fileContent = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return data.testimonials || [];
  } catch (error) {
    console.error('Error loading testimonials:', error);
    return [];
  }
}

export default async function TestimonialsServer() {
  const testimonials = await getTestimonials();
  
  return <CustomerTestimonials testimonials={testimonials} />;
}
