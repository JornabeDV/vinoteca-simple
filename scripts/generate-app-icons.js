const sharp = require("sharp");
const path = require("path");

const SOURCE = path.join(__dirname, "..", "public", "logo_imagen_sin_fondo.png");
const OUT_DIR = path.join(__dirname, "..", "public");

const BACKGROUND = "#faf9f7";

const ICONS = [
  { file: "icon-192.png", size: 192, scale: 0.5 },
  { file: "icon-512.png", size: 512, scale: 0.6 },
  { file: "apple-touch-icon.png", size: 180, scale: 0.5 },
];

async function main() {
  for (const { file, size, scale } of ICONS) {
    const logoSize = Math.round(size * scale);

    const logo = await sharp(SOURCE)
      .resize(logoSize, logoSize, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: BACKGROUND,
      },
    })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(path.join(OUT_DIR, file));

    console.log(`Generated ${file} (${size}x${size})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
