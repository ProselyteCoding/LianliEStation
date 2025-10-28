// tabbar 组件，仅在/market、/forum、/publish、/user页面使用，引入时传参index: number，为高亮的tabbar按钮的索引
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Tabbar.scss";
import market from "../../assets/market-white.svg";
import forum from "../../assets/forum-white.svg";
// import publish from "../../assets/publish-white.svg";
import user from "../../assets/user-white.svg";
import market_active from "../../assets/market-white-active.svg";
import forum_active from "../../assets/forum-white-active.svg";
// import publish_active from "../../assets/publish-white-active.svg";
import user_active from "../../assets/user-white-active.svg";

interface TabbarProps {
  initialIndex: number;
}

const Tabbar: React.FC<TabbarProps> = ({ initialIndex }) => {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const navigate = useNavigate();

  const handleClick = (path: string, index: number) => {
    setActiveIndex(index);
    navigate(path);
  };

  return (
    <div className="tabbar-container">
      <div className="tabbar-item" onClick={() => handleClick("/market", 0)}>
        <div className="tabbar-icon">
          {
            activeIndex===0?<i className="iconfont icon-market-active"></i>:<i className="iconfont icon-market"></i>
          }
        </div>
        <span style={(activeIndex === 0 ? { color: "white" } : { color: "white" })} >商城</span>
      </div>
      <div className="tabbar-item" onClick={() => handleClick("/forum", 1)}>
        <div className="tabbar-icon">
          {
            activeIndex===1?<i className="iconfont icon-forum-active"></i>:<i className="iconfont icon-forum"></i>
          }
        </div>
        <span style={(activeIndex === 1 ? { color: "#white" } : { color: "white" })} >校园墙</span>
      </div>
      {/* <div className="tabbar-item" onClick={() => handleClick("/publish", 2)}>
        <div className="tabbar-icon">
          <img
            src={activeIndex === 2 ? publish_active : publish}
            alt="publish"
          ></img>
        </div>
        <span style={(activeIndex === 2 ? { color: "white" } : { color: "white" })} >发布</span>
      </div> */}
      <div className="tabbar-item" onClick={() => handleClick("/user", 3)}>
        <div className="tabbar-icon">
          {
            activeIndex===2?<i className="iconfont icon-user-active"></i>:<i className="iconfont icon-user"></i>
          }
        </div>
        <span style={(activeIndex === 2 ? { color: "white" } : { color: "white" })} >用户</span>
      </div>
    </div>
  );
};

export default Tabbar;
