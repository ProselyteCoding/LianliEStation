// 用于处理防抖逻辑的自定义 Hook
// 该 Hook 可用于输入框监听、窗口尺寸监听、滚动监听、表单实时校验等场景，减少高频操作带来的性能问题
// 使用时传入需要防抖的值和延迟时间（毫秒）

import { useState, useEffect,useRef,useCallback } from "react";

function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function useDebouncedCallback<Fn extends (...args: any[]) => any>(
  fn: Fn,
  delay: number = 200
): Fn {
  const timerRef = useRef<NodeJS.Timeout | null>(null);  // 存储定时器ID

  return useCallback(
    (...args: Parameters<Fn>): void => {  // 返回防抖函数，类型推断参数
      // 清除旧定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 设置新定时器，执行原函数（带最新参数）
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]  // 依赖：fn变化时重创建防抖函数
  ) as Fn;  // 类型断言，确保返回类型与Fn一致
}

export { useDebounce, useDebouncedCallback };  // 导出多个
export default useDebounce;

// 使用方法示例：
// const debouncedSearch = useDebounce(searchValue, 500);
// useEffect(() => { fetchData(debouncedSearch); },