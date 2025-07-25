import { useMainStore, useUserStore } from "../../../store";
import { useState, useEffect, useRef, use } from "react";
import { useNavigate, useParams } from "react-router-dom"; // 使用 useParams 从路由获取参数
import { timeFormat } from "../../../utils/formatters";
import { getCampusName } from "../../../utils/formatters";
import { message } from "antd";
import "./Detail.scss";
import copy from "../../../assets/copy-black.svg";
import stars from "../../../assets/favorites-black.svg";
import like_true from "../../../assets/like-true.svg";
import like_false from "../../../assets/like-false.svg";
import dislike_true from "../../../assets/dislike-true.svg";
import dislike_false from "../../../assets/dislike-false.svg";
import drop from "../../../assets/drop-black.svg";
import share from "../../../assets/share-black.svg";
import left from "../../../assets/left-black.svg";
import takePlace from "../../../assets/takePlace.png";

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
  const { currentUser, updateLikesComplaints } = useUserStore();

  const param = useParams();
  const navigate = useNavigate();
  const ID = param.goodsId; // 通过路由参数获取商品id

  const [currentGoods, setCurrentGoods] = useState<Goods>(); // 当前详情商品
  const [currentIndex, setCurrentIndex] = useState(0); // 当前图片索引
  const [isMine, setIsMine] = useState("user"); // 当前互动类型 user/manage
  const [isLiked, setIsLiked] = useState(false); // 当前商品是否已点赞
  const [isDisliked, setIsDisliked] = useState(false); // 当前商品是否已踩
  const touchStartX = useRef(0); // 记录触摸起始位置
  const touchEndX = useRef(0); // 记录触摸结束位置

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
    }
  };

  const fetchData = () => {
    const numericID = Number(ID);
    setCurrentGoods(goods.find((item) => item.id === numericID));
  };

  useEffect(() => {
    fetchData();
    handleIsRecorded();
    // console.log(currentGoods);
    // console.log(currentUser);
  }, [currentUser, currentGoods, isLiked, isDisliked,  goods]);

  // 处理滑动事件
  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX; // 记录触摸起始位置
  };
  const handleTouchMove = (e: any) => {
    touchEndX.current = e.touches[0].clientX; // 记录触摸结束位置
  };
  const handleTouchEnd = () => {
    const distance = touchStartX.current - touchEndX.current; // 计算滑动距离
    if (distance > 50) {
      nextImage(); // 向左滑动，切换到下一张
    } else if (distance < -50) {
      prevImage(); // 向右滑动，切换到上一张
    }
  };

  const nextImage = () => {
    if (currentGoods?.images.length)
      setCurrentIndex(
        (prevIndex) => (prevIndex + 1) % currentGoods?.images.length
      );
  };
  const prevImage = () => {
    if (currentGoods?.images.length)
      setCurrentIndex(
        (prevIndex) =>
          (prevIndex - 1 + currentGoods?.images.length) %
          currentGoods?.images.length
      );
  };

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

  return (
    <div className="detail-container">
      <div className="detail-navbar">
        <img
          className="navbar-icon"
          src={left}
          alt="返回"
          onClick={() => navigate("/market")}
        />
        <img
          className="navbar-icon"
          src={share}
          alt="分享"
          onClick={() => message.info("分享功能正在开发，暂不支持")}
        />
      </div>
      <div
        className="detail-slider"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="slider-container">
          <img
            className="slider-item"
            src={
              currentGoods?.images?.[currentIndex]
                ? `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${
                    currentGoods.images[currentIndex]
                  }`
                : takePlace
            }
            alt={`${currentIndex + 1}`}
          />
          <div className="slider-index">
            {currentGoods?.images.map((_, index) => (
              <div
                key={index}
                className="index-item"
                style={{
                  backgroundColor: currentIndex === index ? "white" : "black",
                }}
              ></div>
            ))}
          </div>
        </div>
      </div>
      <div className="detail-title">{currentGoods?.title}</div>
      <div className="detail-profile">
        <div className="detail-price">￥{currentGoods?.price}</div>
        <div className="detail-goodsType">
          {currentGoods?.goods_type === "sell" ? "出" : "收"}
        </div>
        <div className="detail-tag">{currentGoods?.tag}</div>
        <div className="detail-campus">
          {getCampusName(currentGoods?.campus_id || 1)}
        </div>
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
              <img
                className="like-icon"
                src={isLiked ? like_true : like_false}
                alt="喜欢"
                onClick={handleLike}
              />
              <div className="like-text">{currentGoods?.likes}</div>
            </div>
            <div className="user-dislike" onClick={() => handleDislike()}>
              <img
                className="dislike-icon"
                src={isDisliked ? dislike_true : dislike_false}
                alt="不喜欢"
              />
              <div className="dislike-text">{currentGoods?.complaints}</div>
            </div>
          </div>
        )}
        {isMine === "manage" && (
          <div className="alter-manage">
            <div className="manage-like" onClick={handleLike}>
              <img
                className="like-icon"
                src={isLiked ? like_true : like_false}
                alt="喜欢"
              />
              <div className="like-text">{currentGoods?.likes}</div>
            </div>
            <div className="manage-dislike" onClick={handleDislike}>
              <img
                className="dislike-icon"
                src={isDisliked ? dislike_true : dislike_false}
                alt="不喜欢"
              />
              <div className="dislike-text">{currentGoods?.complaints}</div>
            </div>
            <img className="manage-drop" src={drop} alt="删除" />
          </div>
        )}
      </div>
      <div className="detail-btn">
        <div className="star-btn" onClick={() => message.info("收藏功能正在开发，暂不支持")}>
          <img className="starBtn-icon" src={stars} alt="收藏" />
          <div className="starBtn-text">加入收藏</div>
        </div>
        <div className="contact-btn" onClick={handleCopy}>
          <img className="qqBtn-icon" src={copy} alt="发布者QQ号" />
          <div className="qqBtn-text">立即联系！</div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
