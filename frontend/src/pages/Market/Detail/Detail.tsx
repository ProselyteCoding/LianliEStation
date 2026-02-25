import { useMainStore, useUserStore,useRecordStore } from "../../../store";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // 使用 useParams 从路由获取参数
import { timeFormat, formatPrice, getCampusShort, getCampusName } from "../../../utils/formatters";
import { message, Carousel } from "antd";
import { ResponsiveImage } from "../../../components/ResponsiveImage";
import "./Detail.scss";
import "../../../Icon.scss";
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'
import Icon from "../../../components/Icon/Icon";

interface Goods {
  id: number;
  title: string;
  content: string | null;
  price: number;
  campus_id: number;
  status: "active" | "inactive" | "deleted";
  goods_type: "receive" | "sell";
  tag: string | null;
  author_id: number;
  likes: number;
  complaints: number;
  created_at: string;
  images: string[];
  author_qq_id: string | null;
  author_nickname: string | null;
  author_avatar: string | null;
  author_credit: number;
}

const Detail = () => {
  const { goods, changeGoodsResponse, updateGoodsItem } =
    useMainStore();
  const { currentUser, updateLikesComplaints,fetchUserProfile,updateFavorite } = useUserStore();

  const param = useParams();
  const navigate = useNavigate();
  const ID = param.goodsId; // 通过路由参数获取商品id

  const [currentGoods, setCurrentGoods] = useState<Goods>(); // 当前详情商品
  const [isMine, setIsMine] = useState("user"); // 当前互动类型 user/manage
  const [isLiked, setIsLiked] = useState(false); // 当前商品是否已点赞
  const [isDisliked, setIsDisliked] = useState(false); // 当前商品是否已踩
  const [isStared, setIsStared] = useState(false); // 当前商品是否已收藏
  const { addFavoriteGoods,removeFavoriteGoods } = useRecordStore();

  const handleIsRecorded = () => {
    if (currentUser && currentGoods) {
      if (
        currentUser.likes.find((item) => {
          return (
            item.targetId === currentGoods.id && item.targetType === "goods"
          );
        })
      ) {
        setIsLiked(true);
        console.log("已点赞");
      } else {
        setIsLiked(false);
        console.log("未点赞");
      }

      if (
        currentUser.complaints.find((item) => {
          return (
            item.targetId === currentGoods.id && item.targetType === "goods"
          );
        })
      ) {
        setIsDisliked(true);
        console.log("已举报");
      } else {
        setIsDisliked(false);
        console.log("未举报");
      }

      if (
        currentUser.favorites.goods.find((item) => {
          return (
            item.id === currentGoods.id
          );
        })
      ){
        setIsStared(true);
        console.log("已收藏");
      } else {
        setIsStared(false);
        console.log("未收藏");
      }
    }

    // if (currentUser && currentGoods) {
    //   if (
    //     currentUser.favorites.find((item) => {
    //       return (
    //         item.targetId === currentGoods.id 
    //       );
    //     })
    //   ) {
    //     setIsStared(true);
    //     console.log("已收藏");
    //   } else {
    //     setIsStared(false);
    //     console.log("未收藏");
    //   }
    // }

  };

  const fetchData = () => {
    const numericID = Number(ID);
    setCurrentGoods(goods.find((item) => item.id === numericID));
  };

  useEffect(() => {
    fetchData();
    handleIsRecorded();
    console.log(currentUser);
  }, [currentUser, currentGoods, isLiked, isDisliked,goods]);

  // 点击复制按钮，复制发布者QQ号到剪贴板
  const handleCopy = () => {
    if (currentGoods?.author_qq_id) {
      navigator.clipboard
        .writeText(currentGoods?.author_qq_id)
        .then(() => {
          console.log("QQ号已复制到剪贴板");
          message.success("QQ号已复制到剪贴板");
        })
        .catch((err) => {
          console.error("复制过程出错: ", err);
          message.error("复制过程出错");
        });
    } else {
      console.error("未获取到当前用户QQ号");
      message.error("未获取到当前用户QQ号");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    message.success("链接已复制到剪贴板");
  }

  // 处理点赞
  const handleLike = async () => {
    if (!currentGoods) return;
    // 已点赞
    if (isLiked) {
      const response = await changeGoodsResponse(
        "like",
        currentGoods?.id.toString(),
        -1
      );
      if (response === "success") {
        setIsLiked(false); // 设置为未点赞
        updateGoodsItem("like", currentGoods.id, -1);
        updateLikesComplaints("goods", "like", currentGoods.id, -1);
      } else {
        message.error("取消点赞失败");
      }
    }
    // 未点赞
    else {
      const response = await changeGoodsResponse(
        "like",
        currentGoods?.id.toString(),
        1
      );
      if (response === "success") {
        setIsLiked(true); // 设置为已点赞
        updateGoodsItem("like", currentGoods.id, 1);
        updateLikesComplaints("goods", "like", currentGoods.id, 1);
      } else {
        message.error("点赞失败");
      }
    }
  };

  // 处理踩 (点击提交后触发而不是点击图标触发)
  const handleDislike = async () => {
    if (!currentGoods) return;
    // 已踩
    if (isDisliked) {
      const response = await changeGoodsResponse(
        "complaint",
        currentGoods?.id.toString(),
        -1
      );
      if (response === "success") {
        setIsDisliked(false); // 设置为未踩
        updateGoodsItem("complaint", currentGoods.id, -1);
        updateLikesComplaints("goods", "complaint", currentGoods.id, -1);
      } else {
        message.error("取消举报失败");
      }
    }
    // 未踩
    else {
      navigate(`/market/${ID}/appeal/${currentGoods?.title}`);
    }
  };

  const handleStar = () => {
    if (currentGoods && !isStared) {
      addFavoriteGoods(currentGoods.id).then((status) => {
        if (status === 201) {
          message.success("已加入收藏");
          setIsStared(true);
          updateFavorite("goods",currentGoods.id,1);
        } else {
          message.error("加入收藏失败");
        }
      });
    }
    else if(currentGoods && isStared){
      removeFavoriteGoods(currentGoods.id).then((status) => {
        if (status === 200) {
          message.success("已取消收藏");
          setIsStared(false);
          updateFavorite("goods",currentGoods.id,-1);
        } else {
          message.error("取消收藏失败");
        }
      });
    }
  }

  const handleLikeDebounce = useDebouncedCallback(handleLike,100)
  const handleDislikeDebounce = useDebouncedCallback(handleDislike,100)
  const handleStarDebounce = useDebouncedCallback(handleStar,100)

  return (
    <div className="detail-container">
      <div className="detail-navbar">
        <Icon
          name="left"
          size={32}
          className="navbar-icon"
          onClick={() => navigate("/market")}
        />
        <Icon
          name="share"
          size={32}
          className="navbar-icon"
          onClick={handleShare}
        />
      </div>
      <div className="detail-slider">
        <Carousel>
          {currentGoods?.images && currentGoods.images.length > 0 ? (
            currentGoods.images.map((img, index) => (
              <div key={index} className="carousel-item">
                <ResponsiveImage
                  className="slider-item"
                  src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${img}`}
                  alt={`image-${index}`}
                  size="large"
                />
              </div>
            ))
          ) : (
            <div className="carousel-item">
              <div className="commodity-img-placeholder-large">
                <span 
                  className="placeholder-text-large"
                  data-length={
                    (currentGoods?.title || '').length <= 6 ? 'short' :
                    (currentGoods?.title || '').length <= 12 ? 'medium' :
                    (currentGoods?.title || '').length <= 20 ? 'long' : 'extra-long'
                  }
                >
                  {currentGoods?.title || '暂无图片'}
                </span>
              </div>
              </div>
            )}
          </Carousel>
      </div>
      <div className="detail-title">{currentGoods?.title}</div>
      <div className="detail-profile">
        <div className="detail-price">￥{formatPrice(currentGoods?.price || 0)}</div>
        <div className={`detail-type ${currentGoods?.goods_type === 'sell' ? 'type-sell' : 'type-receive'}`}>
          {currentGoods?.goods_type === "sell" ? "出" : "收"}
        </div>
        {currentGoods?.campus_id && (
          <div className="detail-campus">
            {getCampusName(currentGoods.campus_id)}
          </div>
        )}
        {currentGoods?.tag && (
          <div className="detail-tag">{currentGoods.tag}</div>
        )}
      </div>
      <div className="detail-content">{currentGoods?.content}</div>
      <div className="detail-author">
        <img
          className="author-icon"
          src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${
            currentGoods?.author_avatar
          }`}
          alt="发布者头像"
        />
        <div className="author-name">{currentGoods?.author_nickname}</div>
        <div className="author-credit">{currentGoods?.author_credit}分</div>
        <div className="author-time">
          {timeFormat(currentGoods?.created_at, "MM-DD HH:mm")}
        </div>
      </div>
      <div className="detail-alternative">
        {isMine === "user" && (
          <div className="alter-user">
            <div className="user-like">
              <Icon
                name={isLiked ? 'liked' : 'like'}
                size={32}
                className="like-icon"
                onClick={handleLikeDebounce}
              />
              <div className="like-text">{currentGoods?.likes}</div>
            </div>
            <div className="user-dislike" onClick={() => handleDislikeDebounce()}>
              <Icon
                name={isDisliked ? 'disliked' : 'dislike'}
                size={32}
                className="dislike-icon"
              />
              <div className="dislike-text">{currentGoods?.complaints}</div>
            </div>
          </div>
        )}
        {isMine === "manage" && (
          <div className="alter-manage">
            <div className="manage-like" onClick={handleLikeDebounce}>
              <Icon
                name={isLiked ? 'like-true' : 'like-false'}
                size={32}
                className="like-icon"
              />
              <div className="like-text">{currentGoods?.likes}</div>
            </div>
            <div className="manage-dislike" onClick={handleDislikeDebounce}>
              <Icon
                name={isDisliked ? 'dislike-true' : 'dislike-false'}
                size={32}
                className="dislike-icon"
              />
              <div className="dislike-text">{currentGoods?.complaints}</div>
            </div>
            <Icon name="drop" size={24} className="manage-drop" />
          </div>
        )}
      </div>
      <div className="detail-btn">
        <div className="star-btn" onClick={handleStarDebounce}>
          <Icon name={isStared ? 'favorited' : 'favorite'} size={24} className="starBtn-icon" />
          <div className="starBtn-text">加入收藏</div>
        </div>
        <div className="contact-btn" onClick={handleCopy}>
          <Icon name="copy" size={24} className="qqBtn-icon" />
          <div className="qqBtn-text">立即联系！</div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
