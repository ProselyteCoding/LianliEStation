import Navbar from "../../../../components/Navbar/Navbar";
import "./Reset.scss";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { useUserStore } from "../../../../store";
import { useState, useEffect } from "react";
import Forget from "../Forget/Forget";
import { Button, Input, Select, message } from "antd";
import { UploadOutlined, CameraOutlined } from "@ant-design/icons";
import NoticeModal from "../../../../components/NoticeModal/NoticeModal";
import ImageCropper from "../../../../components/ImageCropper/ImageCropper";
import { useDebounce,useDebouncedCallback } from '../../../../hooks/useDebounce'


interface Profile {
  nickname: string | undefined;
  campus_id: number | undefined;
  qq_id: string | undefined;
  avatar: File | undefined;
  theme_id: number | undefined;
  background_url: File | undefined;
  banner_url: File | undefined;
}

const Reset = () => {
  const { currentUser, changeProfile, changeImage, isAuthenticated } = useUserStore();
  const defaultProfile: Profile = {
    nickname: currentUser?.nickname || "",
    campus_id: currentUser?.campus_id || 1,
    qq_id: currentUser?.qq_id || "",
    avatar: undefined,
    theme_id: currentUser?.theme_id,
    background_url: undefined,
    banner_url: undefined,
  };
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // 添加loading状态
  
  // 裁剪器状态
  const [cropperVisible, setCropperVisible] = useState<boolean>(false);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [currentImageType, setCurrentImageType] = useState<'avatar' | 'background_url' | 'banner_url' | null>(null);
  
  const { type } = useParams();
  const navigate = useNavigate();

  // ✅ 当currentUser更新时，同步更新profile的默认值
  useEffect(() => {
    if (currentUser) {
      setProfile(prev => ({
        ...prev,
        nickname: prev.nickname || currentUser.nickname || "",
        campus_id: prev.campus_id || currentUser.campus_id || 1,
        qq_id: prev.qq_id || currentUser.qq_id || "",
        theme_id: prev.theme_id !== undefined ? prev.theme_id : currentUser.theme_id,
      }));
    }
  }, [currentUser]);

  // 清理预览URL，防止内存泄露
  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [avatarPreview, backgroundPreview, bannerPreview]);

  // 处理原生文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'background_url' | 'banner_url') => {
    const file = event.target.files?.[0];
    if (file) {
      // 打开裁剪器
      setCurrentImageFile(file);
      setCurrentImageType(type);
      setCropperVisible(true);
    }
    // 重置input的value，这样选择相同文件时也能触发onChange
    event.target.value = '';
  };

  // 触发文件选择（解决移动设备兼容性问题）
  const triggerFileInput = (inputId: string) => {
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      input.click();
    }
  };

  // 裁剪确认回调
  const handleCropConfirm = (croppedFile: File) => {
    if (!currentImageType) return;

    // 更新profile中的文件
    setProfile((prev) => ({
      ...prev,
      [currentImageType]: croppedFile,
    }));

    // 创建预览URL
    const previewUrl = URL.createObjectURL(croppedFile);
    
    // 根据类型设置对应的预览
    switch (currentImageType) {
      case 'avatar':
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(previewUrl);
        break;
      case 'background_url':
        if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
        setBackgroundPreview(previewUrl);
        break;
      case 'banner_url':
        if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        setBannerPreview(previewUrl);
        break;
    }

    // 关闭裁剪器
    setCropperVisible(false);
    setCurrentImageFile(null);
    setCurrentImageType(null);
  };

  // 裁剪取消回调
  const handleCropCancel = () => {
    setCropperVisible(false);
    setCurrentImageFile(null);
    setCurrentImageType(null);
  };

  // 清除图片预览
  const clearPreview = (type: 'avatar' | 'background_url' | 'banner_url') => {
    // 清除profile中的文件
    setProfile((prev) => ({
      ...prev,
      [type]: undefined,
    }));

    // 清除对应的预览
    switch (type) {
      case 'avatar':
        if (avatarPreview) {
          URL.revokeObjectURL(avatarPreview);
          setAvatarPreview(null);
        }
        break;
      case 'background_url':
        if (backgroundPreview) {
          URL.revokeObjectURL(backgroundPreview);
          setBackgroundPreview(null);
        }
        break;
      case 'banner_url':
        if (bannerPreview) {
          URL.revokeObjectURL(bannerPreview);
          setBannerPreview(null);
        }
        break;
    }
  };

  // 处理个人信息提交（支持昵称、校区、QQ、主题四个参数）
  const handleProfileSubmit = async () => {
    setLoading(true);
    try {
      // ✅ 使用profile的值，如果没有则使用currentUser的值作为后备
      const nickname = (profile?.nickname || currentUser?.nickname || "").trim();
      const campus_id = Number(profile?.campus_id || currentUser?.campus_id || 1);
      const qq_id = (profile?.qq_id || currentUser?.qq_id || "").trim();
      const theme_id = profile?.theme_id !== undefined ? profile.theme_id : currentUser?.theme_id;

      console.log('📤 提交前的数据:', { 
        profile_nickname: profile?.nickname,
        profile_campus_id: profile?.campus_id,
        profile_qq_id: profile?.qq_id,
        profile_theme_id: profile?.theme_id,
        currentUser_nickname: currentUser?.nickname,
        currentUser_campus_id: currentUser?.campus_id,
        currentUser_qq_id: currentUser?.qq_id,
        currentUser_theme_id: currentUser?.theme_id,
      });

      console.log('📤 最终提交参数:', { 
        nickname, 
        campus_id, 
        qq_id: qq_id || '(未提供)',
        theme_id: theme_id !== undefined ? theme_id : '(未提供)'
      });

      // ✅ 调用changeProfile，传入四个参数（qq_id和theme_id都是可选的）
      await changeProfile(
        nickname, 
        campus_id, 
        qq_id || undefined,
        theme_id
      );
      
      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        navigate("/user/settings");
      }, 500);
    } catch (error: any) {
      console.error("❌ 更新失败:", error);
      const errorMsg = error.response?.data?.message || error.message || '更新失败';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 处理图片提交
  const handleImageSubmission = async (key: string, file?: File) => {
    if (file) {
      setLoading(true);
      try {
        // 等待上传完成
        await changeImage(key, file);
        // 延迟导航，让用户看到成功提示
        setTimeout(() => {
          navigate("/user/settings");
        }, 500);
      } catch (error) {
        console.error("上传失败:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 处理资料卡背景提交
  const handleBannerSubmit = () => {
    if (profile?.banner_url) {
      handleImageSubmission("banner", profile.banner_url);
    }
  };

  // 处理发布背景提交
  const handleBackgroundSubmit = () => {
    if (profile?.background_url) {
      handleImageSubmission("background", profile.background_url);
    }
  };

  // 处理头像提交
  const handleAvatarSubmit = () => {
    if (profile?.avatar) {
      handleImageSubmission("avatar", profile.avatar);
    }
  };

  const handleBannerSubmitDebounce = useDebouncedCallback(handleBannerSubmit)
  const handleBackgroundSubmitDebounce = useDebouncedCallback(handleBackgroundSubmit)
  const handleAvatarSubmitDebounce = useDebouncedCallback(handleAvatarSubmit)
  const handleProfileSubmitDebounce = useDebouncedCallback(handleProfileSubmit)

  switch (type) {
    case "nickname":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置昵称" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="input-group">
              <Input
                className="modern-input"
                placeholder="请输入新的昵称"
                defaultValue={currentUser?.nickname}
                onChange={(e) => setProfile(prev => ({ ...prev, nickname: e.target.value }))}
                size="large"
              />
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleProfileSubmitDebounce}
              size="large"
              block
              loading={loading}
            >
              保存昵称
            </Button>
          </div>
        </div>
      );
    case "campus_id":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置默认校区" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="input-group">
              <Select
                className="modern-select"
                placeholder="请选择默认校区"
                defaultValue={currentUser?.campus_id}
                onChange={(value) => setProfile(prev => ({ ...prev, campus_id: value }))}
                size="large"
                options={[
                  { value: 1, label: '凌水主校区' },
                  { value: 2, label: '开发区校区' },
                  { value: 3, label: '盘锦校区' },
                ]}
              />
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleProfileSubmitDebounce}
              size="large"
              block
              loading={loading}
            >
              保存默认校区
            </Button>
          </div>
        </div>
      );
    case "qq_id":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置绑定QQ" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="input-group">
              <Input
                className="modern-input"
                placeholder="请输入要绑定的QQ号"
                defaultValue={currentUser?.qq_id}
                onChange={(e) => setProfile(prev => ({ ...prev, qq_id: e.target.value }))}
                size="large"
              />
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleProfileSubmitDebounce}
              size="large"
              block
              loading={loading}
            >
              保存绑定QQ号
            </Button>
          </div>
        </div>
      );
    case "avatar":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置头像" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="upload-group avatar-upload">
              <div className="native-upload-container avatar-shape">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'avatar')}
                  style={{ display: 'none' }}
                  id="avatar-upload-input"
                />
                {avatarPreview ? (
                  <div className="preview-container">
                    <img src={avatarPreview} alt="头像预览" className="preview-image" />
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => clearPreview('avatar')}
                    >
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="avatar-upload-input" 
                    className="upload-label"
                    onClick={(e) => {
                      // 确保在所有设备上都能触发文件选择
                      e.preventDefault();
                      triggerFileInput('avatar-upload-input');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <CameraOutlined className="upload-icon" />
                    <div>选择头像</div>
                  </label>
                )}
              </div>
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleAvatarSubmitDebounce}
              size="large"
              block
              disabled={!profile?.avatar}
              loading={loading}
            >
              保存头像
            </Button>
          </div>
          <ImageCropper
            visible={cropperVisible}
            imageFile={currentImageFile}
            aspectRatio={1}
            circularCrop={true}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
            targetWidth={400}
            targetHeight={400}
          />
        </div>
      );
    case "theme_id":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置主题风格" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="input-group">
              <Select
                className="modern-select"
                placeholder="请选择主题风格"
                defaultValue={currentUser?.theme_id || 1}
                onChange={(value) => setProfile(prev => ({ ...prev, theme_id: value }))}
                size="large"
                options={[
                  { value: 1, label: '连理蓝' },
                ]}
              />
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleProfileSubmitDebounce}
              size="large"
              block
              loading={loading}
            >
              保存主题风格
            </Button>
          </div>
        </div>
      );
    case "background":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置发布页背景" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="upload-group background-upload">
              <div className="native-upload-container background-shape">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'background_url')}
                  style={{ display: 'none' }}
                  id="background-upload-input"
                />
                {backgroundPreview ? (
                  <div className="preview-container">
                    <img src={backgroundPreview} alt="背景预览" className="preview-image" />
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => clearPreview('background_url')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="background-upload-input" 
                    className="upload-label"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerFileInput('background-upload-input');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <UploadOutlined className="upload-icon" />
                    <div>选择背景</div>
                  </label>
                )}
              </div>
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleBackgroundSubmitDebounce}
              size="large"
              block
              disabled={!profile?.background_url}
              loading={loading}
            >
              保存发布页背景
            </Button>
          </div>
          <ImageCropper
            visible={cropperVisible}
            imageFile={currentImageFile}
            aspectRatio={9 / 16}
            circularCrop={false}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
            targetWidth={720}
            targetHeight={1280}
          />
        </div>
      );
    case "banner":
      return (
        <div className="reset-container">
          {!isAuthenticated && <NoticeModal type="login"/>}
          <Navbar title="重置资料卡背景" backActive={true} backPath="/user/settings" />
          <div className="reset-content">
            <div className="upload-group banner-upload">
              <div className="native-upload-container banner-shape">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'banner_url')}
                  style={{ display: 'none' }}
                  id="banner-upload-input"
                />
                {bannerPreview ? (
                  <div className="preview-container">
                    <img src={bannerPreview} alt="Banner预览" className="preview-image" />
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => clearPreview('banner_url')}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label 
                    htmlFor="banner-upload-input" 
                    className="upload-label"
                    onClick={(e) => {
                      e.preventDefault();
                      triggerFileInput('banner-upload-input');
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <UploadOutlined className="upload-icon" />
                    <div>选择背景</div>
                  </label>
                )}
              </div>
            </div>
            <Button 
              type="primary" 
              className="submit-button"
              onClick={handleBannerSubmitDebounce}
              size="large"
              block
              disabled={!profile?.banner_url}
              loading={loading}
            >
              保存资料卡背景
            </Button>
          </div>
          <ImageCropper
            visible={cropperVisible}
            imageFile={currentImageFile}
            aspectRatio={16 / 9}
            circularCrop={false}
            onConfirm={handleCropConfirm}
            onCancel={handleCropCancel}
            targetWidth={1280}
            targetHeight={720}
          />
        </div>
      );
    case "password":
      return <Forget />;
    default:
      return <Navigate to="/user/settings" replace />;
  }
};

export default Reset;