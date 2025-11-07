import Navbar from "../../../components/Navbar/Navbar"
import React, { useEffect, useRef, useState } from "react"
import { useRecordStore } from "../../../store"
import { Card, Dropdown, Empty } from "antd";
import type { MenuProps } from "antd";
import NoticeModal from "../../../components/NoticeModal/NoticeModal"
import { useUserStore } from "../../../store"
import { px2rem } from "../../../utils/rem"
import "./Favorites.scss"
import takePlace from "../../../assets/takePlace.png"
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'
import {useScrollerStore} from "../../../store";
import { useLocation } from "react-router-dom";
import Icon from "../../../components/Icon/Icon";

type checkBox = { [number: number]: boolean }

const Favorites: React.FC = () => {
  const { favoritesGoods, favoritePosts, getFavorites, removeFavoriteGoods, removeFavoritePost } = useRecordStore()
  const { isAuthenticated } = useUserStore()
  const [checked, setChecked] = useState<checkBox>({})
  const [isVisible, setIsVisible] = useState(false)
  const [isPosts, setIsPosts] = useState(false)
  const [currentType, setCurrentType] = useState("商品");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const bodyRef = useRef<HTMLDivElement|null>(null)
  const [scroller,setScroller] = useState<number>(0)
  const scrollerStore = useScrollerStore()
  const location = useLocation()

  useEffect(() => {
    scrollerStore.updatePath(location.pathname)

    if (isAuthenticated) {
      getFavorites()
      console.log(favoritesGoods, favoritePosts)

      const last_scroller = scrollerStore.restoreSinglePage()
      bodyRef.current?.scrollTo(0,last_scroller)
    }
  }, [isAuthenticated, refreshTrigger])

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            setIsPosts(false);
            setCurrentType("商品");
            setChecked({}); // 切换类型时清空选中状态
          }}
        >
          商品
        </div>
      ),
      icon: <Icon name="goods" size={18} />,
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            setIsPosts(true);
            setCurrentType("帖子");
            setChecked({}); // 切换类型时清空选中状态
          }}
        >
          帖子
        </div>
      ),
      icon: <Icon name="post" size={18} />,
    },
  ];

  const handleOnClick = () => {
    setIsVisible(!isVisible)
  }

  const handleCheck = (id: number) => {
    setChecked({ ...checked, [id]: !checked[id] })
  }
  
  const handleOnDelete = async () => {
    const ids = Object.keys(checked)
      .filter(id => checked[parseInt(id)])
      .map(id => parseInt(id))

    if (ids.length === 0) {
      return;
    }

    try {
      if (isPosts) {
        await Promise.all(ids.map(id => removeFavoritePost(id)))
      } else {
        await Promise.all(ids.map(id => removeFavoriteGoods(id)))
      }

      // 清空选中状态
      setChecked({});
      // 触发重新获取收藏数据
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('删除收藏失败:', error);
    }
  }

  const handleScroll = () =>{
    setScroller(bodyRef.current?.scrollTop || 0)
    scrollerStore.setScroller(bodyRef.current?.scrollTop || 0)
  }

  const handleOnDeleteDebounce = useDebouncedCallback(handleOnDelete)

  return (
    <div className="favorites-container">
      {!isAuthenticated && <NoticeModal type="login"/>}
      <div className="header">
        <Navbar title="收藏" backActive={true} backPath="/user" />
      </div>

      <div className="body">
        <div className="select-container">
          <div className="select-item">
            <Dropdown menu={{ items }}>
              <div onClick={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={isPosts ? "post" : "goods"} size={20} />
                {currentType}
              </div>
            </Dropdown>
          </div>
          <div className="select-item" onClick={() => handleOnClick()}>
            <div className="select-item-btn">
              <Icon name="manage" size={20} />
              管理
            </div>
          </div>
        </div>

        <div className="content" ref={bodyRef} onScroll={handleScroll}>
          {
            !isPosts ? (
              favoritesGoods.length === 0 ? (
                <div className="favorites-empty">
                  <Empty
                    description="还没有收藏商品"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                favoritesGoods.map((goods: any) => (
                  <div className='item' key={goods.id}>

                    {
                      isVisible ? <div className={`item-delete ${checked[goods.id] ? 'checked' : ''}`} key={goods.id} onClick={() => handleCheck(goods.id)} /> : null
                    }

                    <Card className="item-description" title={goods.title} hoverable>
                      <div className="item-content">
                        <div className='item-img'>
                          <img
                            src={
                              goods.images && goods.images[0]
                                ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${goods.images[0]}`
                                : takePlace
                            }
                            alt=""
                          />
                        </div>
                        <div className="item-info">
                          <div className="item-detail">
                            {goods.content}
                          </div>
                          <div className='item-bottom'>
                            <div className='goods-price'>
                              {goods.price}r
                            </div>
                            <div className='item-tag'>
                              {goods.tag}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              )
            ) : (
              favoritePosts.length === 0 ? (
                <div className="favorites-empty">
                  <Empty
                    description="还没有收藏帖子"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              ) : (
                favoritePosts.map((post: any, index: number) => (
                  <div className='item' key={index}>

                    {
                      isVisible ? <div className={`item-delete ${checked[post.id] ? 'checked' : ''}`} key={post.id} onClick={() => handleCheck(post.id)} /> : null
                    }

                    <Card className="item-description" title={post.title} hoverable>
                      <div className="item-content">
                        <div className='item-img'>
                          <img
                            src={
                              post.images && post.images[0]
                                ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${post.images[0]}`
                                : takePlace
                            }
                            alt=""
                          />
                        </div>
                        <div className="item-info">
                          <div className="item-detail">
                            {post.content}
                          </div>
                          {post.tag && (
                            <div className="item-bottom item-bottom-post">
                              <div className="item-tag">{post.tag}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  </div>
                ))
              )
            )
          }

        </div>
      </div>

      {
        isVisible ? (
          <div className="footer">
            <div className="delete-button">
              <button onClick={() => handleOnDeleteDebounce()}>删除</button>
            </div>
          </div>) : null
      }

    </div>
  )
}

export default Favorites;
