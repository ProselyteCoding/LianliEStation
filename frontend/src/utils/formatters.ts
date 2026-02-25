/**
 * 格式化工具函数
 * 提供常用的数据格式化，保持显示一致性
 */

// 价格格式化 - 智能显示小数
export const formatPrice = (price: number | string): string => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // 如果是整数，不显示小数点
  if (Number.isInteger(numPrice)) {
    return `${numPrice}`;
  }
  
  // 有小数，保留最多两位，去除尾部零
  const formatted = numPrice.toFixed(2).replace(/\.?0+$/, '');
  return formatted;
};

// 校区ID转简称
export const getCampusShort = (campusId: number): string => {
  const campusMap: Record<number, string> = {
    1: '凌',
    2: '开',
    3: '盘'
  };
  return campusMap[campusId] || '?';
};

// 文件大小格式化
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

// 文本截断
export const truncateText = (text: string, maxLength: number = 20): string => {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

// 校区ID转名称
export const getCampusName = (campusId: number): string => {
  const campusMap: Record<number, string> = {
    1: '凌水校区',
    2: '开发区校区',
    3: '盘锦校区'
  };
  return campusMap[campusId] || '未知校区';
};

/**
 * 时间格式化
 * 将ISO时间字符串转换为标准格式
 * @param dateStr - ISO格式的时间字符串
 * @param format - 格式化后的字符串格式，默认为"YYYY-MM-DD HH:mm"
 * @returns - 格式化后的字符串
 */
export function timeFormat(
  dateStr: string | undefined,
  format: string = "YYYY-MM-DD HH:mm"
): string {
  if (dateStr) {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    const padZero = (num: number): string =>
      num < 10 ? "0" + num : num.toString();

    switch (format) {
      case "YYYY-MM-DD HH:mm":
        return `${year}.${month}.${day} ${padZero(hours)}:${padZero(minutes)}`;
      case "YYYY-MM-DD HH":
        return `${year}.${month}.${day} ${padZero(hours)}`;
      case "YYYY-MM-DD":
        return `${year}.${month}.${day}`;
      case "YYYY-MM":
        return `${year}.${month}`;
      case "MM-DD HH:mm":
        return `${month}.${day} ${padZero(hours)}:${padZero(
          minutes
        )}`;
      case "MM-DD":
        return `${month}.${day}`;
      default:
        return `${year}.${month}.${day} ${padZero(hours)}:${padZero(minutes)}`;
    }
  } else return "日期获取失败";
}
