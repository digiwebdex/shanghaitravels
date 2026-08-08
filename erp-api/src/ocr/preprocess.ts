/**
 * Passport image preprocessing (sharp) — no schema impact.
 * - EXIF / content auto-orient
 * - Border trim (page-ish crop)
 * - Optional deskew via projection profile
 * - Contrast stretch + mild sharpen
 * - MRZ-band crop helper for second-pass OCR
 */
import sharp from "sharp";

export type PreprocessMeta = {
  rotatedDeg: number;
  deskewDeg: number;
  trimmed: boolean;
  contrastBoosted: boolean;
  width: number;
  height: number;
  mrzBandCrop?: boolean;
};

export type PreprocessResult = {
  buffer: Buffer;
  mimeType: "image/jpeg";
  meta: PreprocessMeta;
};

const MAX_EDGE = 2200;

async function toGreyRaw(buf: Buffer, maxW = 800): Promise<{ data: Buffer; width: number; height: number }> {
  const img = sharp(buf, { failOn: "none" }).rotate(); // EXIF orient
  const meta = await img.metadata();
  const w = meta.width || 1;
  const scale = w > maxW ? maxW / w : 1;
  const width = Math.max(1, Math.round(w * scale));
  const { data, info } = await img
    .resize({ width, withoutEnlargement: true })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/** Estimate small skew (−12..12°) from horizontal projection variance. */
function estimateSkewDeg(data: Buffer, width: number, height: number): number {
  let best = 0;
  let bestScore = -1;
  for (let deg = -12; deg <= 12; deg += 1) {
    const rad = (deg * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const proj = new Float64Array(height);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const v = data[y * width + x];
        if (v < 140) {
          const ny = Math.round(y * cos + x * sin);
          if (ny >= 0 && ny < height) proj[ny] += 255 - v;
        }
      }
    }
    let mean = 0;
    for (let i = 0; i < height; i++) mean += proj[i];
    mean /= height;
    let varSum = 0;
    for (let i = 0; i < height; i++) {
      const d = proj[i] - mean;
      varSum += d * d;
    }
    if (varSum > bestScore) {
      bestScore = varSum;
      best = deg;
    }
  }
  return Math.abs(best) < 1 ? 0 : best;
}

/** Detect if the bottom band looks denser (MRZ-like dark text) — used for band crop. */
function bottomBandDensity(data: Buffer, width: number, height: number): number {
  const y0 = Math.floor(height * 0.68);
  let dark = 0;
  let total = 0;
  for (let y = y0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      total++;
      if (data[y * width + x] < 120) dark++;
    }
  }
  return total ? dark / total : 0;
}

/**
 * Full-page preprocess for passport OCR.
 */
export async function preprocessPassportImage(
  input: Buffer,
  opts?: { mrzBandOnly?: boolean },
): Promise<PreprocessResult> {
  let pipeline = sharp(input, { failOn: "none" }).rotate(); // EXIF
  let rotatedDeg = 0;
  let deskewDeg = 0;
  let trimmed = false;

  // Probe grey for deskew + density
  const probeBuf = await pipeline.jpeg({ quality: 90 }).toBuffer();
  const grey = await toGreyRaw(probeBuf);
  deskewDeg = estimateSkewDeg(grey.data, grey.width, grey.height);

  pipeline = sharp(probeBuf, { failOn: "none" });
  if (deskewDeg !== 0) {
    pipeline = pipeline.rotate(deskewDeg, { background: "#ffffff" });
    rotatedDeg = deskewDeg;
  }

  // Trim near-white borders (page detection lite)
  try {
    pipeline = pipeline.trim({
      background: "#ffffff",
      threshold: 28,
    });
    trimmed = true;
  } catch {
    trimmed = false;
  }

  if (opts?.mrzBandOnly) {
    const meta = await sharp(await pipeline.toBuffer()).metadata();
    const h = meta.height || 1;
    const w = meta.width || 1;
    const top = Math.floor(h * 0.62);
    pipeline = sharp(await pipeline.toBuffer()).extract({
      left: 0,
      top,
      width: w,
      height: Math.max(40, h - top),
    });
  }

  // Resize + contrast + sharpen
  const out = await pipeline
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .normalize()
    .linear(1.18, -12)
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: out.data,
    mimeType: "image/jpeg",
    meta: {
      rotatedDeg,
      deskewDeg,
      trimmed,
      contrastBoosted: true,
      width: out.info.width,
      height: out.info.height,
      mrzBandCrop: !!opts?.mrzBandOnly,
    },
  };
}

export async function shouldRetryMrzBand(input: Buffer): Promise<boolean> {
  try {
    const grey = await toGreyRaw(input);
    return bottomBandDensity(grey.data, grey.width, grey.height) > 0.04;
  } catch {
    return true;
  }
}
