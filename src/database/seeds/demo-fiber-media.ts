/**
 * Dummy fiber photos and AI responses for the demo seed. Photos are generated PNGs (no image library
 * needed): the fiber's colour in the core, the strand / tube colour as the outer ring, so a demo
 * AI response can be checked against its picture just like a real one.
 */
import { deflateSync } from 'zlib';

const WIDTH = 480;
const HEIGHT = 360;

const BASE_RGB: Record<string, [number, number, number]> = {
    Blue: [31, 95, 214],
    Orange: [242, 140, 40],
    Green: [46, 158, 68],
    Brown: [139, 90, 43],
    Slate: [112, 128, 144],
    White: [240, 240, 236],
    Red: [214, 40, 40],
    Black: [26, 26, 26],
    Yellow: [245, 217, 10],
    Violet: [138, 43, 226],
    Pink: [255, 143, 177],
    Aqua: [51, 209, 209],
    Olive: [128, 128, 0],
    Magenta: [214, 36, 159],
    Tan: [210, 180, 140],
    Lime: [155, 227, 59],
    Natural: [232, 220, 192],
};
const NEUTRAL: [number, number, number] = [150, 150, 150];

/** "Blue-Strip" -> base Blue with a stripe; "Blue-Olive" -> olive half; "Blue-Ring"/"Blue-DoubleRing" -> rings. */
function parseColour(name: string | null): { base: [number, number, number]; mark: string | null } {
    if (!name) return { base: NEUTRAL, mark: null };
    const [base, mark = null] = name.split('-');
    return { base: BASE_RGB[base] ?? NEUTRAL, mark };
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
});

function crc32(buf: Buffer): number {
    let c = 0xffffffff;
    for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
}

function encodePng(width: number, height: number, rgb: Buffer): Buffer {
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 2; // RGB
    const raw = Buffer.alloc((width * 3 + 1) * height);
    for (let y = 0; y < height; y++) {
        rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3);
    }
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
        chunk('IHDR', ihdr),
        chunk('IDAT', deflateSync(raw, { level: 9 })),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

/** Colour of a marked region at (x, y), r = distance from centre, band = [inner, outer] radius. */
function marked(c: ReturnType<typeof parseColour>, x: number, y: number, r: number, band: [number, number]) {
    const t = (r - band[0]) / (band[1] - band[0]);
    switch (c.mark) {
        case 'Strip':
            return Math.abs(x - y) % 60 < 14 ? BASE_RGB.Black : c.base;
        case 'Olive':
            return x > 0 ? BASE_RGB.Olive : c.base;
        case 'Ring':
            return Math.abs(t - 0.5) < 0.12 ? BASE_RGB.Black : c.base;
        case 'DoubleRing':
            return Math.abs(t - 0.3) < 0.08 || Math.abs(t - 0.7) < 0.08 ? BASE_RGB.Black : c.base;
        default:
            return c.base;
    }
}

/** A dummy "fiber end-face" photo: fiber colour in the core, the bundle colour as the outer ring. */
export function fiberPhotoPng(outerColour: string | null, fiberColour: string): Buffer {
    const outer = parseColour(outerColour);
    const fiber = parseColour(fiberColour);
    const rgb = Buffer.alloc(WIDTH * HEIGHT * 3);
    const cx = WIDTH / 2;
    const cy = HEIGHT / 2;
    for (let py = 0; py < HEIGHT; py++) {
        for (let px = 0; px < WIDTH; px++) {
            const x = px - cx;
            const y = py - cy;
            const r = Math.sqrt(x * x + y * y);
            let colour: [number, number, number];
            if (r < 62) colour = marked(fiber, x, y, r, [0, 62]);
            else if (r < 70) colour = [235, 235, 235]; // cladding edge
            else if (r < 118) colour = [205, 205, 200]; // coating
            else if (r < 168) colour = marked(outer, x, y, r, [118, 168]);
            else {
                const shade = Math.max(18, 58 - Math.round((r - 168) / 4)); // vignette
                colour = [shade, shade, shade + 4];
            }
            const i = (py * WIDTH + px) * 3;
            rgb[i] = colour[0];
            rgb[i + 1] = colour[1];
            rgb[i + 2] = colour[2];
        }
    }
    return encodePng(WIDTH, HEIGHT, rgb);
}

