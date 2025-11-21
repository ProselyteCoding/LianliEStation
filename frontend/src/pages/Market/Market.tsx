import { useRef, useEffect, useState, useMemo } from "react";
import { Carousel, Image, Skeleton, Empty } from "antd";
import { useLocation } from "react-router-dom";
import "./Market.scss";
import "../../Icon.scss";
import Tabbar from "../../components/Tabbar/Tabbar";
import Icon from "../../components/Icon/Icon";
import MarketBanner from "../../assets/banner2.png";
import ADInviting from "../../assets/ad3.3-logo.png";
import logo from "../../assets/logo.png";
import takePlace from "../../assets/takePlace.png";
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
  const [initialBannerHeight, setInitialBannerHeight] = useState<number | null>(null); // banner 初始高度

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
        
        // 根据滚动位置计算 banner 应该显示的高度
        const savedBannerHeight = scrollerStore.getBannerHeight();
        if (savedBannerHeight > 0) {
          // 假设 banner 最大高度为 200px（根据实际情况调整）
          const maxBannerHeight = 200;
          // 如果保存的滚动位置超过 banner 高度，banner 应该被完全隐藏或压缩
          const calculatedHeight = savedBannerHeight > 0 ? savedBannerHeight : maxBannerHeight;
          setInitialBannerHeight(calculatedHeight);
          console.log('设置初始 banner 高度', calculatedHeight);
        }
      }
    }
  };

  // 获取当前的根字体大小（rem 基准值）
  const getRemBase = () => {
    const fontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return fontSize || 37.5; // 默认 37.5px (对应 375px 屏幕宽度)
  };

  // 计算商品项宽度（CSS calc 表达式）
  const getItemWidth = (columns: number) => {
    // padding: 6px on each side = 12px total = 0.32rem
    // gap: 6px between items = 0.16rem
    const paddingRem = (6 / 37.5) * 2; // 0.32rem
    const gapRem = 6 / 37.5; // 0.16rem
    
    return `calc((100vw - ${paddingRem}rem - ${columns - 1} * ${gapRem}rem) / ${columns})`;
  };

  // 使用 useMemo 优化列数计算
  const elementsPerRow = useMemo(() => {
    // 直接在这里调用 getRemBase，避免 lint 警告
    const remBase = getRemBase();
    
    // 将 rem 单位转换为实际 px
    const paddingPx = (6 / 37.5) * remBase * 2; // 左右 padding 各 6px
    const gapPx = (6 / 37.5) * remBase; // gap 6px
    
    const containerWidth = windowSize.width - paddingPx;
    const minItemWidth = (140 / 37.5) * remBase; // 最小商品项宽度 140px
    const maxItemWidth = (220 / 37.5) * remBase; // 最大商品项宽度 220px

    // 根据屏幕宽度设置响应式断点
    let columns;
    if (containerWidth < (400 / 37.5) * remBase) {
      // 小屏幕：2列
      columns = 2;
    } else if (containerWidth < (600 / 37.5) * remBase) {
      // 中小屏幕：3列
      columns = 3;
    } else if (containerWidth < (800 / 37.5) * remBase) {
      // 中等屏幕：4列
      columns = 4;
    } else {
      // 大屏幕：根据最小宽度动态计算
      columns = Math.floor((containerWidth + gapPx) / (minItemWidth + gapPx));
    }

    columns = Math.max(2, Math.min(columns, 6)); // 限制在2-6列之间

    // 验证计算的宽度是否合理
    const availableWidth = containerWidth - (columns - 1) * gapPx;
    const itemWidth = availableWidth / columns;

    // 如果计算出的宽度太大，增加列数
    if (itemWidth > maxItemWidth && columns < 6) {
      columns = Math.min(6, Math.floor((containerWidth + gapPx) / (maxItemWidth + gapPx)));
    }

    // 如果计算出的宽度太小，减少列数
    if (itemWidth < minItemWidth && columns > 2) {
      columns = Math.max(2, columns - 1);
    }

    return columns;
  }, [windowSize.width]);

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

    // 保存 carousel ref 的引用，避免清理函数中的 ref 警告
    const carouselWrapper = carouselWrapperRef.current;

    return () => {
      window.removeEventListener("resize", handleResize);
      // 清理滚动定时器
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollerStore.setPage(getMarketPage());
      
      // 保存当前 banner 高度
      const bannerHeight = carouselWrapper?.offsetHeight || 0;
      scrollerStore.setBannerHeight(bannerHeight);
      console.log('保存 banner 高度', bannerHeight);
      
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
        const { scrollHeight, scrollTop, clientHeight } = bodyRef.current;
        // 判断是否滚动到底部（提前100px触发，确保更早加载）
        if (scrollTop + clientHeight >= scrollHeight - 100) {
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
          style={initialBannerHeight !== null ? { height: `${initialBannerHeight}px`, overflow: 'hidden' } : undefined}
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
            <div className="empty-container">
              <Empty 
                description="没有这一种类的商品"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <>
              {goods.map((item) => (
                <div
                  className="commodity-item"
                  key={item.id}
                  onClick={() => {
                    navigate(`/market/${item.id}`);
                  }}
                  style={{
                    width: getItemWidth(elementsPerRow),
                    minHeight: 'fit-content',
                  }}
                >
                  <div className="commodity-img">
                    {item.images[0] ? (
                      <Image
                        src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${item.images[0]}`}
                        alt="商品图片"
                        preview={false}
                        placeholder={
                          <div style={{ width: '100%', aspectRatio: '1.3' }}>
                            <Skeleton.Input active style={{ width: '100%', height: '100%' }} />
                          </div>
                        }
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
              
              {/* 加载状态提示 */}
              {isMarketLoadingMore && (
                <div className="loading-more">
                  <span>加载中...</span>
                </div>
              )}
              
              {/* 没有更多内容提示 */}
              {!hasMoreGoods && goods.length > 0 && (
                <div className="no-more">
                  <span>没有更多商品了</span>
                </div>
              )}
            </>
          )}
        </div>
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
