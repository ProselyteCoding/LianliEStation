// tabbar 组件，仅在/market、/forum、/publish、/user页面使用，引入时传参index: number，为高亮的tabbar按钮的索引
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Tabbar.scss";
import market from "../../assets/market.svg";
import forum from "../../assets/forum.svg";
import publish from "../../assets/publish.svg";
import user from "../../assets/user.svg";
import market_active from "../../assets/market-active.svg";
import forum_active from "../../assets/forum-active.svg";
import publish_active from "../../assets/publish-active.svg";
import user_active from "../../assets/user-active.svg";

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
          <img
            src={activeIndex === 0 ? market_active : market}
            alt="market"
          ></img>
        </div>
        <span style={(activeIndex === 0 ? { color: "#0674C1" } : { color: "black" })} >商城</span>
      </div>
      <div className="tabbar-item" onClick={() => handleClick("/forum", 1)}>
        <div className="tabbar-icon">
          <img src={activeIndex === 1 ? forum_active : forum} alt="forum"></img>
        </div>
        <span style={(activeIndex === 1 ? { color: "#0674C1" } : { color: "black" })} >校园墙</span>
      </div>
      <div className="tabbar-item" onClick={() => handleClick("/publish", 2)}>
        <div className="tabbar-icon">
          <img
            src={activeIndex === 2 ? publish_active : publish}
            alt="publish"
          ></img>
        </div>
        <span style={(activeIndex === 2 ? { color: "#0674C1" } : { color: "black" })} >发布</span>
      </div>
      <div className="tabbar-item" onClick={() => handleClick("/user", 3)}>
        <div className="tabbar-icon">
          <img src={activeIndex === 3 ? user_active : user} alt="user"></img>
        </div>
        <span style={(activeIndex === 3 ? { color: "#0674C1" } : { color: "black" })} >用户</span>
      </div>
    </div>
  );
};

export default Tabbar;
