// app/api/menu-structure/route.ts

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

// Default menu structure (same as admin route)
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

// GET - Public endpoint to fetch menu structure (no authentication required)
export async function GET() {
  try {
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
      try {
        await fs.writeFile(
          MENU_FILE_PATH,
          JSON.stringify(DEFAULT_MENU_STRUCTURE, null, 2),
          'utf-8'
        );
      } catch (writeError) {
        console.error('Could not write default menu structure:', writeError);
        // Continue anyway with default structure
      }
    }

    return NextResponse.json(
      { menuStructure },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching menu structure:', error);
    // Return default structure even on error
    return NextResponse.json(
      { menuStructure: DEFAULT_MENU_STRUCTURE },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60',
        },
      }
    );
  }
}
