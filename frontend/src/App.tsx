import React, { useEffect, useMemo, useState } from "react";
import useScreenType from "./hooks/useScreenType";
import Cookies from "js-cookie";
import "./App.scss";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useUserStore } from "./store";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import { message } from "antd";
import SwitchDirection from "./components/SwitchDirection/SwitchDirection";
import LoadingManager from "./components/LoadingManager/LoadingManager";

// 懒加载页面组件统一管理
const Lazy = {
  Market: React.lazy(() => import("./pages/Market/Market")),
  Detail: React.lazy(() => import("./pages/Market/Detail/Detail")),
  DetailAppeal: React.lazy(() => import("./pages/Market/Detail/DetailAppeal")),
  MarketPublishChoice: React.lazy(() => import("./pages/Publish/MarketPublish/MarketPublishChoice/MarketPublishChoice")),
  MarketPublish: React.lazy(() => import("./pages/Publish/MarketPublish/MarketPublish")),
  Template: React.lazy(() => import("./pages/Publish/MarketPublish/Template/Template")),
  Login: React.lazy(() => import("./pages/Auth/Login/Login")),
  Register: React.lazy(() => import("./pages/Auth/Register/Register")),
  AdminRegister: React.lazy(() => import("./pages/Admin/Register/Register")),
  Reset: React.lazy(() => import("./pages/User/Settings/Reset/Reset")),
  User: React.lazy(() => import("./pages/User/User")),
  Forum: React.lazy(() => import("./pages/Forum/Forum")),
  Settings: React.lazy(() => import("./pages/User/Settings/Settings")),
  About: React.lazy(() => import("./pages/User/Settings/About/About")),
  Favorites: React.lazy(() => import("./pages/User/Favorites/Favorites")),
  Messages: React.lazy(() => import("./pages/User/Messages/Messages")),
  History: React.lazy(() => import("./pages/User/History/History")),
  Admin: React.lazy(() => import("./pages/Admin/Admin")),
  ForumPublish: React.lazy(() => import("./pages/Publish/ForumPublish/ForumPublish")),
  ForumDetail: React.lazy(() => import("./pages/Forum/ForumDetail/ForumDetail")),
  Dashboard: React.lazy(() => import("./pages/Admin/Dashboard/Dashboard")),
  AdminMessages: React.lazy(() => import("./pages/Admin/Messages/Messages")),
  AdminMarket: React.lazy(() => import("./pages/Admin/Market/Market")),
  AdminForum: React.lazy(() => import("./pages/Admin/Forum/Forum")),
  PCPage: React.lazy(() => import("./pages/PCPage/PCPage")),
  Entry: React.lazy(() => import("./components/Loading/Entry/Entry")),
  LoadingMarket: React.lazy(() => import("./components/Loading/Market/Market")),
  LoadingForum: React.lazy(() => import("./components/Loading/Forum/Forum")),
  LoadingUser: React.lazy(() => import("./components/Loading/User/User")),
};

