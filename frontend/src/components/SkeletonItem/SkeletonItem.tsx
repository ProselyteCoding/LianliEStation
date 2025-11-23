import React from 'react';
import './SkeletonItem.scss';

interface SkeletonItemProps {
  width?: number | string;
  aspectRatio?: number;  // 宽高比 (width / height)
  className?: string;
}

/**
 * 自定义骨架屏组件 - 商品列表项
 * 与真实商品列表保持一致的结构和动态宽度
 */
export const SkeletonItem: React.FC<SkeletonItemProps> = ({ 
  width = '100%', 
  aspectRatio = 1.3,
  className = ''
}) => {
  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <div className={`skeleton-item ${className}`} style={{ width: widthStyle }}>
      {/* 图片占位 */}
      <div 
        className="skeleton-image" 
        style={{ aspectRatio: aspectRatio.toString() }}
      />
      
      {/* 标题占位 */}
      <div className="skeleton-title" />
      
      {/* 底部信息 */}
      <div className="skeleton-bottom">
        <div className="skeleton-price" />
        <div className="skeleton-tags">
          <div className="skeleton-tag" />
          <div className="skeleton-tag" />
        </div>
      </div>
    </div>
  );
};

/**
 * 骨架屏列表容器
 * 根据动态列数生成商品项
 */
interface SkeletonListProps {
  columns: number;        // 列数
  count?: number;         // 显示数量
  gap?: number;          // 间距(px)
  padding?: number;      // 容器内边距(px)
}

export const SkeletonList: React.FC<SkeletonListProps> = ({ 
  columns, 
  count = 8,
  gap = 6,
  padding = 6
}) => {
  // 计算每个项的宽度
  const containerWidth = window.innerWidth - padding * 2;
  const itemWidth = (containerWidth - (columns - 1) * gap) / columns;

  return (
    <div 
      className="skeleton-list"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        padding: `0 ${padding}px`,
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonItem 
          key={index} 
          width={itemWidth}
          aspectRatio={1.3}
        />
      ))}
    </div>
  );
};
