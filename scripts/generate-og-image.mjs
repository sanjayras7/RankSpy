import { writeFileSync } from "fs";
import { deflateSync } from "zlib";

// 1200x630 dark purple background (#1a1a2e) with deep blue (#16213e) band
const WIDTH = 1200;
const HEIGHT = 630;

// Build raw RGBA pixel data (each row starts with filter byte 0x00)
function buildPixelData() {
  const rowSize = 1 + WIDTH * 4;
  const buffer = Buffer.alloc(rowSize * HEIGHT, 0);

  for (let y = 0; y < HEIGHT; y++) {
    const rowOffset = y * rowSize;
    for (let x = 0; x < WIDTH; x++) {
      const px = rowOffset + 1 + x * 4;
      buffer[px + 3] = 255; // alpha

      if (y < 280 || y > 350) {
        // #1a1a2e
        buffer[px + 0] = 0x1a;
        buffer[px + 1] = 0x1a;
        buffer[px + 2] = 0x2e;
      } else {
        // #16213e band
        buffer[px + 0] = 0x16;
        buffer[px + 1] = 0x21;
        buffer[px + 2] = 0x3e;
      }
    }
  }
  return buffer;
}

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeB, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeB, data, crc]);
}

const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(WIDTH, 0);
ihdr.writeUInt32BE(HEIGHT, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // RGBA
ihdr[10] = 0; // compression
ihdr[11] = 0; // filter
ihdr[12] = 0; // interlace

const raw = buildPixelData();
const compressed = deflateSync(raw);

const png = Buffer.concat([
  sig,
  makeChunk("IHDR", ihdr),
  makeChunk("IDAT", compressed),
  makeChunk("IEND", Buffer.alloc(0)),
]);

writeFileSync("public/og-image.png", png);
console.log(`Generated public/og-image.png (${png.length} bytes)`);
