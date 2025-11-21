const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '../src/assets');
const outputDir = assetsDir;

// 需要转换的图片列表
const imagesToConvert = [
  'logo.png',
  'title.png',
  'banner1.png',
  'banner2.png',
  'banner3.png',
  'ad1.5-logo.png',
  'ad1.5-nologo.png',
  'ad3.3-logo.png',
  'ad3.3-nologo.png',
  'switch-direction.png',
  'accept.png'
];

async function convertToWebP(filename) {
  const inputPath = path.join(assetsDir, filename);
  const outputFilename = filename.replace('.png', '.webp');
  const outputPath = path.join(outputDir, outputFilename);

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️  文件不存在: ${filename}`);
    return;
  }

  try {
    const info = await sharp(inputPath)
      .webp({ quality: 85, effort: 6 }) // 高质量 WebP，effort 6 为较好压缩
      .toFile(outputPath);

    const originalSize = fs.statSync(inputPath).size;
    const newSize = info.size;
    const reduction = ((1 - newSize / originalSize) * 100).toFixed(2);

    console.log(`✅ ${filename} -> ${outputFilename}`);
    console.log(`   原大小: ${(originalSize / 1024).toFixed(2)} KB`);
    console.log(`   新大小: ${(newSize / 1024).toFixed(2)} KB`);
    console.log(`   减少: ${reduction}%\n`);
  } catch (error) {
    console.error(`❌ 转换失败 ${filename}:`, error.message);
  }
}

async function convertAll() {
  console.log('🚀 开始转换图片为 WebP 格式...\n');
  
  for (const image of imagesToConvert) {
    await convertToWebP(image);
  }
  
  console.log('✨ 所有图片转换完成！');
  console.log('\n📝 下一步操作：');
  console.log('1. 更新代码中的图片引用（将 .png 改为 .webp）');
  console.log('2. 确认浏览器兼容性（现代浏览器均支持 WebP）');
  console.log('3. 可选：保留原 PNG 作为备份或删除');
}

convertAll();
