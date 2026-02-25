import { openDB } from "idb";
import { useRef, useState, useEffect, useCallback } from "react"; // 导入useCallback
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../../store";
import { message } from "antd";
import api from "../../../api";
import { px2rem } from "../../../utils/rem";
import "./MarketPublish.scss";
import Navbar from "../../../components/Navbar/Navbar";
import logo from "../../../assets/logo.webp";
import accept from "../../../assets/accept.webp";
import refresh from "../../../assets/refresh.svg";
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'

export interface PublishProps {
  title: string;
  price: number;
  tag: string;
  post_type: string;
  details: string;
  fromAI?: boolean; // 标记是否从AI发布页跳转
}

const dbPromise = openDB("userImagesDB", 1, {
  upgrade(db) {
    if (!db.objectStoreNames.contains("images")) {
      db.createObjectStore("images");
    }
  },
});

const storeImageInDB = async (key: string, file: File) => {
  const db = await dbPromise;
  const tx = db.transaction("images", "readwrite");
  const store = tx.objectStore("images");
  await store.put(file, key);
  await tx.done;
};

const getImageFromDB = async (key: string): Promise<File | undefined> => {
  const db = await dbPromise;
  const tx = db.transaction("images", "readonly");
  const store = tx.objectStore("images");
  const file = await store.get(key);
  await tx.done;
  return file;
};

