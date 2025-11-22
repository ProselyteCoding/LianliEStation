import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import useMainStore from '../../store/mainStore';
import useUserStore from '../../store/userStore';
import LoadingMarket from '../Loading/Market/Market';
import LoadingForum from '../Loading/Forum/Forum';
import LoadingUser from '../Loading/User/User';
import './LoadingManager.scss';

interface LoadingManagerProps {
  children: React.ReactNode;
}

const LoadingManager: React.FC<LoadingManagerProps> = ({ children }) => {
  // 骨架屏逻辑已重构：不再使用全屏蒙版，而是在页面内部列表区域显示骨架项
  // 直接渲染子组件，骨架屏由各页面自己控制
  return <>{children}</>;
};

export default LoadingManager;
