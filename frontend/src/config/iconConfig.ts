/**
 * 图标配置文件
 * 统一管理项目中所有图标资源，支持 SVG 和 iconfont 两种方案
 * 
 * 使用方式：
 * import Icon from '@/components/Icon/Icon';
 * <Icon name="search" size={24} />
 * 
 * 切换方案：
 * 修改 .env.development 或 .env.production 中的 REACT_APP_ICON_TYPE
 * - svg: 使用 SVG 图标（默认）
 * - iconfont: 使用字体图标
 */

// 导入所有 SVG 图标
import SearchWhite from '../assets/search-white.svg';
import Search from '../assets/search-white.svg';
import LeftWhite from '../assets/left-white.svg';
import LeftBlack from '../assets/left-black.svg';
import RightBlack from '../assets/right-black.svg';
import ShareBlack from '../assets/share-black.svg';
import CopyBlack from '../assets/copy-black.svg';
import DropBlack from '../assets/drop-black.svg';
import FavoritesBlack from '../assets/favorites-black.svg';
import HistoryBlack from '../assets/history-black.svg';
import MessagesRead from '../assets/messages-read.svg';
import MessagesUnread from '../assets/messages-unread.svg';
import Settings from '../assets/settings.svg';
import AboutBlack from '../assets/about-black.svg';
import LogoutBlack from '../assets/logout-black.svg';
import LogoutWhite from '../assets/logout-white.svg';
import MarketWhiteActive from '../assets/market-white-active.svg';
import MarketWhite from '../assets/market-white.svg';
import ForumWhiteActive from '../assets/forum-white-active.svg';
import ForumWhite from '../assets/forum-white.svg';
import UserBlue from '../assets/user-blue.svg';
import UserWhiteActive from '../assets/user-white-active.svg';
import UserWhite from '../assets/user-white.svg';
import PublishBlack from '../assets/publish-black.svg';
import PublishWhiteActive from '../assets/publish-white-active.svg';
import PublishWhite from '../assets/publish-white.svg';
import AddWhite from '../assets/add-white.svg';
import LikeFalse from '../assets/like-false.svg';
import LikeTrue from '../assets/like-true.svg';
import Like from '../assets/like.svg';
import Liked from '../assets/liked.svg';
import DislikeFalse from '../assets/dislike-false.svg';
import DislikeTrue from '../assets/dislike-true.svg';
import Star from '../assets/star.svg';
import Stared from '../assets/stared.svg';
import Link from '../assets/link.svg';
import Refresh from '../assets/refresh.svg';
import CloseBlack from '../assets/close-black.svg';
import AiPublish from '../assets/ai-publish.svg';
import BasicPublish from '../assets/basic-publish.svg';
import Goods from '../assets/goods.svg';
import Comment from '../assets/comment.svg';
import All from '../assets/all.svg';

/**
 * 图标类型
 */
export type IconType = 'svg' | 'iconfont';

/**
 * 图标名称类型
 */
export type IconName = keyof typeof iconMap;

/**
 * 图标配置接口
 */
interface IconConfig {
  iconfont: string; // iconfont 类名
  svg: string; // SVG 文件路径
}

/**
 * 图标映射表
 * 每个图标都需要配置 iconfont 和 svg 两种方案
 */
