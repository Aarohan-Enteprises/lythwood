import sharp from "sharp";
import { mkdir, readdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "public", "panoramas");
const OUT = join(ROOT, "thumbs-out");

const FOLDERS = ["lythwood", "property2"];
const HERO_SRC = join(SRC, "lythwood", "entrance_hall.jpg");

async function clean() {
  if (existsSync(OUT)) await rm(OUT, { recursive: true, force: true });
}

async function genCards() {
  for (const folder of FOLDERS) {
    const srcDir = join(SRC, folder);
    const outDir = join(OUT, "thumbs", folder);
    await mkdir(outDir, { recursive: true });
    const files = (await readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f));
    for (const f of files) {
      const out = join(outDir, basename(f, extname(f)) + ".webp");
      await sharp(join(srcDir, f))
        .resize({ width: 600, height: 400, fit: "cover", position: "center" })
        .webp({ quality: 72 })
        .toFile(out);
      console.log("card", folder, f, "->", out);
    }
  }
}

async function genHero() {
  const outDir = join(OUT, "hero");
  await mkdir(outDir, { recursive: true });
  const out = join(outDir, "main.webp");
  await sharp(HERO_SRC)
    .resize({ width: 1920, height: 1080, fit: "cover", position: "center" })
    .webp({ quality: 76 })
    .toFile(out);
  console.log("hero ->", out);
}

await clean();
await genCards();
await genHero();
console.log("done");
