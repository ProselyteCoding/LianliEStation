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
    if (containerWidth < 400) {
      columns = 2;
    } else if (containerWidth < 600) {
      columns = 3;
    } else if (containerWidth < 800) {
      columns = 4;
    } else {
      columns = Math.floor((containerWidth + 6) / 146);
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
