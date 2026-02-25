import { createContext, ReactNode, useContext, useState,useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";  // 如果用 React Router 获取页面路径

const ScrollerMemoryContext = createContext({
  saveScrollerState:()=>{},
  savePageState:(page:number)=>{},
  getScrollerState:()=>{},
  getPageState:()=>1,
});

export const ScrollerMemoryProvider = ({children}:{children:ReactNode}) => {
  const [scrollState, setScrollStates] = useState<Record<string,number>>({});  // { '/page1': 100, '/page2': 200 }
  const [pageState, setPageState] = useState<Record<string,number>>({})

  const currentLocation = useLocation()

  const saveScrollerState = useCallback(() => {
    const currentPath = useLocation().pathname;  // 或用其他方式获取页面键
    setScrollStates(prev => ({ ...prev, [currentPath]: window.scrollY }));
  },[currentLocation.pathname]);

  const savePageState = useCallback((page:number) =>{
    const currentPath = useLocation().pathname
    const currentPage = page
    setPageState(perv=>({...perv,[currentPath]:page}))
  },[currentLocation.pathname])

  const getScrollerState = useCallback(() => {
    const currentPath = useLocation().pathname;
    const savedScroll = scrollState[currentPath] || 0;
    return savedScroll
  },[currentLocation.pathname]);

  const getPageState = useCallback(() => {
    const currentPath = useLocation().pathname
    const savedPage = pageState[currentPath] || 0
    return savedPage
  },[currentLocation.pathname])

  const value = useMemo(()=>({
      saveScrollerState:()=>{},
      savePageState:(page:number)=>{},
      getScrollerState:()=>{},
      getPageState:()=>1,
  }),[scrollState,])
  return (
    <ScrollerMemoryContext.Provider value={value}>
      {children}
    </ScrollerMemoryContext.Provider>
  );
};

export const useScrollerMemory = ()=>{
    const {saveScrollerState,getScrollerState,getPageState,savePageState} =useContext(ScrollerMemoryContext)
    
    const restoreMutiPage = ()=>{
      const scroller = getScrollerState()

      


    }

}