const App: React.FC = () => {
  // 检查是否登录并获取用户信息
  const token = Cookies.get("auth-token");
  const [showOrientationOverlay, setShowOrientationOverlay] = useState(false);
  const [userDismissedOverlay, setUserDismissedOverlay] = useState(false);
  const [showEntry, setShowEntry] = useState(true);
  const [entryFadingOut, setEntryFadingOut] = useState(false);

  // Entry 加载动画
  useEffect(() => {
    const ENTRY_DISPLAY_TIME = 1500; // Entry 显示 1.5 秒
    const ENTRY_FADE_OUT_TIME = 500; // Entry 淡出动画 0.5 秒

    const entryTimer = setTimeout(() => {
      setEntryFadingOut(true);
      
      setTimeout(() => {
        setShowEntry(false);
      }, ENTRY_FADE_OUT_TIME);
    }, ENTRY_DISPLAY_TIME);

    return () => clearTimeout(entryTimer);
  }, []);

  // 仅在移动端开启竖屏监控和提示
  useEffect(() => {
    const isMobileDevice = window.innerWidth < 768;
    if (!isMobileDevice) {
      setShowOrientationOverlay(false);
      return;
    }

    const handleOrientationChange = () => {
      // 使用多种方式检测横屏状态，提高准确性
      const isLandscapeByMediaQuery = window.matchMedia("(orientation: landscape)").matches;
      const isLandscapeByDimensions = window.innerWidth > window.innerHeight;
      const isLandscape = isLandscapeByMediaQuery || isLandscapeByDimensions;
      
      if (isLandscape && !userDismissedOverlay) {
        setShowOrientationOverlay(true);
      } else if (!isLandscape) {
        setShowOrientationOverlay(false);
        // 重置用户关闭状态，当回到竖屏时允许再次显示
        setUserDismissedOverlay(false);
      }
    };

    // 添加防抖处理，避免频繁触发
    let timeoutId: NodeJS.Timeout;
    const debouncedOrientationChange = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleOrientationChange, 100);
    };

    window.addEventListener("resize", debouncedOrientationChange);
    window.addEventListener("orientationchange", debouncedOrientationChange);

    // 初始检测
    handleOrientationChange();

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedOrientationChange);
      window.removeEventListener("orientationchange", debouncedOrientationChange);
    };
  }, [userDismissedOverlay]);

  // 处理用户手动关闭方向提示
  const handleCloseOrientationOverlay = () => {
    setShowOrientationOverlay(false);
    setUserDismissedOverlay(true);
  };

  useEffect(() => {
    // 使用AbortController提供更好的请求取消机制
    const abortController = new AbortController();
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 重试延迟时间

    const fetchUserProfileWithRetry = async () => {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        // 检查是否已被取消
        if (abortController.signal.aborted) {
          console.log("请求已被取消");
          return;
        }

        try {
          console.log(`尝试获取用户信息 (第${attempt + 1}/${MAX_RETRIES}次)`);

          // 传递abort信号给请求（如果fetchUserProfile支持的话）
          await useUserStore.getState().fetchUserProfile();

          console.log("✅ 用户信息获取成功");
          return; // 成功后退出

        } catch (error) {
          const isLastAttempt = attempt === MAX_RETRIES - 1;

          console.error(`❌ 获取用户信息失败 (第${attempt + 1}次):`, error);

          // 如果是网络错误且不是最后一次尝试，继续重试
          if (!isLastAttempt && !abortController.signal.aborted) {
            console.log(`⏳ ${RETRY_DELAY / 1000}秒后重试...`);

            // 可被中断的延迟
            await new Promise((resolve, reject) => {
              const timeoutId = setTimeout(resolve, RETRY_DELAY);
              abortController.signal.addEventListener('abort', () => {
                clearTimeout(timeoutId);
                reject(new Error('Request aborted'));
              });
            }).catch(() => {
              // 被中断时不做任何处理
              return;
            });
          }
        }
      }

      // 所有重试失败后的处理
      if (!abortController.signal.aborted) {
        console.error("🚫 达到最大重试次数，用户信息获取失败");

        // 检查是否是认证问题
        const isAuthError = !useUserStore.getState().currentUser;

        if (isAuthError) {
          message.error("登录已过期，请重新登录");
          Cookies.remove("auth-token");
          // 重定向到登录页（App组件在Router外部，使用window.location是合理的）
          setTimeout(() => {
            window.location.href = '/auth/login';
          }, 2000);
        } else {
          message.warning("获取用户信息失败，请检查网络连接");
        }
      }
    };

    // ✅ 只有存在有效token时才尝试获取
    if (token && token.trim()) {
      fetchUserProfileWithRetry();
    }

    // ✅ 清理函数
    return () => {
      console.log("🧹 清理用户信息获取请求");
      abortController.abort();
    };
  }, [token]);


  // 路由表抽离为常量
  const mobileRoutes = useMemo(() => [
    { path: "*", element: <Navigate to="/market" replace /> },
    { path: "/auth/login", element: <Lazy.Login /> },
    { path: "/auth/register", element: <Lazy.Register /> },
    { path: "/user/settings/reset/:type", element: <Lazy.Reset /> },
    { path: "/user/settings/about", element: <Lazy.About /> },
    { 
      path: "/market", 
      element: (
        <LoadingManager>
          <Lazy.Market />
        </LoadingManager>
      ) 
    },
    { path: "/market/:goodsId", element: <Lazy.Detail /> },
    { path: "/market/:goodsId/appeal/:goodsTitle", element: <Lazy.DetailAppeal /> },
    { 
      path: "/forum", 
      element: (
        <LoadingManager>
          <Lazy.Forum />
        </LoadingManager>
      ) 
    },
    { path: "/forum-detail", element: <Lazy.ForumDetail /> },
    { path: "/publish/market-publish-choice", element: <Lazy.MarketPublishChoice /> },
    { path: "/publish/market-publish-ai", element: <Lazy.MarketPublish /> },
    { path: "/publish/forum-publish", element: <Lazy.ForumPublish /> },
    { path: "/publish/market-publish-basic", element: <Lazy.Template /> },
    { 
      path: "/user", 
      element: (
        <LoadingManager>
          <Lazy.User />
        </LoadingManager>
      ) 
    },
    { path: "/user/favorites", element: <Lazy.Favorites /> },
    { path: "/user/messages", element: <Lazy.Messages /> },
    { path: "/user/history", element: <Lazy.History /> },
    { path: "/user/settings", element: <Lazy.Settings /> },
    { path: "test", element: <Lazy.LoadingUser /> }
  ], []);

  const webRoutes = useMemo(() => [
    {
      path: "/auth/admin/register",
      element: <Lazy.AdminRegister />
    },
    {
      path: "/admin",
      element: (
        (
          <ProtectedRoute>
            <Lazy.Admin />
          </ProtectedRoute>
        )
      )
    },
    {
      path: "/pc-page",
      element: <Lazy.PCPage />
    },
    {
      path: "*",
      element: (
        <ProtectedRoute>
          <Lazy.Admin />
        </ProtectedRoute>
      ),
    }
  ], []);

  const mobileRouter = useMemo(() => createBrowserRouter(mobileRoutes), [mobileRoutes]);
  const webRouter = useMemo(() => createBrowserRouter(webRoutes), [webRoutes]);

  const isMobile = useScreenType(768);
  console.log(useScreenType(768), '移动端', isMobile);

  return (
    <div className="App">
      {/* Entry 欢迎页 - 首次加载 */}
      {showEntry && (
        <div className={`entry-overlay ${entryFadingOut ? 'fade-out' : ''}`}>
          <Lazy.Entry />
        </div>
      )}
      <React.Suspense fallback={<div style={{ display: 'none' }}>加载中...</div>}>
        <RouterProvider router={isMobile ? mobileRouter : webRouter} />
      </React.Suspense>
      {/* 横屏提示蒙版 - 仅在移动端横屏时显示 */}
      {isMobile && showOrientationOverlay && (
        <SwitchDirection onClose={handleCloseOrientationOverlay} />
      )}
    </div>
  );
};

export default App;
