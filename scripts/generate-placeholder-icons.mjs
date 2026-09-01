// One-off, dependency-free PNG generator for placeholder PWA icons.
// Produces solid obsidian-background squares so the manifest + install
// flow is testable before real brand icon assets exist. Replace the
// files in frontend/public/icons/ with real exports before Day 5 launch
// (PRD §11.2 Icons, §16.4 launch checklist).
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";

const OUT_DIR = new URL("../frontend/public/icons/", import.meta.url);
mkdirSync(OUT_DIR, { recursive: true });

const OBSIDIAN = [0x05, 0x08, 0x0d]; // #05080D
const BRASS = [0xd4, 0xaf, 0x37]; // #D4AF37

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, { maskablePadding = 0 } = {}) {
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 3);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const inSafeZone =
        maskablePadding === 0 ||
        (x >= maskablePadding &&
          x < size - maskablePadding &&
          y >= maskablePadding &&
          y < size - maskablePadding);
      // simple centered square "mark" in brass, obsidian elsewhere
      const cx = size / 2;
      const cy = size / 2;
      const markHalf = size * 0.18;
      const isMark = Math.abs(x - cx) < markHalf && Math.abs(y - cy) < markHalf;
      const color = isMark && inSafeZone ? BRASS : OBSIDIAN;
      const px = rowStart + 1 + x * 3;
      raw[px] = color[0];
      raw[px + 1] = color[1];
      raw[px + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-256.png", size: 256 },
  { name: "icon-384.png", size: 384 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskablePadding: 52 }, // ~10% safe-zone padding
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const png = makePng(t.size, { maskablePadding: t.maskablePadding ?? 0 });
  writeFileSync(new URL(t.name, OUT_DIR), png);
  console.log(`wrote ${t.name} (${t.size}x${t.size})`);
}
