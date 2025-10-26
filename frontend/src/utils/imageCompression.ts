/**
 * 图片压缩工具函数
 * 用于在上传前压缩图片，避免请求超时
 */

import imageCompression from 'browser-image-compression';

export interface CompressionOptions {
  maxSizeMB?: number; // 最大文件大小（MB）
  maxWidthOrHeight?: number; // 最大宽度或高度
  useWebWorker?: boolean; // 是否使用 Web Worker
  fileType?: string; // 输出文件类型
  initialQuality?: number; // 初始质量 (0-1)
}

/**
 * 压缩单个图片文件
 * @param file 要压缩的图片文件
 * @param options 压缩选项
 * @returns 压缩后的文件
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  // 默认压缩选项
  const defaultOptions = {
    maxSizeMB: 1, // 最大 1MB
    maxWidthOrHeight: 1920, // 最大宽度/高度 1920px
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.85, // 初始质量 85%
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    console.log(`🔄 开始压缩图片: ${file.name}`);
    console.log(`📊 原始大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

    const compressedFile = await imageCompression(file, finalOptions);

    console.log(`✅ 压缩完成: ${compressedFile.name}`);
    console.log(`📊 压缩后大小: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📈 压缩率: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);

    return compressedFile;
  } catch (error) {
    console.error('❌ 图片压缩失败:', error);
    console.warn('⚠️ 使用原始文件');
    return file; // 压缩失败时返回原文件
  }
}

/**
 * 批量压缩图片文件
 * @param files 要压缩的图片文件数组
 * @param options 压缩选项
 * @returns 压缩后的文件数组
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> {
  if (!files || files.length === 0) {
    return [];
  }

  console.log(`🔄 开始批量压缩 ${files.length} 张图片...`);
  const startTime = Date.now();

  try {
    // 并行压缩所有图片
    const compressedFiles = await Promise.all(
      files.map((file) => compressImage(file, options))
    );

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`✅ 批量压缩完成，耗时: ${totalTime}s`);

    return compressedFiles;
  } catch (error) {
    console.error('❌ 批量压缩失败:', error);
    console.warn('⚠️ 使用原始文件');
    return files; // 压缩失败时返回原文件
  }
}

/**
 * 商品/帖子图片压缩（最多3张，更高质量）
 * @param files 要压缩的图片文件数组
 * @returns 压缩后的文件数组
 */
export async function compressPostImages(files: File[]): Promise<File[]> {
  return compressImages(files, {
    maxSizeMB: 2, // 商品/帖子图片可以稍大一些
    maxWidthOrHeight: 2048, // 更高分辨率
    initialQuality: 0.9, // 更高质量
    fileType: 'image/jpeg',
    useWebWorker: true,
  });
}

/**
 * 头像/背景图压缩（较小尺寸）
 * @param file 要压缩的图片文件
 * @param type 图片类型
 * @returns 压缩后的文件
 */
export async function compressProfileImage(
  file: File,
  type: 'avatar' | 'background' | 'banner'
): Promise<File> {
  let options: CompressionOptions = {
    maxSizeMB: 1,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: 0.9,
  };

  // 根据类型调整压缩参数
  switch (type) {
    case 'avatar':
      options.maxWidthOrHeight = 400; // 头像较小
      break;
    case 'background':
      options.maxWidthOrHeight = 1920; // 背景图较大
      break;
    case 'banner':
      options.maxWidthOrHeight = 1200; // Banner 中等
      break;
  }

  return compressImage(file, options);
}

/**
 * 申诉图片压缩（证据图片，保持较高质量）
 * @param files 要压缩的图片文件数组
 * @returns 压缩后的文件数组
 */
export async function compressAppealImages(files: File[]): Promise<File[]> {
  return compressImages(files, {
    maxSizeMB: 2.5, // 申诉图片保持较高质量
    maxWidthOrHeight: 2048,
    initialQuality: 0.95, // 最高质量
    fileType: 'image/jpeg',
    useWebWorker: true,
  });
}