export type DemoLayout = 'IBR' | 'FLAT_RIBBON' | 'MULTI_TUBE';

/** Layout from the attribute names the fiber matrix generator writes. */
export function layoutOf(attribute1Name: string | null | undefined): DemoLayout {
    if (attribute1Name === 'Strand') return 'IBR';
    if (attribute1Name === 'Type') return 'MULTI_TUBE';
    return 'FLAT_RIBBON';
}

export interface DemoFiber {
    layout: DemoLayout;
    /** Strand colour (IBR), ribbon label (flat ribbon, e.g. "R3") or tube colour (multi tube). */
    group: string;
    /** Ribbon label within a strand (IBR only). */
    ribbon: string | null;
    fiber: string;
}

/** The fields the photo shows and the AI is asked about, read from a matrix row. */
export function demoFiber(row: {
    attribute1_name?: string | null;
    attribute1_value?: string | null;
    attribute2_value?: string | null;
    attribute3_value?: string | null;
}): DemoFiber {
    const layout = layoutOf(row.attribute1_name);
    if (layout === 'IBR') {
        return { layout, group: row.attribute1_value ?? '', ribbon: row.attribute2_value ?? null, fiber: row.attribute3_value ?? '' };
    }
    if (layout === 'MULTI_TUBE') {
        return { layout, group: row.attribute2_value ?? '', ribbon: null, fiber: row.attribute3_value ?? '' };
    }
    return { layout, group: row.attribute1_value ?? '', ribbon: null, fiber: row.attribute2_value ?? '' };
}

/** Photo for a fiber; flat ribbons have no coloured bundle, so their outer ring stays neutral. */
export function photoKey(f: DemoFiber): { key: string; outer: string | null; fiber: string } {
    const outer = f.layout === 'FLAT_RIBBON' ? null : f.group;
    return { key: `${f.layout}_${outer ?? 'none'}_${f.fiber}`.replace(/[^A-Za-z0-9_-]/g, ''), outer, fiber: f.fiber };
}

const label = (n: string | null) => Number((n ?? '').replace(/\D/g, '')) || 1;

/**
 * Same shape the AI server returns per cable type (see hfcl-testing-app ColorPrediction).
 * `misread` swaps the fiber colour for `wrongColour` with low confidence and a failed validation.
 */
export function demoAiResponse(
    f: DemoFiber,
    confidence: number,
    misread: { wrongColour: string } | null,
): Record<string, unknown> {
    const fiberColour = misread ? misread.wrongColour : f.fiber;
    const fiberConfidence = misread ? Math.min(confidence, 0.58) : confidence;
    const validation = misread
        ? { status: 'failed', error: `Fiber Color Violation: ${misread.wrongColour} is not in the allowed list` }
        : { status: 'success', error: '' };

    if (f.layout === 'IBR') {
        return {
            cableType: 'IBR',
            fiber: { color: fiberColour, confidence: fiberConfidence },
            strand: { color: f.group, confidence: Math.min(1, confidence + 0.02) },
            ribbon: { markings_score: label(f.ribbon), confidence: 0.97 },
            status: 'success',
            validation,
        };
    }
    if (f.layout === 'MULTI_TUBE') {
        return {
            cableType: 'MULTI_TUBE',
            fiber_color: { color: fiberColour, confidence: fiberConfidence },
            tube_color: { color: f.group, confidence: Math.min(1, confidence + 0.01) },
            fiber_markings: { pattern_id: 0, raw_detections: 0 },
            status: 'success',
            validation,
        };
    }
    return {
        cableType: 'FLAT_RIBBON',
        fiber: { color: fiberColour, confidence: fiberConfidence },
        ribbon: { markings: label(f.group), confidence: 0.96 },
        status: 'success',
        validation,
    };
}
