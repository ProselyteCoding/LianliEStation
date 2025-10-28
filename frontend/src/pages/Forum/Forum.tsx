import React, { useEffect, useState, useRef } from "react";
import {
  Carousel,
  Empty,
} from "antd";
import "./Forum.scss";
import "../../Icon.scss";
import { useMainStore } from "../../store";
import { useNavigate } from "react-router-dom";
import Tabbar from "../../components/Tabbar/Tabbar";
import logo from "../../assets/logo.png";
import ForumBanner from "../../assets/banner2.png";
import ADInviting from "../../assets/ad3.3-logo.png";

const Forum = () => {
  const navigate = useNavigate();
  const { 
    posts, 
    fetchPosts, 
    updatePosts,
    postFilters: filters,
    setPostFilters: setFilters,
    clearPosts,
    isForumLoadingMore,
    hasMorePosts,
  } = useMainStore();
  const [searchInputs, setSearchInputs] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPosts();
    
    // 清理函数：组件卸载时清除定时器
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [fetchPosts]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputs(e.target.value);
  };

  const handleSearch = async () => {
    setFilters({ searchTerm: searchInputs });
    clearPosts();
    await fetchPosts(); // 使用fetchPosts重新获取第一页
  };

  const handleOnConfirm = async () => {
    clearPosts();
    handleCloseMore();
    await fetchPosts(); // 使用fetchPosts重新获取第一页
  };

  const handleCloseMore = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMore(false);
      setIsClosing(false);
    }, 300); // 与动画时长一致
  };

  const handleScroll = () => {
    // 如果正在加载或没有更多内容，直接返回
    if (isForumLoadingMore || !hasMorePosts) {
      return;
    }
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // 使用防抖，避免频繁触发
    scrollTimeoutRef.current = setTimeout(() => {
      // forum-body滚动到底部时加载更多
      if (bodyRef.current) {
        const { scrollHeight, scrollTop, clientHeight } = bodyRef.current;

        // 判断是否滚动到底部（提前100px触发，确保更早加载）
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          updatePosts();
        }
      }
    }, 150); // 150ms 防抖延迟
  };

  return (
    <div className="forum-container">
      <div className="forum-navbar">
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <input
          type="text"
          placeholder="搜帖子"
          value={searchInputs}
          onChange={handleChange}
        />
        <div className="icon" onClick={handleSearch}>
          <i className="iconfont icon-search"></i>
        </div>
      </div>

      <div className="forum-body" ref={bodyRef} onScroll={handleScroll}>
        {/* 蒙版层 - 移到 body 内部 */}
        {showMore && <div className="overlay" onClick={handleCloseMore}></div>}
        
        {/* 轮播图 - 会被滚动隐藏 */}
        <div className="carousel-wrapper">
          <Carousel autoplay className="carousel">
            <img
              className="carousel-item"
              src={ForumBanner}
              alt="forumBanner"
              onLoad={() => window.dispatchEvent(new Event('resize'))}
            />
            <img
              className="carousel-item"
              src={ADInviting}
              alt="广告位招商"
              onLoad={() => window.dispatchEvent(new Event('resize'))}
            />
          </Carousel>
        </div>

        {/* 筛选栏 - 吸顶显示 */}
        <div className="un-content">
          <div className="tag">
            <div className="tag-item">
              <div className="post-type">
                <div className="detail">
                  <div
                    className={
                      filters.tag === null ? "active-button" : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: null });
                        handleOnConfirm();
                      }}
                    >
                      全部
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "生活娱乐" ? "active-button" : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "生活娱乐" });
                        handleOnConfirm();
                      }}
                    >
                      生活娱乐
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "新闻通知" ? "active-button" : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "新闻通知" });
                        handleOnConfirm();
                      }}
                    >
                      新闻通知
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "吐槽倾诉"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "吐槽倾诉" });
                        handleOnConfirm();
                      }}
                    >
                      吐槽倾诉
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "学习资料"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "学习资料" });
                        handleOnConfirm();
                      }}
                    >
                      学习资料
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "咨询答疑"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "咨询答疑" });
                        handleOnConfirm();
                      }}
                    >
                      答疑咨询
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "交友组队"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "交友组队" });
                        handleOnConfirm();
                      }}
                    >
                      交友组队
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="more">
              <div 
                className="hamburger-icon"
                onClick={() => setShowMore(!showMore)}
              >
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        {/* 更多筛选弹窗 */}
        {showMore && (
          <div className={`forum-more ${isClosing ? 'closing' : ''}`}>
            <div className="location">
              <div className="location-title">
                <span>校区</span>
              </div>
              <div className="location-list">
                <div
                  className={filters.campus_id === 1 ? "item-active" : "item"}
                  onClick={() => {
                    setFilters({ campus_id: 1 });
                  }}
                >
                  凌水校区
                </div>
                <div
                  className={filters.campus_id === 2 ? "item-active" : "item"}
                  onClick={() => {
                    setFilters({ campus_id: 2 });
                  }}
                >
                  开发区校区
                </div>
                <div
                  className={filters.campus_id === 3 ? "item-active" : "item"}
                  onClick={() => {
                    setFilters({ campus_id: 3 });
                  }}
                >
                  盘锦校区
                </div>
                <div
                  className={filters.campus_id === null ? "item-active" : "item"}
                  onClick={() => {
                    setFilters({ campus_id: null });
                  }}
                >
                  全部
                </div>
              </div>
            </div>

            <div className="sort">
              <div className="sort-title">
                <span>类别</span>
              </div>
              <div className="sort-list">
                <div
                  className={
                    filters.tag === "生活娱乐" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "生活娱乐" });
                  }}
                >
                  生活娱乐
                </div>
                <div
                  className={
                    filters.tag === "吐槽倾诉" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "吐槽倾诉" });
                  }}
                >
                  吐槽倾诉
                </div>
                <div
                  className={
                    filters.tag === "咨询答疑" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "咨询答疑" });
                  }}
                >
                  咨询答疑
                </div>
                <div
                  className={
                    filters.tag === "交友组队" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "交友组队" });
                  }}
                >
                  交友组队
                </div>
                <div
                  className={
                    filters.tag === "学习资料" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "学习资料" });
                  }}
                >
                  学习资料
                </div>
                <div
                  className={
                    filters.tag === "新闻通知" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "新闻通知" });
                  }}
                >
                  新闻通知
                </div>
                <div
                  className={
                    filters.tag === "其他" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "其他" });
                  }}
                >
                  其他
                </div>
                <div
                  className={
                    filters.tag === null ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: null });
                  }}
                >
                  全部
                </div>
              </div>
            </div>

            <div className="confirm">
              <button onClick={handleOnConfirm}>确认</button>
            </div>
          </div>
        )}

        {/* 帖子列表 */}
        <div className="content">
          {posts.length === 0 ? (
            <div className="empty-container">
              <Empty 
                description="没有这一种类的帖子"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <>
              {posts.map((post, index) => {
                // 格式化时间
                const formatTime = (dateString: string) => {
                  const postDate = new Date(dateString);
                  const now = new Date();
                  const isToday = postDate.toDateString() === now.toDateString();
                  const isSameYear = postDate.getFullYear() === now.getFullYear();

                  if (isToday) {
                    // 今天：显示"今天 HH:mm"
                    const hours = postDate.getHours().toString().padStart(2, '0');
                    const minutes = postDate.getMinutes().toString().padStart(2, '0');
                    return `今天 ${hours}:${minutes}`;
                  } else if (isSameYear) {
                    // 当年：显示"MM-DD"
                    const month = (postDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = postDate.getDate().toString().padStart(2, '0');
                    return `${month}-${day}`;
                  } else {
                    // 非当年：显示"YYYY-MM-DD"
                    const year = postDate.getFullYear();
                    const month = (postDate.getMonth() + 1).toString().padStart(2, '0');
                    const day = postDate.getDate().toString().padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  }
                };

                return (
                <div 
                  className={`post-card ${post.images.length > 0 ? 'has-images' : 'no-images'}`}
                  key={post.id} 
                  onClick={() => navigate(`/forum-detail?id=${post.id}`)}
                  // onClick={()=>console.log(posts)}
                >
                <div className="post-header">
                  <div className="author-info">
                    <img 
                      src={post.author_avatar 
                        ? (post.author_avatar.startsWith('http') 
                          ? post.author_avatar 
                          : `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${post.author_avatar}`)
                        : logo
                      }
                      alt="avatar" 
                      className="author-avatar"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = logo;
                      }}
                    />
                    <span className="author-name">{post.author_name}</span>
                  </div>
                  <span className="post-time">{formatTime(post.created_at)}</span>
                </div>

                <div className="post-title">{post.title}</div>

                <div className="post-body">
                  <div className="post-content">{post.content}</div>
                  
                  {post.images.length > 0 && (
                    <div className="post-images">
                      {post.images.slice(0, 3).map((image, imgIndex) => (
                        <img 
                          key={imgIndex}
                          src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${image}`} 
                          alt={`帖子图片${imgIndex + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="post-footer">
                  <div className="stat-item">
                    <i className="iconfont icon-like2"></i>
                    <span>{post.likes}</span>
                  </div>
                  <div className="stat-item">
                    <span>💬</span>
                    <span>
                      {post.comments?.reduce((total, comment) => {
                        return total + 1 + (comment.replies?.length || 0);
                      }, 0) || 0}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* 加载状态提示 */}
          {isForumLoadingMore && (
            <div className="loading-more">
              <span>加载中...</span>
            </div>
          )}
          
          {/* 没有更多内容提示 */}
          {!hasMorePosts && posts.length > 0 && (
            <div className="no-more">
              <span>没有更多帖子了</span>
            </div>
          )}
            </>
          )}
        </div>
      </div>

      <div className="forum-tabbar">
        <div className="custom-float-button" onClick={() => navigate(`/publish/forum-publish`)}>
          <i className="iconfont icon-add plus-icon"></i>
        </div>
        <Tabbar initialIndex={1} />
      </div>
    </div>
  );
};

export default Forum;
