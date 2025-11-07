// tabbar 组件，仅在/market、/forum、/publish、/user页面使用，引入时传参index: number，为高亮的tabbar按钮的索引
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Tabbar.scss";
import Icon from "../Icon/Icon";

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
          <Icon name={activeIndex === 0 ? "market-white-active" : "market-white"} size={32} />
        </div>
        <span style={{ color: "white" }}>商城</span>
      </div>
      <div className="tabbar-item" onClick={() => handleClick("/forum", 1)}>
        <div className="tabbar-icon">
          <Icon name={activeIndex === 1 ? "forum-white-active" : "forum-white"} size={32} />
        </div>
        <span style={{ color: "white" }}>校园墙</span>
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
          <Icon name={activeIndex === 2 ? "user-white-active" : "user-white"} size={32} />
        </div>
        <span style={{ color: "white" }}>用户</span>
      </div>
    </div>
  );
};

export default Tabbar;
