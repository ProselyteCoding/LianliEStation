import React, { useMemo, useState, useEffect } from 'react'
import { SkeletonList } from '../../SkeletonItem'
import './Market.scss'

const Market = () => {
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  // 监听窗口尺寸变化
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 与真实 Market 页面相同的列数计算逻辑
  const elementsPerRow = useMemo(() => {
    const containerWidth = windowSize.width - 12; // 减去左右padding
    let columns;
    if (containerWidth < 500) {
      columns = 2;  // 500px 以下保持 2 列（覆盖大部分手机）
    } else if (containerWidth < 700) {
      columns = 3;  // 500-700px 用 3 列（小平板或横屏手机）
    } else if (containerWidth < 900) {
      columns = 4;  // 700-900px 用 4 列
    } else if (containerWidth < 1100) {
      columns = 5;  // 900-1100px 用 5 列
    } else {
      columns = 6;  // 1100px 以上用 6 列
    }
    return Math.max(2, Math.min(columns, 6));
  }, [windowSize.width]);

  return (
    <div className='loading-market-container'>
      {/* 仅保留商品列表骨架 - 其他部分加载速度很快，不需要骨架 */}
      <div className="skeleton-list-wrapper">
        <SkeletonList columns={elementsPerRow} count={8} gap={6} padding={6} />
      </div>
    </div>
  )
}

export default Market
