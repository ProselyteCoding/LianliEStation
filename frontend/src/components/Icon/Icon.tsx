/**
 * 统一图标组件
 * 根据配置自动选择使用 SVG 或 iconfont
 * 
 * 使用示例：
 * <Icon name="search" size={24} color="#333" />
 * <Icon name="like" size={20} className="custom-class" onClick={handleClick} />
 */

import React from 'react';
import { getIconType, getIconConfig, IconName } from '../../config/iconConfig';
import { px2rem } from '../../utils/rem';
import './Icon.scss';

interface IconProps {
  /** 图标名称，必须在 iconConfig.ts 中定义 */
  name: IconName;
  /** 图标大小（px），默认 24 */
  size?: number;
  /** 图标颜色（仅 iconfont 生效），默认继承 */
  color?: string;
  /** 自定义类名 */
  className?: string;
  /** 点击事件 */
  onClick?: (e: React.MouseEvent) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  onClick,
  style = {},
}) => {
  const iconType = getIconType();
  const config = getIconConfig(name);

  if (!config) {
    console.error(`Icon "${name}" not found in iconConfig`);
    return null;
  }

  // 合并样式，使用 rem 单位
  const mergedStyle: React.CSSProperties = {
    width: px2rem(size),
    height: px2rem(size),
    ...style,
  };

  // SVG 方案
  if (iconType === 'svg') {
    return (
      <img
        src={config.svg}
        alt={name}
        className={`icon-svg ${className}`}
        style={mergedStyle}
        onClick={onClick}
      />
    );
  }

  // iconfont 方案
  return (
    <i
      className={`iconfont ${config.iconfont} ${className}`}
      style={{
        fontSize: px2rem(size),
        color: color,
        ...style,
      }}
      onClick={onClick}
    />
  );
};

export default Icon;
