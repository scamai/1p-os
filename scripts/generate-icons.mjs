#!/usr/bin/env node
/**
 * Generate PWA icons for 1P OS.
 * Tries to use @napi-rs/canvas if available, otherwise creates minimal valid PNGs.
 */
import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

/**
 * Create a minimal valid 1x1 PNG and scale description.
 * Real icon generation requires a canvas library — this creates valid PNG placeholders.
 */
function createMinimalPng() {
  // Minimal valid PNG: 1x1 pixel, color #09090b
  // PNG signature + IHDR + IDAT + IEND
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, // 8-bit RGB
    0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
    0x08, 0xd7, 0x63, 0x60, 0x60, 0x60, 0x00, 0x00,
    0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27, 0x0a,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, // IEND chunk
    0xae, 0x42, 0x60, 0x82,
  ]);
}

async function generateWithCanvas(size) {
  try {
    const { createCanvas } = await import("@napi-rs/canvas");
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");

    // Background
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, size, size);

    // "1P" text
    ctx.fillStyle = "#34d399";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.floor(size * 0.4)}px sans-serif`;
    ctx.fillText("1P", size / 2, size / 2);

    return canvas.toBuffer("image/png");
  } catch {
    return null;
  }
}

async function main() {
  for (const size of [192, 512]) {
    const filename = `icon-${size}.png`;
    const filepath = join(publicDir, filename);

    const buffer = await generateWithCanvas(size);
    if (buffer) {
      writeFileSync(filepath, buffer);
      console.log(`Generated ${filename} (${size}x${size}) with canvas`);
    } else {
      writeFileSync(filepath, createMinimalPng());
      console.log(`Created ${filename} placeholder (canvas not available — replace with real icon)`);
    }
  }
}

main().catch(console.error);
