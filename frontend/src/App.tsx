import React, { useEffect } from "react";
import Cookies from "js-cookie";
import "./App.scss";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { useUserStore } from "./store";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute"; //保护路由，未登录将只能导航至login和register页面
//懒加载不同页面
const Market = React.lazy(() => import("./pages/Market/Market"));
const Detail = React.lazy(() => import("./pages/Market/Detail/Detail"));
const DetailAppeal = React.lazy(
  () => import("./pages/Market/Detail/DetailAppeal")
);
const MarketPublishChoice = React.lazy(
  () =>
    import(
      "./pages/Publish/MarketPublish/MarketPublishChoice/MarketPublishChoice"
    )
);
const MarketPublish = React.lazy(
  () => import("./pages/Publish/MarketPublish/MarketPublish")
);
const Template = React.lazy(
  () => import("./pages/Publish/MarketPublish/Template/Template")
);
const Login = React.lazy(() => import("./pages/Auth/Login/Login"));
const Register = React.lazy(() => import("./pages/Auth/Register/Register"));
const Reset = React.lazy(() => import("./pages/User/Settings/Reset/Reset"));
const User = React.lazy(() => import("./pages/User/User"));
const Forum = React.lazy(() => import("./pages/Forum/Forum"));
const ForumDisable = React.lazy(() => import("./pages/ForumDisable/Forum"));
const Settings = React.lazy(() => import("./pages/User/Settings/Settings"));
const About = React.lazy(() => import("./pages/User/Settings/About/About"));
const Favorites = React.lazy(() => import("./pages/User/Favorites/Favorites"));
const Messages = React.lazy(() => import("./pages/User/Messages/Messages"));
const History = React.lazy(() => import("./pages/User/History/History"));
const Admin = React.lazy(() => import("./pages/Admin/Admin"));
const MData = React.lazy(() => import("./pages/Admin/MData/MData"));
const MUsers = React.lazy(() => import("./pages/Admin/MUsers/MUsers"));
const ForumPublish = React.lazy(
  () => import("./pages/Publish/ForumPublish/ForumPublish")
);
const ForumDetail = React.lazy(
  () => import("./pages/Forum/ForumDetail/ForumDetail")
);

const App: React.FC = () => {
  // 检查是否登录并获取用户信息
  const { isAuthenticated } = useUserStore();
  const token = Cookies.get("auth-token");

  // // 锁定竖屏
  // const lockOrientation = () => {
  //   if (window.screen.orientation && window.screen.orientation.lock) {
  //     window.screen.orientation.lock("portrait").catch((err) => {
  //       console.error("锁定竖屏失败:", err);
  //     });
  //   }
  // };

  // // 监听屏幕方向变化
  // useEffect(() => {
  //   const handleOrientationChange = () => {
  //     if (window.matchMedia("(orientation: landscape)").matches) {
  //       alert("请将设备旋转到竖屏模式以获得最佳体验。");
  //       lockOrientation(); // 尝试锁定竖屏
  //     }
  //   };

  //   // 绑定事件监听器
  //   window.addEventListener("resize", handleOrientationChange);
  //   window.addEventListener("orientationchange", handleOrientationChange);

  //   // 在组件卸载时移除监听器
  //   return () => {
  //     window.removeEventListener("resize", handleOrientationChange);
  //     window.removeEventListener("orientationchange", handleOrientationChange);
  //   };
  // }, []);

  useEffect(() => {
    let cancelled = false;
    const MAX_RETRIES = 5;

    const tryFetchUserProfileAndLikes = async () => {
      let retries = 0;
      while (!cancelled && retries < MAX_RETRIES) {
        try {
          // 并行请求用户信息和点赞/投诉信息
          await Promise.all([
            useUserStore.getState().fetchUserProfile(),
            useUserStore.getState().fetchLikesComplaints(),
          ]);

          // 成功获取用户信息和点赞/投诉信息，退出循环；否则被catch捕获并继续重试直至请求成功或达到最大重试次数
          break;
        } catch (e) {
          console.error("获取用户信息或点赞/投诉信息失败:", e);
        }
        retries++;
        await new Promise((res) => setTimeout(res, 1000));
      }
      if (retries === MAX_RETRIES) {
        alert("获取用户信息或点赞/投诉信息失败，请检查网络或稍后重试。");
      }
    };

    if (token) {
      tryFetchUserProfileAndLikes();
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, token]);

  const router = createBrowserRouter([
    {
      path: "*",
      element: isAuthenticated ? (
        <Navigate to="/market" replace />
      ) : (
        <Navigate to="/auth/login" replace />
      ),
    },
    {
      path: "/auth/login",
      element: <Login />,
    },
    {
      path: "/auth/register",
      element: <Register />,
    },
    {
      path: "/user/settings/reset/:type",
      element: <Reset />,
    },
    {
      path: "/user/settings/about",
      element: (
        <ProtectedRoute>
          <About />
        </ProtectedRoute>
      ),
    },
    {
      path: "/market",
      element: (
        <ProtectedRoute>
          <Market />
        </ProtectedRoute>
      ),
    },
    {
      path: "/market/:goodsId",
      element: (
        <ProtectedRoute>
          <Detail />
        </ProtectedRoute>
      ),
    },
    {
      path: "/market/:goodsId/appeal/:goodsTitle",
      element: (
        <ProtectedRoute>
          <DetailAppeal />
        </ProtectedRoute>
      ),
    },
    {
      path: "/forum",
      element: (
        <ProtectedRoute>
          <Forum />
        </ProtectedRoute>
      ),
    },
    {
      path: "/forum-test",
      element: (
        <ProtectedRoute>
          <ForumDisable />
        </ProtectedRoute>
      ),
    },
    {
      path: "/forum-detail",
      element: (
        <ProtectedRoute>
          <ForumDetail />
        </ProtectedRoute>
      ),
    },
    {
      path: "/publish/market-publish-choice",
      element: (
        <ProtectedRoute>
          <MarketPublishChoice />
        </ProtectedRoute>
      ),
    },
    {
      path: "/publish/market-publish-ai",
      element: (
        <ProtectedRoute>
          <MarketPublish />
        </ProtectedRoute>
      ),
    },
    {
      path: "/publish/forum-publish",
      element: (
        <ProtectedRoute>
          <ForumPublish />
        </ProtectedRoute>
      ),
    },
    {
      path: "/publish/market-publish-basic",
      element: (
        <ProtectedRoute>
          <Template />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user",
      element: (
        <ProtectedRoute>
          <User />
        </ProtectedRoute>
      ),
    },
    {
      path: "/user/favorites",
      element: (
        <ProtectedRoute>
          <Favorites />
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
    {
      path: "/admin",
      element: (
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/data",
      element: (
        <ProtectedRoute>
          <MData />
        </ProtectedRoute>
      ),
    },
    {
      path: "/admin/users",
      element: (
        <ProtectedRoute>
          <MUsers />
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
