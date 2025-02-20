import React, { useEffect } from "react";
import "./App.scss";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useAuthStore, useUserStore } from "./store";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"; //保护路由，未登录将只能导航至login和register页面
//懒加载不同页面
const Market = React.lazy(() => import("./pages/Market/Market"));
const Detail = React.lazy(() => import("./pages/Detail/Detail"));
const Post = React.lazy(() => import("./pages/Post/Post"));
const Template = React.lazy(() => import("./pages/Template/Template"));
const Login = React.lazy(() => import("./pages/Login/Login"));
const Register = React.lazy(() => import("./pages/Register/Register"));
const Reset = React.lazy(() => import("./pages/Reset/Reset"));
const User = React.lazy(() => import("./pages/User/User"));
const Forum = React.lazy(() => import("./pages/Forum/Forum"));
const Settings = React.lazy(() => import("./pages/Settings/Settings"));
const Stars = React.lazy(() => import("./pages/Stars/Stars"));
const Messages = React.lazy(() => import("./pages/Messages/Messages"));
const History = React.lazy(() => import("./pages/History/History"));

const App: React.FC = () => {
  // 锁定竖屏
  const lockOrientation = () => {
    if (window.screen.orientation && window.screen.orientation.lock) {
      window.screen.orientation.lock("portrait").catch((err) => {
        console.error("锁定竖屏失败:", err);
      });
    }
  };

  // 监听屏幕方向变化
  useEffect(() => {
    const handleOrientationChange = () => {
      if (window.matchMedia("(orientation: landscape)").matches) {
        alert("请将设备旋转到竖屏模式以获得最佳体验。");
        lockOrientation(); // 尝试锁定竖屏
      }
    };

    // 绑定事件监听器
    window.addEventListener("resize", handleOrientationChange);
    window.addEventListener("orientationchange", handleOrientationChange);

    // 在组件卸载时移除监听器
    return () => {
      window.removeEventListener("resize", handleOrientationChange);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  // 检查是否登录并获取用户信息
  const { isAuthenticated } = useAuthStore();
  const { fetchUserProfile, getTheme } = useUserStore();
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile(); // 初始化 currentUser
      getTheme(); // 初始化 userTheme
      // console.log("已登录，获取用户信息");
    }
  }, [isAuthenticated]);

  const router = createBrowserRouter([
    {
      path: "*",
      element: isAuthenticated ? (
        <Navigate to="/user/market" replace />
      ) : (
        <Navigate to="/login" replace />
      ),
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/reset/:type",
      element: <Reset />,
    },
    {
      path: "/user/market",
      element: (
        <ProtectedRoute>
          <Market />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/market/:postId",
      element: (
        <ProtectedRoute>
          <Detail />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/forum",
      element: (
        <ProtectedRoute>
          <Forum />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/post",
      element: (
        <ProtectedRoute>
          <Post />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/post/template",
      element: (
        <ProtectedRoute>
          <Template />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/user",
      element: (
        <ProtectedRoute>
          <User />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/stars",
      element: (
        <ProtectedRoute>
          <Stars />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/messages",
      element: (
        <ProtectedRoute>
          <Messages />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/history",
      element: (
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/settings",
      element: (
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      ),
    },
  ]);

  return (
    <div className="App">
      <React.Suspense fallback={<div>加载中......请稍候......</div>}>
        <RouterProvider router={router} />
      </React.Suspense>
    </div>
  );
};

export default App;
