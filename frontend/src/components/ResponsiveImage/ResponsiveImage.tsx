import React, { useState, useRef, useEffect } from 'react';
import './ResponsiveImage.scss';

interface ResponsiveImageProps {
  src: string;           // 图片 URL
  alt: string;
  size?: 'thumb' | 'medium' | 'large';  // 使用场景
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ 
  src, 
  alt, 
  size = 'medium',
  className = ''
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 预加载图片获取尺寸
  useEffect(() => {
    const img = new Image();
    img.src = src;
    
    img.onload = () => {
      setDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
  }, [src]);

  // 计算占位高度（使用容器宽度和图片比例）
  const placeholderStyle = dimensions ? {
    aspectRatio: `${dimensions.width} / ${dimensions.height}`
  } : {
    minHeight: '150px' // 默认最小高度，避免没有尺寸时高度为0
  };

  return (
    <div 
      className={`responsive-image-wrapper responsive-image-wrapper-${size} ${isLoaded ? 'loaded' : ''}`}
    >
      <img 
        ref={imgRef}
        src={src} 
        alt={alt}
        // 使用预加载的尺寸设置 width/height 属性，浏览器会提前保留空间
        width={dimensions?.width}
        height={dimensions?.height}
        className={`responsive-image responsive-image-${size} ${className}`}
        loading="lazy"
        decoding="async"
        data-loaded={isLoaded}
        onLoad={() => setIsLoaded(true)}
        style={{ opacity: isLoaded ? 1 : 0 }}
      />
    </div>
  );
};
