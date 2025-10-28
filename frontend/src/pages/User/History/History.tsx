import Navbar from "../../../components/Navbar/Navbar";
import { useEffect, useState, useRef } from "react";
import { useRecordStore, useUserStore } from "../../../store";
import takePlace from "../../../assets/takePlace.png";
import { Card, Dropdown, Empty, message } from "antd";
import type { MenuProps } from "antd";
import NoticeModal from "../../../components/NoticeModal/NoticeModal";
import { useNavigate } from "react-router-dom";
import { px2rem } from "../../../utils/rem";
import "./History.scss";

type checkBox = { [number: number]: boolean };

const History = () => {
  const {
    historyGoods,
    getHistory,
    removeHistoryGoods,
    historyPosts,
    removeHistoryPost,
    clear,
  } = useRecordStore();
  const { isAuthenticated } = useUserStore();
  const [checked, setChecked] = useState<checkBox>({});
  const [isVisible, setIsVisible] = useState(false);
  const [isPosts, setIsPosts] = useState(false);
  const [currentType, setCurrentType] = useState("商品");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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
      icon: <i className="iconfont icon-goods"></i>,
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
      icon: <i className="iconfont icon-post"></i>,
    },
  ];

  useEffect(() => {
    if (isAuthenticated) {
      getHistory();
    }
  }, [isAuthenticated, refreshTrigger]); // refreshTrigger 变化时重新获取历史记录

  useEffect(() => {
    const handleBeforeUnload = () => {
      clear();
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [clear]);

  const handleOnClick = () => {
    setIsVisible(!isVisible);
  };

  const handleCheck = (id: number) => {
    setChecked({ ...checked, [id]: !checked[id] });
  };
  
  const handleOnComplete = async () => {
    const ids = Object.keys(checked)
      .filter(id => checked[parseInt(id)])
      .map(id => parseInt(id))

    if (ids.length === 0) {
      message.warning('请先选择要标记为交易完成的商品');
      return;
    }

    try {
      await Promise.all(ids.map(id => removeHistoryGoods(id, 'transaction')))
      message.success('交易已完成');
      setChecked({});
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('标记失败:', error);
      message.error('标记失败，请重试');
    }
  }

  const handleOnEdit = () => {
    const ids = Object.keys(checked)
      .filter(id => checked[parseInt(id)])
      .map(id => parseInt(id))

    // 检查选中数量
    if (ids.length === 0) {
      message.warning('请先选择要修改的内容');
      return;
    }

    if (ids.length > 1) {
      if (isPosts) {
        message.warning('一次只能修改一个帖子的信息');
      } else {
        message.warning('一次只能修改一件商品的信息');
      }
      return;
    }

    if (isPosts) {
      // 帖子修改功能
      const selectedPost = historyPosts.find(post => post.id === ids[0]);

      if (!selectedPost) {
        message.error('未找到选中的帖子信息');
        return;
      }

      // 跳转到帖子发布页面，传递帖子信息和编辑标志
      navigate('/publish/forum-publish', {
        state: {
          isEdit: true,
          post_id: selectedPost.id,
          title: selectedPost.title,
          content: selectedPost.content,
          tag: selectedPost.tag,
          status: selectedPost.status || 'active',
          campus_id: selectedPost.campus_id,
          existingImages: selectedPost.images || []
        }
      });
      return;
    }

    // 获取选中的商品信息
    const selectedGoods = historyGoods.find(goods => goods.id === ids[0]);

    if (!selectedGoods) {
      message.error('未找到选中的商品信息');
      return;
    }

    // 跳转到 Template 页面，传递商品信息和编辑标志
    navigate('/publish/market-publish-basic', {
      state: {
        isEdit: true,
        goods_id: selectedGoods.id,
        title: selectedGoods.title,
        content: selectedGoods.content,
        price: selectedGoods.price,
        tag: selectedGoods.tag,
        post_type: selectedGoods.goods_type || 'sell',
        status: selectedGoods.status || 'active',
        campus_id: selectedGoods.campus_id,
        existingImages: selectedGoods.images || []
      }
    });
  }
  
  const handleOnDelete = async () => {
    const ids = Object.keys(checked)
      .filter(id => checked[parseInt(id)])
      .map(id => parseInt(id))

    if (ids.length === 0) {
      message.warning('请先选择要删除的内容');
      return;
    }

    try {
      if (isPosts) {
        await Promise.all(ids.map(id => removeHistoryPost(id)))
      } else {
        await Promise.all(ids.map(id => removeHistoryGoods(id)))
      }
      
      message.success('删除成功');
      setChecked({});
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('删除失败:', error);
      message.error('删除失败');
    }
  }


  return (
    <div className="history-container">
      {!isAuthenticated && <NoticeModal type="login"/>}
      <div className="header">
        <Navbar title="历史" backActive={true} backPath="/user" />
      </div>

      <div className="body">
        <div className="select-container">
          <div className="select-item">
            <Dropdown menu={{ items }}>
              <div onClick={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <i className="iconfont icon-more"></i>
                {currentType}
              </div>
            </Dropdown>
          </div>
          <div className="select-item" onClick={() => handleOnClick()}>
            <div className="select-item-btn">
              <i className="iconfont icon-manage"></i>
              管理
            </div>
          </div>
        </div>

        <div className="content">
          {!isPosts ? (
            historyGoods.length === 0 ? (
              <div className="history-empty">
                <Empty
                  description="还没有发布过商品"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              historyGoods.map((goods) => (
                <div
                  className="item"
                  key={goods.id}
                  ref={scrollRef}
                >
                  {isVisible ? (
                    <div
                      className={`item-delete ${checked[goods.id] ? 'checked' : ''}`}
                      key={goods.id}
                      onClick={() => handleCheck(goods.id)}
                    />
                  ) : null}
                  <Card className="item-description" title={goods.title} hoverable>
                    <div className="item-content">
                      <div className="item-img">
                        <img
                          src={
                            goods.images[0]
                              ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${goods.images[0]}`
                              : takePlace
                          }
                          alt=""
                        />
                      </div>
                      <div className="item-info">
                        <div className="item-detail">{goods.content}</div>
                        <div className="item-bottom">
                          <div className="goods-price">{goods.price}r</div>
                          <div className="item-tag">{goods.tag}</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )
          ) : (
            historyPosts.length === 0 ? (
              <div className="history-empty">
                <Empty
                  description="还没有发布过帖子"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : (
              historyPosts.map((post) => (
                <div
                  className="item"
                  key={post.id}
                  ref={scrollRef}
                >
                  {isVisible ? (
                    <div
                      className={`item-delete ${checked[post.id] ? 'checked' : ''}`}
                      key={post.id}
                      onClick={() => handleCheck(post.id)}
                    />
                  ) : null}
                  <Card className="item-description" title={post.title} hoverable>
                    <div className="item-content">
                      <div className="item-img">
                        <img
                          src={
                            post.images[0]
                              ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${post.images[0]}`
                              : takePlace
                          }
                          alt=""
                        />
                      </div>
                      <div className="item-info">
                        <div className="item-detail">{post.content}</div>
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
          )}
        </div>
      </div>

      {
        isVisible ? (
        <div className="footer">
          <div className="footer-buttons">
            {!isPosts ? (
              <>
                <button className="btn-complete" onClick={() => handleOnComplete()}>
                  交易完成
                </button>
                <button className="btn-edit" onClick={() => handleOnEdit()}>
                  修改商品
                </button>
                <button className="btn-delete" onClick={() => handleOnDelete()}>
                  删除商品
                </button>
              </>
            ) : (
              <>
                <button className="btn-edit" onClick={() => handleOnEdit()}>
                  修改帖子
                </button>
                <button className="btn-delete" onClick={() => handleOnDelete()}>
                  删除帖子
                </button>
              </>
            )}
          </div>
        </div>) : null
      }

    </div>
  );
};

export default History;
