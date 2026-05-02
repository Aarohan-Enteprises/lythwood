import sharp from "sharp";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "panoramas", "property2");
const OUT = join(ROOT, "recompressed-out", "property2");

if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

const files = (await readdir(SRC)).filter((f) => /\.jpe?g$/i.test(f));
let totalIn = 0;
let totalOut = 0;

for (const f of files) {
  const inPath = join(SRC, f);
  const outPath = join(OUT, f);
  const inSize = (await stat(inPath)).size;
  await sharp(inPath)
    .jpeg({
      quality: 82,
      chromaSubsampling: "4:2:0",
      mozjpeg: true,
      progressive: true,
    })
    .toFile(outPath);
  const outSize = (await stat(outPath)).size;
  totalIn += inSize;
  totalOut += outSize;
  const inMB = (inSize / 1048576).toFixed(2);
  const outMB = (outSize / 1048576).toFixed(2);
  const drop = (((inSize - outSize) / inSize) * 100).toFixed(0);
  console.log(`${f.padEnd(20)}  ${inMB.padStart(6)} MB -> ${outMB.padStart(6)} MB  (-${drop}%)`);
}

console.log("---");
console.log(
  `total: ${(totalIn / 1048576).toFixed(2)} MB -> ${(totalOut / 1048576).toFixed(2)} MB  (-${(((totalIn - totalOut) / totalIn) * 100).toFixed(0)}%)`
);
