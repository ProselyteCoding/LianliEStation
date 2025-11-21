import React, { useState } from 'react';
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

  return (
    <div className={`responsive-image-wrapper responsive-image-wrapper-${size}`}>
      <img 
        src={src} 
        alt={alt}
        className={`responsive-image responsive-image-${size} ${className} ${isLoaded ? 'loaded' : 'loading'}`}
        loading="lazy"  // 懒加载
        decoding="async"  // 异步解码
        onLoad={() => setIsLoaded(true)}  // 加载完成后显示
      />
    </div>
  );
};