export const iconMap: Record<string, IconConfig> = {
  // 搜索
  'search-white': {
    iconfont: 'icon-search',
    svg: SearchWhite,
  },
  'search': { // 别名，默认使用黑色搜索图标
    iconfont: 'icon-search',
    svg: Search,
  },

  // 导航箭头
  'left-white': {
    iconfont: 'icon-left',
    svg: LeftWhite,
  },
  'left': { // 别名，默认使用黑色左箭头
    iconfont: 'icon-left',
    svg: LeftBlack,
  },
  'right': {
    iconfont: 'icon-right',
    svg: RightBlack,
  },

  // 分享、复制、更多
  'share': {
    iconfont: 'icon-share',
    svg: ShareBlack,
  },
  'copy': {
    iconfont: 'icon-copy',
    svg: CopyBlack,
  },
  'drop': {
    iconfont: 'icon-drop',
    svg: DropBlack,
  },
  'more': {
    iconfont: 'icon-more',
    svg: DropBlack, // 使用 drop 作为 more 的图标
  },

  // 用户功能
  'favorites': {
    iconfont: 'icon-favorites',
    svg: FavoritesBlack,
  },
  'history': {
    iconfont: 'icon-history',
    svg: HistoryBlack,
  },
  'messages': {
    iconfont: 'icon-messages',
    svg: MessagesUnread,
  },
  'messages-read': {
    iconfont: 'icon-messages-read',
    svg: MessagesRead,
  },
  'settings-simple': {
    iconfont: 'icon-settings',
    svg: Settings,
  },
  'settings': {
    iconfont: 'icon-settings',
    svg: Settings,
  },
  'about': {
    iconfont: 'icon-about',
    svg: AboutBlack,
  },
  'logout': {
    iconfont: 'icon-logout',
    svg: LogoutBlack,
  },
  'logout-white': {
    iconfont: 'icon-logout',
    svg: LogoutWhite,
  },

  // 底部导航 - 商城
  'market-white': {
    iconfont: 'icon-market',
    svg: MarketWhite,
  },
  'market-white-active': {
    iconfont: 'icon-market-active',
    svg: MarketWhiteActive,
  },
  'market': { // 别名
    iconfont: 'icon-market',
    svg: MarketWhite,
  },
  'market-active': { // 别名
    iconfont: 'icon-market-active',
    svg: MarketWhiteActive,
  },

  // 底部导航 - 论坛
  'forum-white': {
    iconfont: 'icon-forum',
    svg: ForumWhite,
  },
  'forum-white-active': {
    iconfont: 'icon-forum-active',
    svg: ForumWhiteActive,
  },
  'forum': { // 别名
    iconfont: 'icon-forum',
    svg: ForumWhite,
  },
  'forum-active': { // 别名
    iconfont: 'icon-forum-active',
    svg: ForumWhiteActive,
  },

  // 底部导航 - 用户
  'user-active': {
    iconfont: 'icon-user-active',
    svg: UserBlue,
  },
  'user-white': {
    iconfont: 'icon-user',
    svg: UserWhite,
  },
  'user-white-active': {
    iconfont: 'icon-user-active',
    svg: UserWhiteActive,
  },
  'user': { // 别名
    iconfont: 'icon-user',
    svg: UserWhite,
  },

  // 底部导航 - 发布
  'publish': {
    iconfont: 'icon-publish',
    svg: PublishBlack,
  },
  'publish-white': {
    iconfont: 'icon-publish',
    svg: PublishWhite,
  },
  'publish-white-active': {
    iconfont: 'icon-publish-active',
    svg: PublishWhiteActive,
  },

  // 添加按钮
  'add': {
    iconfont: 'icon-add',
    svg: AddWhite,
  },

  // 点赞/点踩
  'like': {
    iconfont: 'icon-like',
    svg: LikeFalse, // 蓝色点赞（未激活）
  },
  'like-active': {
    iconfont: 'icon-like-active',
    svg: LikeTrue, // 蓝色点赞（已激活）
  },
  'like-true': { // 别名，蓝色点赞激活状态
    iconfont: 'icon-like-active',
    svg: LikeTrue,
  },
  'like-false': { // 别名，蓝色点赞未激活状态
    iconfont: 'icon-like',
    svg: LikeFalse,
  },
  'liked': { // 别名，蓝色点赞激活状态
    iconfont: 'icon-like-active',
    svg: LikeTrue,
  },
  'like2': {
    iconfont: 'icon-like2',
    svg: Like, // 红色心形（未激活）
  },
  'like2-active': {
    iconfont: 'icon-like2-active',
    svg: Liked, // 红色心形（已激活）
  },
  'liked2': { // 别名，红色心形激活状态
    iconfont: 'icon-like2-active',
    svg: Liked,
  },
  'dislike': {
    iconfont: 'icon-dislike',
    svg: DislikeFalse, // 点踩（未激活）
  },
  'dislike-active': {
    iconfont: 'icon-dislike-active',
    svg: DislikeTrue, // 点踩（已激活）
  },
  'dislike-true': { // 别名，点踩激活状态
    iconfont: 'icon-dislike-active',
    svg: DislikeTrue,
  },
  'dislike-false': { // 别名，点踩未激活状态
    iconfont: 'icon-dislike',
    svg: DislikeFalse,
  },
  'disliked': { // 别名，点踩激活状态
    iconfont: 'icon-dislike-active',
    svg: DislikeTrue,
  },

  // 收藏/星标
  'star': {
    iconfont: 'icon-star',
    svg: Star,
  },
  'star-active': {
    iconfont: 'icon-star-active',
    svg: Stared,
  },
  'favorited': { // 别名，表示已收藏状态
    iconfont: 'icon-star-active',
    svg: Stared,
  },
  'favorite': { // 别名，表示未收藏状态
    iconfont: 'icon-star',
    svg: Star,
  },

  // 其他功能
  'link': {
    iconfont: 'icon-link',
    svg: Link,
  },
  'refresh': {
    iconfont: 'icon-refresh',
    svg: Refresh,
  },
  'close': {
    iconfont: 'icon-close',
    svg: CloseBlack,
  },

  // 发布类型
  'ai-publish': {
    iconfont: 'icon-ai',
    svg: AiPublish,
  },
  'basic-publish': {
    iconfont: 'icon-basic',
    svg: BasicPublish,
  },

  // 筛选/分类相关
  'all': {
    iconfont: 'icon-all',
    svg: All, // 全部图标
  },
  'appeal': {
    iconfont: 'icon-appeal',
    svg: MessagesUnread, // 暂时使用 messages 图标
  },
  'reply': {
    iconfont: 'icon-reply',
    svg: MessagesRead, // 暂时使用 messages-read 图标
  },

  // 管理和内容类型
  'manage': { // 管理图标，使用 settings 图标
    iconfont: 'icon-settings',
    svg: Settings,
  },
  'goods': { // 商品图标
    iconfont: 'icon-goods',
    svg: Goods,
  },
  'post': { // 帖子图标
    iconfont: 'icon-post',
    svg: Comment,
  },
};

/**
 * 获取当前使用的图标方案
 * 默认使用 svg，可通过环境变量 REACT_APP_ICON_TYPE 切换
 */
export const getIconType = (): IconType => {
  const envType = process.env.REACT_APP_ICON_TYPE as IconType;
  return envType === 'iconfont' || envType === 'svg' ? envType : 'svg';
};

/**
 * 获取图标配置
 */
export const getIconConfig = (name: IconName): IconConfig | undefined => {
  return iconMap[name];
};

/**
 * 获取图标资源
 * 根据当前配置返回对应的图标资源
 */
export const getIcon = (name: IconName): string => {
  const config = getIconConfig(name);
  if (!config) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return '';
  }
  
  const iconType = getIconType();
  return iconType === 'svg' ? config.svg : config.iconfont;
};
