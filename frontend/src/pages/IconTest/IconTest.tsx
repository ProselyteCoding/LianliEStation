/**
 * 图标系统测试页面
 * 用于验证 Icon 组件和图标切换功能
 */

import React, { useState } from 'react';
import Icon from '../../components/Icon/Icon';
import { getIconType } from '../../config/iconConfig';
import './IconTest.scss';

const IconTest: React.FC = () => {
  const [iconType] = useState(getIconType());
  const [liked, setLiked] = useState(false);
  const [stared, setStared] = useState(false);

  return (
    <div className="icon-test-page">
      <div className="test-header">
        <h1>图标系统测试</h1>
        <div className="config-info">
          <span>当前方案：</span>
          <strong>{iconType === 'svg' ? 'SVG 图标' : 'iconfont 字体图标'}</strong>
        </div>
      </div>

      <div className="test-section">
        <h2>导航图标</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="search" size={32} />
            <span>search</span>
          </div>
          <div className="icon-item">
            <Icon name="left" size={32} />
            <span>left</span>
          </div>
          <div className="icon-item">
            <Icon name="right" size={32} />
            <span>right</span>
          </div>
          <div className="icon-item">
            <Icon name="close" size={32} />
            <span>close</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>功能图标</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="share" size={32} />
            <span>share</span>
          </div>
          <div className="icon-item">
            <Icon name="copy" size={32} />
            <span>copy</span>
          </div>
          <div className="icon-item">
            <Icon name="refresh" size={32} />
            <span>refresh</span>
          </div>
          <div className="icon-item">
            <Icon name="more" size={32} />
            <span>more</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>用户功能</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="favorites" size={32} />
            <span>favorites</span>
          </div>
          <div className="icon-item">
            <Icon name="history" size={32} />
            <span>history</span>
          </div>
          <div className="icon-item">
            <Icon name="messages" size={32} />
            <span>messages</span>
          </div>
          <div className="icon-item">
            <Icon name="settings" size={32} />
            <span>settings</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>底部导航 - 商城</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="market" size={32} />
            <span>market</span>
          </div>
          <div className="icon-item">
            <Icon name="market-active" size={32} />
            <span>market-active</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>底部导航 - 论坛</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="forum" size={32} />
            <span>forum</span>
          </div>
          <div className="icon-item">
            <Icon name="forum-active" size={32} />
            <span>forum-active</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>底部导航 - 用户</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="user" size={32} />
            <span>user</span>
          </div>
          <div className="icon-item">
            <Icon name="user-active" size={32} />
            <span>user-active</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>交互图标（点击测试）</h2>
        <div className="icon-grid">
          <div className="icon-item interactive" onClick={() => setLiked(!liked)}>
            <Icon name={liked ? "like-active" : "like"} size={32} />
            <span>{liked ? 'like-active' : 'like'}</span>
          </div>
          <div className="icon-item interactive" onClick={() => setStared(!stared)}>
            <Icon name={stared ? "star-active" : "star"} size={32} />
            <span>{stared ? 'star-active' : 'star'}</span>
          </div>
        </div>
      </div>

      <div className="test-section">
        <h2>尺寸测试</h2>
        <div className="icon-grid">
          <div className="icon-item">
            <Icon name="search" size={16} />
            <span>16px</span>
          </div>
          <div className="icon-item">
            <Icon name="search" size={24} />
            <span>24px</span>
          </div>
          <div className="icon-item">
            <Icon name="search" size={32} />
            <span>32px</span>
          </div>
          <div className="icon-item">
            <Icon name="search" size={48} />
            <span>48px</span>
          </div>
        </div>
      </div>

      <div className="test-instructions">
        <h3>切换图标方案</h3>
        <p>当前使用：<strong>{iconType}</strong></p>
        <div className="code-block">
          <p>要切换到另一种方案，请修改 <code>.env.development</code>：</p>
          <pre>
            {`# 使用 SVG（当前）
REACT_APP_ICON_TYPE=svg

# 或使用 iconfont
REACT_APP_ICON_TYPE=iconfont`}
          </pre>
          <p>修改后重启开发服务器：<code>npm start</code></p>
        </div>
      </div>
    </div>
  );
};

export default IconTest;
