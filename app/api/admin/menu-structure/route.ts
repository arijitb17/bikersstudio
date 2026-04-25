// app/api/admin/menu-structure/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next'
import type { Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

const MENU_FILE_PATH = path.join(process.cwd(), 'data', 'menu-structure.json');

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Default menu structure
const DEFAULT_MENU_STRUCTURE = {
  motorcycleAccessories: {
    "Protection & Safety": [
      { name: "Crash Guards", slug: "crash-guards" },
      { name: "Engine Guards", slug: "engine-guards" },
      { name: "Frame Sliders", slug: "frame-sliders" },
      { name: "Tank Pads", slug: "tank-pads" },
      { name: "Radiator Guards", slug: "radiator-guards" },
      { name: "Chain Guards", slug: "chain-guards" },
      { name: "Skid Plates", slug: "skid-plates" },
    ],
    "Performance & Exhaust": [
      { name: "Exhaust Systems", slug: "exhaust-systems" },
      { name: "Slip-On Exhausts", slug: "slip-on-exhausts" },
      { name: "Air Filters", slug: "air-filters" },
      { name: "Performance Chips", slug: "performance-chips" },
      { name: "Fuel Controllers", slug: "fuel-controllers" },
      { name: "Spark Plugs", slug: "spark-plugs" },
    ],
    "Lighting": [
      { name: "LED Headlights", slug: "led-headlights" },
      { name: "Fog Lights", slug: "fog-lights" },
      { name: "Auxiliary Lights", slug: "auxiliary-lights" },
      { name: "Turn Signals", slug: "turn-signals" },
      { name: "Tail Lights", slug: "tail-lights" },
      { name: "Light Bars", slug: "light-bars" },
    ],
    "Luggage & Storage": [
      { name: "Top Boxes", slug: "top-boxes" },
      { name: "Side Boxes", slug: "side-boxes" },
      { name: "Tank Bags", slug: "tank-bags" },
      { name: "Tail Bags", slug: "tail-bags" },
      { name: "Saddle Bags", slug: "saddle-bags" },
      { name: "Panniers", slug: "panniers" },
      { name: "Backpacks", slug: "backpacks" },
    ],
  },
  ridingGears: {
    "Jackets": [
      { name: "Leather Jackets", slug: "leather-jackets" },
      { name: "Textile Jackets", slug: "textile-jackets" },
      { name: "Mesh Jackets", slug: "mesh-jackets" },
      { name: "Adventure Jackets", slug: "adventure-jackets" },
      { name: "Rain Jackets", slug: "rain-jackets" },
      { name: "Track Suits", slug: "track-suits" },
    ],
    "Gloves": [
      { name: "Summer Gloves", slug: "summer-gloves" },
      { name: "Winter Gloves", slug: "winter-gloves" },
      { name: "All-Season Gloves", slug: "all-season-gloves" },
      { name: "Racing Gloves", slug: "racing-gloves" },
    ],
  },
  helmetsAccessories: {
    "Full Face Helmets": [
      { name: "Racing Helmets", slug: "racing-helmets" },
      { name: "Touring Helmets", slug: "touring-helmets" },
      { name: "Sport Helmets", slug: "sport-helmets" },
    ],
    "Helmet Accessories": [
      { name: "Visors & Shields", slug: "visors-shields" },
      { name: "Pinlock Inserts", slug: "pinlock-inserts" },
      { name: "Helmet Locks", slug: "helmet-locks" },
    ],
  },
  maintenanceCare: {
    "Cleaning Products": [
      { name: "Bike Shampoo", slug: "bike-shampoo" },
      { name: "Chain Cleaners", slug: "chain-cleaners" },
      { name: "Polish & Wax", slug: "polish-wax" },
    ],
    "Tools & Equipment": [
      { name: "Tool Kits", slug: "tool-kits" },
      { name: "Torque Wrenches", slug: "torque-wrenches" },
    ],
  },
  tiresWheels: {
    "Motorcycle Tires": [
      { name: "Sport Tires", slug: "sport-tires" },
      { name: "Touring Tires", slug: "touring-tires" },
      { name: "Cruiser Tires", slug: "cruiser-tires" },
    ],
    "Wheels & Rims": [
      { name: "Alloy Wheels", slug: "alloy-wheels" },
      { name: "Spoke Wheels", slug: "spoke-wheels" },
    ],
  },
};

// GET - Fetch menu structure
export async function GET() {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    await ensureDataDirectory();

    // Try to read existing file, or use default
    let menuStructure;
    try {
      const fileContent = await fs.readFile(MENU_FILE_PATH, 'utf-8');
      menuStructure = JSON.parse(fileContent);
    } catch {
      // File doesn't exist, use default
      menuStructure = DEFAULT_MENU_STRUCTURE;
      // Save default to file
      await fs.writeFile(
        MENU_FILE_PATH,
        JSON.stringify(DEFAULT_MENU_STRUCTURE, null, 2),
        'utf-8'
      );
    }

    return NextResponse.json({ menuStructure });
  } catch (error) {
    console.error('Error fetching menu structure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu structure' },
      { status: 500 }
    );
  }
}

// PUT - Update menu structure
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as Session | null;

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { menuStructure } = await request.json();

    if (!menuStructure) {
      return NextResponse.json(
        { error: 'Menu structure is required' },
        { status: 400 }
      );
    }

    await ensureDataDirectory();

    // Save to file
    await fs.writeFile(
      MENU_FILE_PATH,
      JSON.stringify(menuStructure, null, 2),
      'utf-8'
    );

    // ✨ REVALIDATE THE PUBLIC API AND ALL PAGES
    // This makes changes appear immediately instead of waiting for cache
    try {
      revalidatePath('/api/menu-structure', 'page');
      revalidatePath('/', 'layout'); // Revalidate all pages that use the navbar
    } catch (revalidateError) {
      console.error('Revalidation error:', revalidateError);
      // Continue anyway - file is saved
    }

    return NextResponse.json({
      success: true,
      message: 'Menu structure updated successfully',
    });
  } catch (error) {
    console.error('Error updating menu structure:', error);
    return NextResponse.json(
      { error: 'Failed to update menu structure' },
      { status: 500 }
    );
  }
}
