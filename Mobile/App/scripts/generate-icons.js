const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SRC = 'src/assets/family_tree_hero.png';
const RES = 'android/app/src/main/res';

// Các size icon thường
const SIZES = [
  { folder: 'mipmap-mdpi',    size: 48  },
  { folder: 'mipmap-hdpi',    size: 72  },
  { folder: 'mipmap-xhdpi',   size: 96  },
  { folder: 'mipmap-xxhdpi',  size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Crop 25% mỗi phía để zoom vào cây
async function cropCenter(srcPath, size) {
  const meta = await sharp(srcPath).metadata();
  const { width: w, height: h } = meta;
  const sq = Math.min(w, h);
  const cx = Math.round((w - sq) / 2);
  const cy = Math.round((h - sq) / 2);
  return sharp(srcPath)
    .extract({ left: cx, top: cy, width: sq, height: sq })
    .resize(size, size, { fit: 'cover' })
    .flatten({ background: { r: 8, g: 8, b: 24 } })
    .png()
    .toBuffer();
}

async function run() {
  // 1. Icon thường cho mỗi density (fallback cho Android < 8)
  for (const { folder, size } of SIZES) {
    const outDir = path.join(RES, folder);
    fs.mkdirSync(outDir, { recursive: true });
    const buf = await cropCenter(SRC, size);
    fs.writeFileSync(path.join(outDir, 'ic_launcher.png'), buf);
    fs.writeFileSync(path.join(outDir, 'ic_launcher_round.png'), buf);
    console.log(`✓ ${folder}: ${size}x${size}`);
  }

  // 2. Background PNG cho Adaptive Icon (Android 8+)
  // Kích thước chuẩn adaptive bg = 108dp, xxxhdpi=4x → 432px
  // Nhưng để đơn giản dùng 512px, Android scale tự động
  const bgBuf = await cropCenter(SRC, 512);
  const drawableDir = path.join(RES, 'drawable');
  fs.mkdirSync(drawableDir, { recursive: true });
  fs.writeFileSync(path.join(drawableDir, 'ic_launcher_background.png'), bgBuf);
  console.log('✓ drawable/ic_launcher_background.png (512px)');

  // 3. In-app logo asset
  const logoBuf = await cropCenter(SRC, 300);
  fs.writeFileSync('src/assets/logo_tree.png', logoBuf);
  console.log('✓ src/assets/logo_tree.png');

  console.log('\nDone!');
}

run().catch(console.error);
