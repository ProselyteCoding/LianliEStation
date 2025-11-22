import React from 'react'
import './Forum.scss'

const Forum = () => {
  // 生成骨架屏帖子卡片
  const generateSkeletonPosts = (count: number) => {
    return Array.from({ length: count }, (_, index) => (
      <div key={index} className="skeleton-post-card">
        <div className="skeleton-post-header">
          <div className="skeleton-avatar" />
          <div className="skeleton-author-name" />
        </div>
        <div className="skeleton-title" />
        <div className="skeleton-content-line" />
        <div className="skeleton-content-line short" />
        <div className="skeleton-post-images">
          <div className="skeleton-image-item" />
          <div className="skeleton-image-item" />
          <div className="skeleton-image-item" />
        </div>
        <div className="skeleton-likes">
          <div className="skeleton-like-icon" />
          <div className="skeleton-like-count" />
        </div>
      </div>
    ))
  }

  return (
    <div className='loading-forum-container'>
      {/* 仅保留帖子列表骨架 - 其他部分加载速度很快，不需要骨架 */}
      <div className="loading-posts">
        {generateSkeletonPosts(6)}
      </div>
    </div>
  )
}

export default Forum
