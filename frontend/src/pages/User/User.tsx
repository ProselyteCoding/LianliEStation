import Tabbar from "../../components/Tabbar/Tabbar";  
import "./User.scss";  
import { useUserStore } from "../../store";  
import { useNavigate } from "react-router-dom";  
import stars from "../../assets/stars.png";  
import history from "../../assets/history.png";  
import messages from "../../assets/messages.png";  
import settings from "../../assets/settings.png";  
import right from "../../assets/right.png";  
import { useEffect } from "react";
import Cookies from "js-cookie"; 

const User = () => {  
  const { currentUser, userTheme } = useUserStore();  
  const navigate = useNavigate();
  const token = Cookies.get("token");  

  // 将图片转换为Base64并存储到localStorage  
  const storeImagesInLocalStorage = async () => {  
    const avatarUrl = userTheme.avatar ? `http://localhost:5000${userTheme.avatar}` : null;  
    const bannerUrl = userTheme.banner_url ? `http://localhost:5000${userTheme.banner_url}` : null;  

    if (avatarUrl) {  
      const avatarBase64: any = await fetchImageAsBase64(avatarUrl);  
      localStorage.setItem("userAvatar", avatarBase64);  
    }  
    
    if (bannerUrl) {  
      const bannerBase64: any = await fetchImageAsBase64(bannerUrl);  
      localStorage.setItem("userBanner", bannerBase64);  
    }  
  };  

  // 从URL获取Base64  
  const fetchImageAsBase64 = async (url: string) => {  
    const response = await fetch(url);  
    const blob = await response.blob();  
    return new Promise((resolve) => {  
      const reader = new FileReader();  
      reader.onloadend = () => resolve(reader.result); // 读取完成后返回Base64字符串  
      reader.readAsDataURL(blob); // 转换为Base64  
    });  
  };  

  useEffect(() => {  
    // 存储请求到的图片  
    if (!localStorage.getItem("userAvatar"))
    storeImagesInLocalStorage();  
  }, [token]);  

  // 从localStorage获取图片的函数  
  const getImageFromLocalStorage = (key: string) => {  
    return localStorage.getItem(key) || null; // 如果不存在返回 null  
  };  

  // 获取头像和横幅图片  
  const avatarSrc = getImageFromLocalStorage("userAvatar") || undefined;  
  const bannerSrc = getImageFromLocalStorage("userBanner") || undefined;  

  return (  
    <div className="user-container">  
      <div className="user-bg">  
        <img src={bannerSrc} alt="用户banner" />  
      </div>  
      <div className="user-info">  
        <div className="user-face">  
          <img src={avatarSrc} alt="用户头像" />  
        </div>  
        <div className="user-text">  
          <div className="user-name">昵称：{currentUser?.username || 'test'}</div>  
          <div className="user-credit">信誉：{currentUser?.credit || '100'}</div>  
          <div className="user-email">邮箱：{currentUser?.email || 'test@test.com'}</div>  
        </div>  
      </div>  
      <div className="user-settings">  
        <div className="user-item" onClick={() => navigate('/user/stars')}>  
          <img src={stars} alt="收藏" className="item-icon" />  
          <div className="item-text">收藏</div>  
          <img src={right} alt="右箭头" className="right-icon" />  
        </div>  
        <div className="user-item" onClick={() => navigate('/user/history')}>  
          <img src={history} alt="历史" className="item-icon" />  
          <div className="item-text">历史</div>  
          <img src={right} alt="右箭头" className="right-icon" />  
        </div>  
        <div className="user-item" onClick={() => navigate('/user/messages')}>  
          <img src={messages} alt="信箱" className="item-icon" />  
          <div className="item-text">信箱</div>  
          <img src={right} alt="右箭头" className="right-icon" />  
        </div>  
      </div>  
      <div className="user-settings" onClick={() => navigate('/user/settings')}>  
        <div className="user-item">  
          <img src={settings} alt="设置" className="item-icon" />  
          <div className="item-text">设置</div>  
          <img src={right} alt="右箭头" className="right-icon" />  
        </div>  
      </div>  
      <Tabbar />  
    </div>  
  );  
};  

export default User;