import React, { useEffect } from 'react'
import './SwitchDirection.scss'
import switchIcon from '../../assets/switch-direction.webp'

interface SwitchDirectionProps {
  onClose?: () => void;
}

const SwitchDirection: React.FC<SwitchDirectionProps> = ({ onClose }) => {
  // 添加键盘ESC关闭支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  // 点击蒙版背景关闭
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className='switch-container'>
      <div className='switch-overlay' onClick={handleOverlayClick}>
        <div className='switch-content'>
          {/* 关闭按钮 */}
          {onClose && (
            <button className='close-button' onClick={onClose} aria-label="关闭提示">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path
                  d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          )}
          
          <div className='switch-animation'>
            <img 
              src={switchIcon} 
              alt="旋转设备图标" 
              className='switch-icon'
            />
          </div>
          
          <div className='switch-text'>
            <h2>请旋转您的设备</h2>
            <p>为了获得最佳浏览体验，请将设备旋转至竖屏模式</p>
            <div className='tips'>
              <small>• 体验更好的界面布局</small>
              <small>• 更方便的操作体验</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SwitchDirection
