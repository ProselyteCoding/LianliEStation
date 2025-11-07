import { useNavigate, useLocation } from "react-router-dom";
import "./Settings.scss";
import { useUserStore } from "../../../store";
import Navbar from "../../../components/Navbar/Navbar";
import "../../../Icon.scss";
import { useEffect } from "react";
import Icon from "../../../components/Icon/Icon";

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // 调用 useUserStore 来获取 logout 方法和认证状态
  const logout = useUserStore((state) => state.logout);
  const currentUser = useUserStore((state) => state.currentUser);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const fetchUserProfile = useUserStore((state) => state.fetchUserProfile);

  // ✅ 监听路由变化，每次进入Settings页面都刷新用户信息
  useEffect(() => {
    if (isAuthenticated) {
      console.log('🔄 Settings页面: 路由变化，触发刷新', location.pathname);
      console.log('📊 Settings页面: 当前currentUser', currentUser);
      
      fetchUserProfile().catch(error => {
        console.error('❌ Settings页面: 刷新用户信息失败', error);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated]); // 监听路由变化
  
  // ✅ 监听currentUser变化
  useEffect(() => {
    console.log('📢 Settings页面: currentUser已更新', currentUser);
  }, [currentUser]);

  const handleLogout = () => {
    logout();
    navigate("/auth/login");
  }

  return (
    <div className="settings-container">
      <Navbar title="设置" backActive={true} backPath="/user" />
      <div className="settings-item" >
        <div className="item-text">用户名</div>
        <div className="item-value">{currentUser?.username}</div>
      </div>
      <div className="settings-item" >
        <div className="item-text">邮箱</div>
        <div className="item-value">{currentUser?.email}</div>
      </div>
      <div className="settings-item spacing-top" onClick={() => navigate('/user/settings/reset/nickname')}>
        <div className="item-text">昵称</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item" onClick={() => navigate('/user/settings/reset/campus_id')}>
        <div className="item-text">默认校区</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item" onClick={() => navigate('/user/settings/reset/qq_id')}>
        <div className="item-text">绑定QQ</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item spacing-top" onClick={() => navigate('/user/settings/reset/password')}>
        <div className="item-text">密码</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item spacing-top" onClick={() => navigate('/user/settings/reset/avatar')}>
        <div className="item-text">头像</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item" onClick={() => navigate('/user/settings/reset/background')}>
        <div className="item-text">发布页背景</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item" onClick={() => navigate('/user/settings/reset/banner')}>
        <div className="item-text">资料卡背景</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item" onClick={() => navigate('/user/settings/reset/theme_id')}>
        <div className="item-text">主题风格</div><Icon name="right" size={20} className="right-icon" />
      </div>
      <div className="settings-item spacing-top" onClick={() => navigate('/user/settings/about')}>
        <div className="item-text">关于连理e站</div><Icon name="about" size={20} className="right-icon" />
      </div>
      {isAuthenticated && <div className="settings-item spacing-top" onClick={handleLogout}><div className="item-text">退出当前账号</div><Icon name="logout" size={20} className="right-icon" /></div>}
    </div>
  );
};

export default Settings;
