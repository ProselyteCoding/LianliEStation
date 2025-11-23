import { useRef, useEffect, useState, useMemo } from "react";
import { Carousel, Empty } from "antd";
import { SkeletonList } from "../../components/SkeletonItem";
import { useLocation } from "react-router-dom";
import "./Market.scss";
import "../../Icon.scss";
import Tabbar from "../../components/Tabbar/Tabbar";
import Icon from "../../components/Icon/Icon";
import { ResponsiveImage } from "../../components/ResponsiveImage";
import MarketBanner from "../../assets/banner2.webp";
import ADInviting from "../../assets/ad3.3-logo.webp";
import logo from "../../assets/logo.webp";
import { useMainStore } from "../../store";
import { useNavigate } from "react-router-dom";
import { useDebounce,useDebouncedCallback } from '../../hooks/useDebounce'
import {useScrollerStore} from "../../store";
import { formatPrice, getCampusShort } from "../../utils/formatters";

const Market = () => {
  const [searchInputs, setSearchInputs] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const {
    goods,
    goodsFilters: filters,
    setGoodsFilters: setFilters,
    updateGoods,
    clearGoods,
    fetchGoods,
    isMarketLoading,
    isMarketLoadingMore,
    hasMoreGoods,
    getMarketPage,
    saveMarketCache,
  } = useMainStore();
  const scrollerStore = useScrollerStore()
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const carouselWrapperRef = useRef<HTMLDivElement | null>(null); // banner 容器引用
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialScrollSet = useRef(false); // 标记是否已设置初始滚动位置
  const navigate = useNavigate();
  const location = useLocation()
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

  // 计算商品项宽度（CSS calc 表达式）
  const getItemWidth = (columns: number) => {
    // padding: 6px on each side = 12px total
    // gap: 6px between items
    const paddingPx = 6 * 2; // 12px
    const gapPx = 6; // 6px
    
    return `calc((100vw - ${paddingPx}px - ${(columns - 1) * gapPx}px) / ${columns})`;
  };

  // 使用 useMemo 优化列数计算
  const elementsPerRow = useMemo(() => {
    const containerWidth = windowSize.width;
    
    // 简化的列数计算逻辑 - 扩大两列的范围，适配更多手机屏幕
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

    // console.log('屏幕宽度:', containerWidth, '列数:', columns);
    return columns;
  }, [windowSize.width]);

  // 计算分列后的商品数据
  const columnedGoods = useMemo(() => {
    const columns: typeof goods[] = Array.from({ length: elementsPerRow }, () => []);
    const columnHeights = new Array(elementsPerRow).fill(0);

    goods.forEach((item, index) => {
      // 找到当前高度最小的列
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
      columns[minHeightIndex].push(item);
      // 估算项目高度（图片高度 + 标题 + 底部信息 + 间距）
      // 基础高度：padding 8*2 + 间距 8 = 24px
      // 图片：有图约 200px，无图占位约 140px
      // 标题：有图时显示约 20px
      // 底部信息：约 30px
      const baseHeight = 24;
      const imageHeight = item.images[0] ? 200 : 140;
      const titleHeight = item.images[0] ? 20 : 0;
      const bottomHeight = 30;
      const estimatedHeight = baseHeight + imageHeight + titleHeight + bottomHeight;
      
      columnHeights[minHeightIndex] += estimatedHeight;
    });

    return { columns, columnHeights };
  }, [goods, elementsPerRow]);

  useEffect(() => {
    const loadAndRestore = async () => {
      await scrollerStore.updatePath(location.pathname);
      
      // 总是重新加载数据，确保显示最新内容
      console.log('加载商城数据');
      
      // 清空旧数据
      clearGoods();
      
      // 加载第一页
      await fetchGoods();
      
      // 恢复滚动位置（但不恢复多页数据，用户滚动时自动加载）
      const last_scroller = scrollerStore.scrollStates[location.pathname] || 0;
      setScroller(last_scroller);
      bodyRef.current?.scrollTo(0, last_scroller);
      
      console.log('恢复滚动位置', last_scroller);
    };
    
    loadAndRestore();

    // 监听窗口尺寸变化
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      // 清理滚动定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollerStore.setPage(getMarketPage());
      
      // banner 高度已在 handleScroll 中实时保存，此处不需要再次保存
      
      // 离开页面时保存缓存
      saveMarketCache();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 只在组件挂载时执行一次

  // useEffect(() => {
  //   return () => {
  //     if (scrollRef.current) {
  //       sessionStorage.setItem('market-scroll', scrollRef.current.scrollTop.toString());
  //     }
  //   };
  // }, []);

  // // 回来后恢复位置
  // useEffect(() => {
  //   const savedScroll = sessionStorage.getItem('market-scroll');
  //   if (scrollRef.current && savedScroll) {
  //     scrollRef.current.scrollTop = parseInt(savedScroll);
  //   }
  // }, []);

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
      //       console.log('[Market] 首次保存 banner 高度:', bannerHeight);
      //     }
      //   }
      // }
    }
    
    // 如果正在加载或没有更多内容，直接返回
    if (isMarketLoadingMore || !hasMoreGoods) {
      return;
    }
    
    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }    
    // 使用防抖，避免频繁触发
    scrollTimeoutRef.current = setTimeout(() => {
      // market-body滚动到底部时加载更多
      if (bodyRef.current) {
        const { scrollTop, clientHeight, scrollHeight } = bodyRef.current;
        
        // 简化逻辑：使用容器整体高度判断，提前 500px 触发
        const distanceToBottom = scrollHeight - scrollTop - clientHeight;
        
        if (distanceToBottom < 500) {
          updateGoods();
        }
      }
    }, 150); // 150ms 防抖延迟
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInputs(event.target.value);
  };

  const handleSearch = async () => {
    try {
      filters.searchTerm = searchInputs;
      await setFilters(filters);
      clearGoods();
      fetchGoods(); // 使用fetchGoods重新获取第一页
    } catch (error) {
      console.log(error);
    }
  };

  const handleOnConfirm = async () => {
    clearGoods();
    handleCloseMore();
    fetchGoods(); // 使用fetchGoods重新获取第一页
  };

  const handleCloseMore = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowMore(false);
      setIsClosing(false);
    }, 300); // 与动画时长一致
  };

  const handleSearchDebounce = useDebouncedCallback(handleSearch)
  const handleOnConfirmDebounce = useDebouncedCallback(handleOnConfirm)

  return (
    <div className="market-container">
      <div className="market-navbar">
        <div className="logo">
          <img src={logo} alt="logo" />
        </div>
        <input
          type="text"
          placeholder="搜好物"
          value={searchInputs}
          onChange={handleChange}
        />
        <div className="icon" onClick={handleSearchDebounce}>
          <Icon name="search" size={32} />
        </div>
      </div>

      <div className="market-body" ref={setBodyRef} onScroll={handleScroll}>
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
              src={MarketBanner}
              alt="schoolLogo"
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
              <div className="market-type">
                <div
                  className={
                    filters.goods_type === null ? "active-button" : "null"
                  }
                >
                  <button
                    onClick={async () => {
                      setFilters({ goods_type: null });
                      handleOnConfirm();
                    }}
                  >
                    全部
                  </button>
                </div>
                <div
                  className={
                    filters.goods_type === "sell" ? "active-button" : "sell"
                  }
                >
                  <button
                    onClick={async () => {
                      setFilters({ goods_type: "sell" });
                      handleOnConfirm();
                    }}
                  >
                    出
                  </button>
                </div>
                <div
                  className={
                    filters.goods_type === "receive" ? "active-button" : "receive"
                  }
                >
                  <button
                    onClick={async () => {
                      setFilters({ goods_type: "receive" });
                      handleOnConfirm();
                    }}
                  >
                    收
                  </button>
                </div>
              </div>
              <div className="commodity-type">
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
                      filters.tag === "学习资料" ? "active-button" : "null"
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
                      filters.tag === "生活用品"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "生活用品" });
                        handleOnConfirm();
                      }}
                    >
                      生活用品
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "代办跑腿"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "代办跑腿" });
                        handleOnConfirm();
                      }}
                    >
                      代办跑腿
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "零食"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "零食" });
                        handleOnConfirm();
                      }}
                    >
                      零食
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
                      咨询答疑
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "账号会员"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "账号会员" });
                        handleOnConfirm();
                      }}
                    >
                      账号会员
                    </button>
                  </div>
                  <div
                    className={
                      filters.tag === "账号会员"
                        ? "active-button"
                        : "null"
                    }
                  >
                    <button
                      onClick={async () => {
                        setFilters({ tag: "数码电子" });
                        handleOnConfirm();
                      }}
                    >
                      数码电子
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

        {showMore && (
          <div className={`market-more ${isClosing ? 'closing' : ''}`}>
            <div className="price">
              <div className="price-title">
                <span>价格区间</span>
              </div>
              <div className="price-unit">
                <div className="price-low">
                  <input
                    type="text"
                    placeholder="最低价格"
                    onChange={(e) => {
                      setFilters({
                        priceRange: [
                          parseInt(e.target.value),
                          filters.priceRange[1],
                        ],
                      });
                    }}
                  />
                </div>
                -
                <div className="price-high">
                  <input
                    type="text"
                    placeholder="最高价格"
                    onChange={(e) => {
                      setFilters({
                        priceRange: [
                          filters.priceRange[0],
                          parseInt(e.target.value),
                        ],
                      });
                    }}
                  />
                </div>
              </div>
            </div>

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
                    filters.tag === "代办跑腿" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "代办跑腿" });
                  }}
                >
                  代办跑腿
                </div>
                <div
                  className={
                    filters.tag === "生活用品" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "生活用品" });
                  }}
                >
                  生活用品
                </div>
                <div
                  className={
                    filters.tag === "零食" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "零食" });
                  }}
                >
                  零食
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
                    filters.tag === "账号会员" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "账号会员" });
                  }}
                >
                  账号会员
                </div>
                <div
                  className={
                    filters.tag === "数码电子" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "数码电子" });
                  }}
                >
                  数码电子
                </div>
                <div
                  className={
                    filters.tag === "其他" ? "item-active" : "item"
                  }
                  onClick={() => {
                    setFilters({ tag: "其他" });
                    console.log(filters);
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
                    console.log(filters);
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

          <div
            className="content"
            ref={scrollRef}
          style={
            { "--elements-per-row": elementsPerRow } as React.CSSProperties
          }
        >
          {goods.length === 0 ? (
            isMarketLoading ? (
              // 正在加载中，显示骨架屏
              <SkeletonList columns={elementsPerRow} count={8} gap={6} padding={6} />
            ) : (
              // 加载完成但没有数据，显示空状态
              <div className="empty-container">
                <Empty 
                  description="没有这一种类的商品"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )
          ) : (
            <>
              {columnedGoods.columns.map((column, columnIndex) => (
                <div key={`column-${columnIndex}`} className="masonry-column" style={{ width: getItemWidth(elementsPerRow) }}>
                  {column.map((item, itemIndex) => (
                    <div
                      className="commodity-item"
                      key={`${columnIndex}-${itemIndex}-${item.id}`}
                      onClick={() => {
                        navigate(`/market/${item.id}`);
                      }}
                    >
                      <div className="commodity-img">
                        {item.images[0] ? (
                          <ResponsiveImage
                            src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${item.images[0]}`}
                            alt={item.title}
                            size="medium"
                          />
                        ) : (
                          <div className="commodity-img-placeholder">
                            <span 
                              className="placeholder-text"
                              data-length={
                                item.title.length <= 6 ? 'short' :
                                item.title.length <= 12 ? 'medium' :
                                item.title.length <= 20 ? 'long' : 'extra-long'
                              }
                            >
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.images[0] && <div className="commodity-title">{item.title}</div>}
                      <div className="commodity-bottom">
                        <div className="commodity-price">{formatPrice(item.price)}</div>
                        <div className="commodity-tags">
                          {item.goods_type && (
                            <div className={`commodity-type ${item.goods_type === 'sell' ? 'type-sell' : 'type-receive'}`}>
                              {item.goods_type === 'sell' ? '出' : '收'}
                            </div>
                          )}
                          {item.campus_id && (
                            <div className="commodity-campus">
                              {getCampusShort(item.campus_id)}
                            </div>
                          )}
                          {item.tag && item.tag !== "商品标签" && (
                            <div className="commodity-tag">{item.tag}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* 加载状态提示 - 移到 content 外部 */}
        {goods.length > 0 && (
          <>
            {isMarketLoadingMore && (
              <div className="loading-more">
                <span>加载中...</span>
              </div>
            )}
            
            {/* 没有更多内容提示 */}
            {!hasMoreGoods && (
              <div className="no-more">
                <span>没有更多商品了</span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="market-tabbar">
        <div className="custom-float-button" onClick={() => navigate("/publish/market-publish-choice")}>
          <Icon name="add" size={24} className="plus-icon" />
        </div>
        <Tabbar initialIndex={0} />
      </div>
    </div>
  );
};

export default Market;