const Publish: React.FC = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [textareaValue, setTextareaValue] = useState<string>("");
  const [dialogHistory, setDialogHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [previousText, setPreviousText] = useState<string>("");
  const [avatarFile, setAvatarFile] = useState<string | undefined>();
  const [backgroundFile, setBackgroundFile] = useState<string | undefined>();

  const { currentUser } = useUserStore();

  // 从URL获取Base64
  const fetchImageAsBase64 = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result); // 读取完成后返回Base64字符串
        reader.readAsDataURL(blob); // 转换为Base64
      });
    } catch (error) {
      console.error('获取图片失败:', error);
      return null;
    }
  };

  const fetchImageFromBackend = async (
    endpoint: string
  ): Promise<File | null> => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) return null;
      const blob = await response.blob();
      const filename = endpoint.includes("avatar")
        ? "avatar.jpg"
        : "background.jpg";
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.error('从后端获取图片失败:', error);
      return null;
    }
  };

  const loadImage = useCallback(async (
    key: string,
    defaultUrl: string,
    isAvatar: boolean
  ): Promise<any> => {
    // 先从 IndexedDB 获取缓存
    const file = await getImageFromDB(key);
    if (file) {
      // 转为Base64
      console.log("从 IndexedDB 获取图片:", key);
      return await fetchImageAsBase64(URL.createObjectURL(file));
    } else {
      // IndexedDB中没有，从后端请求
      console.log("从后端请求图片:", key);
      const endpoint = `${
        process.env.REACT_APP_API_URL || "http://localhost:5000"
      }${defaultUrl}`;
      const fetchedFile = await fetchImageFromBackend(endpoint);
      if (fetchedFile) {
        // 存入IndexedDB作为缓存
        await storeImageInDB(key, fetchedFile);
        // 转为Base64
        return await fetchImageAsBase64(URL.createObjectURL(fetchedFile));
      } else {
        // 失败使用默认路径（可以是静态图片路径）
        console.log("使用默认路径");
        return isAvatar ? "/assets/logo.png" : "/assets/background-wide.jpg";
      }
    }
  }, []);

  useEffect(() => {
    // 加载发布页背景图（使用background_url）
    const backgroundUrl = currentUser?.background_url || "/uploads/default_background.png";
    loadImage("background", backgroundUrl, false).then((base64) => setBackgroundFile(base64));
    
    // 加载头像
    const avatarUrl = currentUser?.avatar || "/uploads/default_avatar.png";
    loadImage("avatar", avatarUrl, true).then((base64) => setAvatarFile(base64));
  }, [currentUser, loadImage]); // 移除token依赖

  // 设置对话框自适应高度
  const handleHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // 先重置高度
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // 根据内容调整高度
    }
  };

  // API调用
  const handleRequest = async (text: string = textareaValue) => {
    if (!text) {
      message.error({
        content: "请输入商品信息",
        style: {
          marginTop: px2rem(50),
        },
      });
      return;
    }
    // 添加用户对话框
    setDialogHistory((prevHistory) => [
      ...prevHistory,
      { role: "user", content: text },
    ]);
    // 调用API生成模板
    try {
      const res = await api.post("/api/publish/template", { text: text });
      if (res) {
        // 添加AI对话框
        setDialogHistory((prevHistory) => [
          ...prevHistory,
          { role: "ai", content: JSON.stringify(res.data) },
        ]);
      } else {
        message.error({
          content: "生成失败，请重试",
          style: {
            marginTop: px2rem(50),
          },
        });
      }
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        console.error("缺少必要参数");
      } else if (error.response && error.response.status === 401) {
        console.error("未授权，请检查你的登录状态");
        message.error({
          content: "未授权，请检查你的登录状态",
          style: {
            marginTop: px2rem(50),
          },
        });
      } else if (error.response && error.response.status === 500) {
        console.error("服务器错误");
      } else {
        console.error("Error generating AI product info:", error);
      }
      message.error({
        content: "生成失败，请重试",
        style: {
          marginTop: px2rem(50),
        },
      });
    }
    // 清空文本框,重置高度
    if (textareaValue) {
      setPreviousText(textareaValue);
      setTextareaValue("");
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // 用户点击发布按钮
  const handlePost = () => {
    handleRequest();
  };

  // 用户点击生成模板按钮
  const handleGenerateTemplate = (content: string) => {
    try {
      const templateData: PublishProps = JSON.parse(content);
      // 添加 fromAI 标志，表示从AI页面跳转
      templateData.fromAI = true;
      // 跳转至模板页，并传递模板参数
      navigate("/publish/market-publish-basic", { state: templateData });
    } catch (error) {
      console.error("解析模板数据失败", error);
      alert("解析模板数据失败，请重试");
    }
  };

  // 用户点击刷新按钮
  const handleRefresh = () => {
    // 移除上一条AI对话记录
    const lastAIDialogIndex = dialogHistory.findIndex(
      (dialog) => dialog.role === "ai"
    );
    let newDialogHistory = dialogHistory.filter(
      (_, index) => index !== lastAIDialogIndex
    );

    // 移除上一条用户对话记录
    const lastUserDialogIndex = newDialogHistory.findIndex(
      (dialog) => dialog.role === "user"
    );
    newDialogHistory = newDialogHistory.filter(
      (_, index) => index !== lastUserDialogIndex
    );

    setDialogHistory(newDialogHistory);

    // 重新生成AI对话
    handleRequest(previousText);
  };

  const handlePostDebounce = useDebouncedCallback(handlePost)
  const handleRefreshDebounce = useDebouncedCallback(handleRefresh)
  const handleGenerateTemplateDebounce = useDebouncedCallback(handleGenerateTemplate)

  // 监听dialogHistory的变化并滚动到底部
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [dialogHistory]);

  return (
    <div className="publish-container">
      <Navbar title="商品AI发布" backActive={true} backPath="/publish/market-publish-choice"/>
      <div className="dialog-container" ref={containerRef}>
        {backgroundFile ? (
          <img src={backgroundFile} alt="背景" className="dialog-bg"></img>
        ) : null}
        {
          <div className="dialog-ai">
            <div className="dialog-face">
              <img src={logo} alt="头像"></img>
            </div>
            <div className="dialog-content">
              嗨！我是发布助手小e，很高兴为您服务！请在下面的对话框中发布您的商品信息：
              <br></br>
              按照“收/出+商品名称+价格+细节”的格式填写，如“收计网二手教材，10r，不要圈画”。
            </div>
          </div>
        }
        {dialogHistory.map((dialog, index) => (
          <div
            key={index}
            className={dialog.role === "user" ? "dialog-user" : "dialog-ai"}
          >
            <div className="dialog-face">
              <img
                src={dialog.role === "user" ? avatarFile : logo}
                alt="头像"
              ></img>
            </div>
            <div className="dialog-content">
              {dialog.role === "user" ? (
                dialog.content
              ) : (
                <>
                  <div className="dialog-item">
                    标题：{JSON.parse(dialog.content).title}
                  </div>
                  <div className="dialog-item">
                    类型：
                    {JSON.parse(dialog.content).post_type === "sell"
                      ? "出"
                      : "收"}
                  </div>
                  <div className="dialog-item">
                    标签：{JSON.parse(dialog.content).tag}
                  </div>
                  <div className="dialog-item">
                    价格：￥{JSON.parse(dialog.content).price}
                  </div>
                  <div className="dialog-item">
                    详情：{JSON.parse(dialog.content).details}
                  </div>
                  <div className="dialog-control">
                    <div
                      className="dialog-btn"
                      onClick={() => handleGenerateTemplateDebounce(dialog.content)}
                    >
                      <div className="btn-icon">
                        <img src={accept} alt="生成模板"></img>
                      </div>
                      <div className="btn-text">生成模板</div>
                    </div>
                    <div className="dialog-btn" onClick={() => handleRefreshDebounce()}>
                      <div className="btn-icon">
                        <img src={refresh} alt="重新生成"></img>
                      </div>
                      <div className="btn-text">重新生成</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="input-container">
        <textarea
          className="input-text"
          placeholder="请输入商品信息"
          rows={1}
          ref={textareaRef}
          onInput={handleHeight}
          value={textareaValue}
          onChange={(e) => setTextareaValue(e.target.value)}
        ></textarea>
        <button className="input-btn" onClick={handlePostDebounce}>
          发送
        </button>
      </div>
    </div>
  );
};

export default Publish;
