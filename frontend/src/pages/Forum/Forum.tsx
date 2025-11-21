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
import Icon from "../../components/Icon/Icon";
import logo from "../../assets/logo.webp";
import ForumBanner from "../../assets/banner2.webp";
import { useDebounce,useDebouncedCallback } from '../../hooks/useDebounce'
import ADInviting from "../../assets/ad3.3-logo.webp";
import { useScrollerStore } from "../../store";
import { useLocation } from "react-router-dom";

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
    getForumPage,
    saveForumCache,
  } = useMainStore();
  const location = useLocation()
  const scrollerStore = useScrollerStore()
  const [searchInputs, setSearchInputs] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const carouselWrapperRef = useRef<HTMLDivElement | null>(null); // banner 容器引用
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialScrollSet = useRef(false); // 标记是否已设置初始滚动位置
  const [scroller,setScroller] = useState<number>(0)
  
  // TODO: Banner 初始高度计算功能暂时禁用，需要重新设计实现方案
  // 问题：无法在组件初始化时准确获取 banner 高度，导致轮播图出现跳动
  // const savedScroll = scrollerStore.scrollStates[location.pathname] || 0;
  // const savedBannerHeight = scrollerStore.bannerHeights[location.pathname] || 0;
  // const initialBannerHeight = (savedScroll > 0 && savedBannerHeight > 0) 
  //   ? Math.max(0, savedBannerHeight - savedScroll) 
  //   : null;
  const initialBannerHeight = null;

  // bodyRef 的 callback，在元素挂载时立即设置滚动位置
  const setBodyRef = (element: HTMLDivElement | null) => {
    bodyRef.current = element;
    
    // 只在首次挂载时设置初始滚动位置
    if (element && !initialScrollSet.current) {
      const savedScroll = scrollerStore.scrollStates[location.pathname] || 0;
      if (savedScroll > 0) {
        // 立即设置滚动位置
        element.scrollTop = savedScroll;
        initialScrollSet.current = true;
        console.log('设置初始滚动位置', savedScroll);
      }
    }
  };

  useEffect(() => {
    const loadAndRestore = async () => {
      await scrollerStore.updatePath(location.pathname);
      
      // 总是重新加载数据，确保显示最新内容
      console.log('加载论坛数据');
      
      // 清空旧数据
      clearPosts();
      
      // 加载第一页
      await fetchPosts();
      
      // 恢复滚动位置（但不恢复多页数据，用户滚动时自动加载）
      const last_scroller = scrollerStore.scrollStates[location.pathname] || 0;
      setScroller(last_scroller);
      bodyRef.current?.scrollTo(0, last_scroller);
      
      console.log('恢复滚动位置', last_scroller);
    };
    
    loadAndRestore();

    // 清理函数：组件卸载时清除定时器
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollerStore.setPage(getForumPage());
      
      // banner 高度已在 handleScroll 中实时保存，此处不需要再次保存
      
      // 离开页面时保存缓存
      saveForumCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

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
    if(bodyRef.current){
      const currentScroll = bodyRef.current.scrollTop;
      setScroller(currentScroll);
      scrollerStore.setScroller(currentScroll); // 使用当前值而不是 state
      
      // TODO: Banner 高度保存功能暂时禁用
      // if (carouselWrapperRef.current) {
      //   const currentBannerHeight = scrollerStore.bannerHeights[location.pathname];
      //   if (!currentBannerHeight || currentBannerHeight === 0) {
      //     const bannerImage = carouselWrapperRef.current.querySelector('.carousel-item') as HTMLImageElement;
      //     const bannerHeight = bannerImage?.offsetHeight || 0;
      //     if (bannerHeight > 0) {
      //       scrollerStore.setBannerHeight(bannerHeight);
      //       console.log('[Forum] 首次保存 banner 高度:', bannerHeight);
      //     }
      //   }
      // }
    }

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

  const handleSearchDebounce = useDebouncedCallback(handleSearch)
  const handleOnConfirmDebounce = useDebouncedCallback(handleOnConfirm)
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
        <div className="icon" onClick={handleSearchDebounce}>
          <Icon name="search" size={32} />
        </div>
      </div>

      <div className="forum-body" ref={setBodyRef} onScroll={handleScroll}>
        {/* 蒙版层 - 移到 body 内部 */}
        {showMore && <div className="overlay" onClick={handleCloseMore}></div>}
        
        {/* 轮播图 - 会被滚动隐藏 */}
        <div 
          className="carousel-wrapper" 
          ref={carouselWrapperRef}
          style={
            initialBannerHeight !== null 
              ? { 
                  height: `${initialBannerHeight}px`, 
                  minHeight: `${initialBannerHeight}px`,
                  maxHeight: `${initialBannerHeight}px`,
                  overflow: 'hidden',
                  transition: 'none' // 防止过渡动画
                } 
              : undefined
          }
        >
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
              <button onClick={handleOnConfirmDebounce}>确认</button>
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
                  key={`post-${index}-${post.id}`} 
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
                    <Icon name="like2" size={18} />
                    <span>{post.likes}</span>
                  </div>
                  <div className="stat-item">
                    <Icon name="post" size={18} />
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
          <Icon name="add" size={24} className="plus-icon" />
        </div>
        <Tabbar initialIndex={1} />
      </div>
    </div>
  );
};

export default Forum;
