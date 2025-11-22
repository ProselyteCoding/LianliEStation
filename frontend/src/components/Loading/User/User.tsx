import React from 'react'
import './User.scss'

const User = () => {
  return (
    <div className='loading-user-container'>
      {/* User 页面几乎都是静态内容，加载非常快，不需要骨架屏 */}
      <div className="loading-placeholder">
        {/* 空占位，几乎不可见 */}
      </div>
    </div>
  )
}

export default User
