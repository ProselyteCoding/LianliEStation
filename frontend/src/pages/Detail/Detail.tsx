import { usePostStore, useUserStore } from "../../store";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom"; // 使用 useParams 从路由获取参数
import "./Detail.scss";
import copy from "../../assets/copy.png";
import stars from "../../assets/stars.png";
import like from "../../assets/like.png";
import dislike from "../../assets/dislike.png";
import close from "../../assets/close.png";
import drop from "../../assets/drop.png";
import share from "../../assets/share.png";
import left from "../../assets/left.png";

const Detail = () => {
  const param = useParams();
  const ID = param.postId;
  const [images, setImages] = useState<string[]>([]); // 图片数组
  const { fetchByID, detailUser } = useUserStore();
  const { fetchPost, currentPost } = usePostStore();
  const [qq, setQq] = useState(""); // 初始化 qq
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAlter, setCurrentAlter] = useState("user");
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const navigate = useNavigate();

  // 根据 postID 获取帖子和用户数据
  useEffect(() => {
    const fetchData = async () => {
      const numericID = Number(ID);
      await fetchPost(numericID);
      setImages(currentPost?.images || []);
      const userId = currentPost?.author_id || 0; // 确保在获取到 currentPost 后再获取用户信息
      await fetchByID(userId);
      setQq(detailUser?.qq || ""); // 在获取到 detailUser 后设置 qq
    };

    if (ID) {
      fetchData();
    }
  }, [ID]);

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
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  // 点击复制按钮，复制发布者QQ号到剪贴板
  const handleCopy = () => {
    if (qq) {
      navigator.clipboard
        .writeText(qq)
        .then(() => {
          console.log("QQ号已复制到剪贴板");
        })
        .catch((err) => {
          console.error("复制过程出错: ", err);
        });
    } else {
      console.error("未获取到当前用户QQ号");
    }
  };

  // 处理时间格式化
  const formatDateTime = (dateTime:string|undefined) => {
    if (!dateTime) return ""; // 如果没有时间字符串，返回空
    const datePart = dateTime.split("T")[0]; // 获取日期部分
    const timePart = dateTime.split("T")[1].split(":"); // 获取时间部分并分割为数组

    const month = datePart.split("-")[1]; // 获取月份
    const day = datePart.split("-")[2]; // 获取日期
    const hour = timePart[0]; // 获取小时
    const minute = timePart[1]; // 获取分钟

    return `${month}-${day} ${hour}:${minute}`; // 返回格式化后的字符串
  }; 

  // 
  const handleCampusID = (campus_id: number) => {
    if (campus_id === 1) 
    {
      return "凌水主校区";
    }
    else if (campus_id === 2) 
    {
      return "开发区校区";
    }
    else if (campus_id === 3)
    {
      return "盘锦校区";
    }
    else 
    {
      return "校区获取错误";
    }
  }

  return (
    <div className="detail-container">
      <div className="detail-navbar">
        <img
          className="navbar-icon"
          src={left}
          alt="返回"
          onClick={() => navigate("/user/market")}
        />
        <img
          className="navbar-icon"
          src={share}
          alt="分享"
          onClick={() => console.log("分享功能正在开发，暂不支持")}
        />
        <img
          className="navbar-icon"
          src={stars}
          alt="收藏"
          onClick={() => navigate("/user/stars")}
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
            src={images[currentIndex]}
            alt={`${currentIndex + 1}`}
          />
          <div className="slider-index">
            {images.map((_, index) => (
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
      <div className="detail-title">{currentPost?.title}</div>
      <div className="detail-profile">
        <div className="detail-price">￥{currentPost?.price}</div>
        <div className="detail-postType">
          {currentPost?.post_type === "sell" ? "出" : "收"}
        </div>
        <div className="detail-tag">{currentPost?.tag}</div>
        <div className="detail-campus">{handleCampusID(currentPost?.campus_id || 1)}</div>
      </div>
      <div className="detail-content">{currentPost?.content}</div>
      <div className="detail-poster">
        <img
          className="poster-icon"
          src={detailUser?.avatar}
          alt="发布者头像"
        />
        <div className="poster-name">{detailUser?.nickname}</div>
        <div className="poster-credit">{detailUser?.credit}分</div>
        <div className="poster-time">{formatDateTime(currentPost?.created_at)}</div>
      </div>
      <div className="detail-alternative">
        {currentAlter === "user" && (
          <div className="alter-user">
            <div className="user-like">
              <img className="like-icon" src={like} alt="喜欢" />
              <div className="like-text">{currentPost?.likes}</div>
            </div>
            <div
              className="user-dislike"
              onClick={() => setCurrentAlter("appeal")}
            >
              <img className="dislike-icon" src={dislike} alt="不喜欢" />
              <div className="dislike-text">{currentPost?.complaints}</div>
            </div>
          </div>
        )}
        {currentAlter === "appeal" && (
          <div className="alter-appeal">
            <img
              className="appeal-cancel"
              src={close}
              alt="取消"
              onClick={() => setCurrentAlter("user")}
            ></img>
            <textarea
              className="appeal-area"
              placeholder="请写下您的反馈..."
            ></textarea>
            <div className="appeal-control">
              <input className="appeal-img" type="file" id="file" />
              <button className="appeal-submit">提交举报</button>
            </div>
          </div>
        )}
        {currentAlter === "manage" && (
          <div className="alter-manage">
            <div className="manage-like">
              <img className="like-icon" src={like} alt="喜欢" />
              <div className="like-text">{currentPost?.likes}</div>
            </div>
            <div className="manage-dislike">
              <img className="dislike-icon" src={dislike} alt="不喜欢" />
              <div className="dislike-text">{currentPost?.complaints}</div>
            </div>
            <img className="manage-drop" src={drop} alt="删除" />
          </div>
        )}
      </div>
      <div className="detail-btn">
        <div className="star-btn">
          <img className="starBtn-icon" src={stars} alt="收藏" />
          <div className="starBtn-text">加入收藏</div>
        </div>
        <div className="contact-btn">
          <img
            className="qqBtn-icon"
            src={copy}
            alt="发布者QQ号"
            onClick={handleCopy}
          />
          <div className="qqBtn-text">立即联系！</div>
        </div>
      </div>
    </div>
  );
};

export default Detail;
