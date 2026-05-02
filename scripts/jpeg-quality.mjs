import { readFileSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const STD_LUMA = [
  16, 11, 10, 16, 24, 40, 51, 61,
  12, 12, 14, 19, 26, 58, 60, 55,
  14, 13, 16, 24, 40, 57, 69, 56,
  14, 17, 22, 29, 51, 87, 80, 62,
  18, 22, 37, 56, 68, 109, 103, 77,
  24, 35, 55, 64, 81, 104, 113, 92,
  49, 64, 78, 87, 103, 121, 120, 101,
  72, 92, 95, 98, 112, 100, 103, 99,
];

function readQTables(buf) {
  let off = 2; // skip SOI FFD8
  const tables = [];
  let chroma = "?";
  while (off < buf.length - 4) {
    if (buf[off] !== 0xff) break;
    const marker = buf[off + 1];
    if (marker === 0xd9) break;
    if (marker === 0xda) break; // start of scan
    if (marker >= 0xd0 && marker <= 0xd7) {
      off += 2;
      continue;
    }
    const len = buf.readUInt16BE(off + 2);
    if (marker === 0xdb) {
      let p = off + 4;
      const end = off + 2 + len;
      while (p < end) {
        const ph = buf[p++];
        const precision = ph >> 4;
        const id = ph & 0x0f;
        const table = [];
        for (let i = 0; i < 64; i++) {
          if (precision === 0) table.push(buf[p++]);
          else {
            table.push(buf.readUInt16BE(p));
            p += 2;
          }
        }
        tables.push({ id, table });
      }
    } else if (marker === 0xc0 || marker === 0xc2) {
      // SOF0 / SOF2 — components describe chroma subsampling
      const ncomps = buf[off + 4 + 5];
      if (ncomps === 3) {
        const y = buf[off + 4 + 6 + 1];
        const hY = y >> 4;
        const vY = y & 0x0f;
        if (hY === 1 && vY === 1) chroma = "4:4:4";
        else if (hY === 2 && vY === 1) chroma = "4:2:2";
        else if (hY === 2 && vY === 2) chroma = "4:2:0";
        else chroma = `${hY}x${vY}`;
      }
    }
    off += 2 + len;
  }
  return { tables, chroma };
}

function estimateQuality(luma) {
  let s = 0;
  for (let i = 0; i < 64; i++) s += luma[i] / STD_LUMA[i];
  const avg = s / 64;
  if (avg <= 1) return 100 - 50 * avg;
  return 50 / avg;
}

const root = "public/panoramas";
const rows = [];
for (const folder of readdirSync(root)) {
  const dir = join(root, folder);
  if (!statSync(dir).isDirectory()) continue;
  for (const f of readdirSync(dir)) {
    if (!/\.jpe?g$/i.test(f)) continue;
    const full = join(dir, f);
    const buf = readFileSync(full);
    const { tables, chroma } = readQTables(buf);
    const luma = tables.find((t) => t.id === 0)?.table;
    const q = luma ? estimateQuality(luma).toFixed(1) : "?";
    const sizeMB = (statSync(full).size / 1048576).toFixed(2);
    rows.push({ folder, f, q, chroma, sizeMB });
  }
}
console.log("folder     file                  est.quality  chroma   size");
console.log("---------- --------------------  -----------  -------  ------");
for (const r of rows) {
  console.log(
    `${r.folder.padEnd(10)} ${r.f.padEnd(20)}  q=${String(r.q).padStart(7)}  ${r.chroma.padEnd(7)}  ${r.sizeMB} MB`
  );
}
