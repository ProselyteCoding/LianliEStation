import { create } from 'zustand';
import { persist } from 'zustand/middleware';  // 可选：添加持久化

type CallbackFn = (uploadPage?: number) => void;  // 修复：返回 void

interface ScrollerState {
  currentPath: string;
  currentPage: number;  // 当前页码（临时）
  currentScroller: number;  // 当前滚动（临时）
  currentBannerHeight: number;  // 当前 banner 高度（临时）
  pageStates: Record<string, number>;  // 路径 → 页码
  scrollStates: Record<string, number>;  // 路径 → 滚动
  bannerHeights: Record<string, number>;  // 路径 → banner 高度
  setPage: (page: number) => void;
  setScroller: (scroller: number) => void;
  setBannerHeight: (height: number) => void;  // 设置 banner 高度
  updatePath: (path: string) => void;
  restoreMutiPage: (callback: CallbackFn) => Promise<number>;
  restoreSinglePage: () => number;  // 无 callback，简化
  getBannerHeight: () => number;  // 获取当前路径的 banner 高度
}

const useScrollerStore = create<ScrollerState>()(
    (set, get) => ({
      currentPath: '',
      currentPage: 1,
      currentScroller: 0,
      currentBannerHeight: 0,
      pageStates: {},  // { '/page1': 3 }
      scrollStates: {},  // { '/page1': 100 }
      bannerHeights: {},  // { '/page1': 200 }
      updatePath: (path: string) => {
        const oldPath = get().currentPath;
        if (oldPath) {
          // 保存旧状态
          set((state) => ({
            ...state,
            pageStates: { ...state.pageStates, [oldPath]: state.currentPage },
            scrollStates: { ...state.scrollStates, [oldPath]: state.currentScroller },
            bannerHeights: { ...state.bannerHeights, [oldPath]: state.currentBannerHeight },
          }));
        }
        set({ currentPath: path });
      },
      setPage: (page: number) => {
        const currentPath = get().currentPath;
        set((state) => ({
          ...state,
          currentPage: page,  // 更新临时值
          pageStates: { ...state.pageStates, [currentPath]: page },  // 按路径存储
        }));
      },
      setScroller: (scroller: number) => {
        const currentPath = get().currentPath;
        set((state) => ({
          ...state,
          currentScroller: scroller,
          scrollStates: { ...state.scrollStates, [currentPath]: scroller },
        }));
      },
      setBannerHeight: (height: number) => {
        const currentPath = get().currentPath;
        set((state) => ({
          ...state,
          currentBannerHeight: height,
          bannerHeights: { ...state.bannerHeights, [currentPath]: height },
        }));
      },
      getBannerHeight: () => {
        const { currentPath, bannerHeights } = get();
        return bannerHeights[currentPath] || 0;
      },
      restoreMutiPage: async (callback: CallbackFn) => {
        const { currentPath, pageStates } = get();
        const maxPage = pageStates[currentPath] || 1;  // 从存储恢复
        for (let i = 1; i <= maxPage; i++) {
          await callback(i);  // 修复：用 i
          await new Promise((resolve) => setTimeout(resolve, 100));  // 模拟间隔
        }
        console.log(get().scrollStates)
        return get().scrollStates[currentPath] || 0;  // 修复：路径键
      },
      restoreSinglePage:() => {
        const { currentPath, scrollStates } = get();
        return scrollStates[currentPath] || 0;  // 修复：路径键 + 逗号
      },
    })  
);

export default useScrollerStore;