import { useNavigate } from "react-router-dom";
import "./Settings.scss";
import { useAuthStore, useUserStore } from "../../store";
import Navbar from "../../components/Navbar/Navbar";
import logoutIcon from "../../assets/logout.png"
import right from "../../assets/right.png"
import about from "../../assets/about.png"

const Settings = () => {
  const navigate = useNavigate();
  // 调用 useAuthStore 来获取 logout 方法
  const logout = useAuthStore((state) => state.logout);
  const currentUser = useUserStore((state) => state.currentUser);

  const handleLogout = () => {
    logout();
    navigate("/login");
  }

  return (
    <div className="settings-container">
      <Navbar title="设置" backActive={true} backPath="user" />
        <div className="settings-item" >
          <div className="item-text">用户名</div>
          <div className="item-value">{currentUser?.username}</div>
        </div>
        <div className="settings-item" >
          <div className="item-text">邮箱</div>
          <div className="item-value">{currentUser?.email}</div>
        </div>
        <div className="settings-item" style={{ marginTop: "3px" }} onClick={() => navigate('/reset/nickname')}>
          <div className="item-text">昵称</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" onClick={() => navigate('/reset/campus_id')}>
          <div className="item-text">默认校区</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" onClick={() => navigate('/reset/qq_id')}>
          <div className="item-text">绑定QQ</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" style={{ marginTop: "3px" }} onClick={() => navigate('/reset/password')}>
          <div className="item-text">密码</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" style={{ marginTop: "3px" }} onClick={() => navigate('/reset/avatar')}>
          <div className="item-text">头像</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" onClick={() => navigate('/reset/background')}>
          <div className="item-text">发布页背景</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" onClick={() => navigate('/reset/banner')}>
          <div className="item-text">资料卡背景</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" onClick={() => navigate('/reset/theme_id')}>
          <div className="item-text">主题风格</div><img src={right} alt="详情" className="right-icon"></img>
        </div>
        <div className="settings-item" style={{ marginTop: "3px" }} onClick={() => navigate('/')}>
          <div className="item-text">关于连理e站</div><img src={about} alt="详情" className="right-icon"></img>
        </div>
      <div className="logout-container" onClick={handleLogout}>
        <div className="logout-icon">
          <img src={logoutIcon} alt="退出"></img>
        </div>
        <div className="logout-text">退出当前账号</div>
      </div>
    </div>
  );
};

export default Settings;
