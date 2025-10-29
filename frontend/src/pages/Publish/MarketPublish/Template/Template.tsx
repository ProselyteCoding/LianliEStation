import React from 'react'
import './Template.scss'

import { useEffect, useReducer } from 'react'
import { useUserStore } from '../../../../store'
import useMainStore from '../../../../store/mainStore'
import { useLocation } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Navbar from '../../../../components/Navbar/Navbar'
import { Dropdown, Button, message, Modal } from 'antd'
import type { MenuProps } from 'antd'
// import { aiAPI } from '../../../../api'
import { px2rem } from '../../../../utils/rem'
import { useDebounce,useDebouncedCallback } from '../../../../hooks/useDebounce'

const initialState = {
  id: 1,
  title: '',
  content: '',
  author_id: null as number | null,
  create_at: '',
  status: "active",
  price: null as number | null,
  campus_id: 1,
  post_type: '买/卖',
  tag: '商品类型',
  images: [] as File[],
  previewImages: [] as string[],
  existingImages: [] as string[],
  error: null as string | null,
  campus_name: '校区选择',
  likes: 0,
  complaints: 0,
  isEdit: false,
  goods_id: null as number | null,
  fromAI: false, // 标记是否从AI发布页跳转
}

type Action =
  | { type: 'SET_POST_TYPE', payload: string }
  | { type: 'SET_TAG', payload: string }
  | { type: 'SET_CONTENT', payload: string }
  | { type: 'SET_TITLE', payload: string }
  | { type: 'SET_IMAGES', payload: File[] }
  | { type: 'SET_PREVIEW_IMAGES', payload: string[] }
  | { type: 'SET_EXISTING_IMAGES', payload: string[] }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_CAMPUS_ID', payload: number }
  | { type: 'SET_CAMPUS_NAME', payload: string }
  | { type: 'SET_AUTHOR_ID', payload: number | null }
  | { type: 'SET_CREATE_AT', payload: string }
  | { type: 'SET_PRICE', payload: number | null }
  | { type: 'SET_ID', payload: number }
  | { type: 'SET_STATUS', payload: string }
  | { type: 'SET_IS_EDIT', payload: boolean }
  | { type: 'SET_GOODS_ID', payload: number | null }
  | { type: 'SET_FROM_AI', payload: boolean }

const reducer = (state: typeof initialState, action: Action) => {
  switch (action.type) {
    case 'SET_ID':
      return {
        ...state,
        id: action.payload,
      }
    case 'SET_POST_TYPE':
      return {
        ...state,
        post_type: action.payload,
      }
    case 'SET_PRICE':
      return {
        ...state,
        price: action.payload,
      }
    case 'SET_TAG':
      return {
        ...state,
        tag: action.payload,
      }
    case 'SET_CONTENT':
      return {
        ...state,
        content: action.payload,
      }
    case 'SET_TITLE':
      return {
        ...state,
        title: action.payload,
      }
    case 'SET_IMAGES':
      return {
        ...state,
        images: action.payload,
      }
    case 'SET_PREVIEW_IMAGES':
      return {
        ...state,
        previewImages: action.payload,
      }
    case 'SET_EXISTING_IMAGES':
      return {
        ...state,
        existingImages: action.payload,
      }
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      }
    case 'SET_CAMPUS_ID':
      return {
        ...state,
        campus_id: action.payload,
      }
    case 'SET_CAMPUS_NAME':
      return {
        ...state,
        campus_name: action.payload,
      }
    case 'SET_AUTHOR_ID':
      return {
        ...state,
        author_id: action.payload,
      }
    case 'SET_CREATE_AT':
      return {
        ...state,
        create_at: action.payload,
      }
    case 'SET_STATUS':
      return {
        ...state,
        status: action.payload,
      }
    case 'SET_IS_EDIT':
      return {
        ...state,
        isEdit: action.payload,
      }
    case 'SET_GOODS_ID':
      return {
        ...state,
        goods_id: action.payload,
      }
    case 'SET_FROM_AI':
      return {
        ...state,
        fromAI: action.payload,
      }
    default:
      return state
  }
}


const Template = () => {
  const location = useLocation()
  const templateData = location.state as any
  const [state, dispatch] = useReducer(reducer, initialState)

  const initialPostType = (value: string) => {
    dispatch({ type: 'SET_POST_TYPE', payload: value })
  }
  const initialTag = (value: string) => {
    dispatch({ type: 'SET_TAG', payload: value })
  }
  const initialContent = (value: string) => {
    dispatch({ type: 'SET_CONTENT', payload: value })
  }
  const initialTitle = (value: string) => {
    dispatch({ type: 'SET_TITLE', payload: value })
  }
  const initialPrice = (value: number) => {
    dispatch({ type: 'SET_PRICE', payload: value })
  }
  const setPrice = (value: number | null) => {
    dispatch({ type: 'SET_PRICE', payload: value })
  }
  const setContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CONTENT', payload: e.target.value })
  }
  const setTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TITLE', payload: e.target.value })
  }

  const setCampusId = (value: number) => {
    dispatch({ type: 'SET_CAMPUS_ID', payload: value })
    dispatch({ type: 'SET_CAMPUS_NAME', payload: document.getElementById(value.toString())?.innerText ?? '校区选择' })
  }
  const setCampusName = (value: string) => {
    dispatch({ type: 'SET_CAMPUS_NAME', payload: value })
  }
  const setCreateAt = (value: string) => {
    dispatch({ type: 'SET_CREATE_AT', payload: value })
  }

  // 根据 campus_id 获取校区名称
  const getCampusName = (campusId: number): string => {
    const campusMap: { [key: number]: string } = {
      1: '凌水校区',
      2: '开发区校区',
      3: '盘锦校区'
    }
    return campusMap[campusId] || '校区选择'
  }

  const currentUser = useUserStore(state => state.currentUser)
  const publishMarketGoods = useMainStore(state => state.publishMarketGoods)
  const updateMarketGoods = useMainStore(state => state.updateMarketGoods)
  const navigate = useNavigate()

  useEffect(() => {
    setCreateAt(new Date().toISOString())
    
    // 如果是编辑模式，加载已有数据
    if (templateData?.isEdit) {
      dispatch({ type: 'SET_IS_EDIT', payload: true })
      dispatch({ type: 'SET_GOODS_ID', payload: templateData.goods_id })
      dispatch({ type: 'SET_STATUS', payload: templateData.status || 'active' })
      initialPostType(templateData?.post_type || 'receive')
      initialTag(templateData?.tag || '商品标签')
      initialContent(templateData?.content || '')
      initialTitle(templateData?.title || '')
      initialPrice(templateData?.price || 0)
      
      // 设置校区ID和名称
      const campusId = templateData?.campus_id || currentUser?.campus_id || 1
      dispatch({ type: 'SET_CAMPUS_ID', payload: campusId })
      dispatch({ type: 'SET_CAMPUS_NAME', payload: getCampusName(campusId) })
      
      // 将已有图片转换为预览URL格式（直接显示为服务器图片）
      if (templateData?.existingImages && templateData.existingImages.length > 0) {
        const serverImageUrls = templateData.existingImages.map(
          (url: string) => `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${url}`
        )
        dispatch({ type: 'SET_PREVIEW_IMAGES', payload: serverImageUrls })
        dispatch({ type: 'SET_EXISTING_IMAGES', payload: templateData.existingImages })
      }
    } else {
      // 新建模式，使用 AI 模板数据
      setCampusId(currentUser?.campus_id || 1)
      initialPostType(templateData?.post_type || 'receive')
      initialTag(templateData?.tag || '商品标签')
      initialContent(templateData?.details || '')
      initialTitle(templateData?.title || '')
      initialPrice(templateData?.price || 0)
      
      // 检查是否从AI页面跳转
      if (templateData?.fromAI) {
        dispatch({ type: 'SET_FROM_AI', payload: true })
      }
    }
  }, [currentUser?.campus_id, templateData])

  // 商品类型下拉菜单配置
  const postTypeItems: MenuProps['items'] = [
    {
      key: 'receive',
      label: '收',
      onClick: () => dispatch({ type: 'SET_POST_TYPE', payload: 'receive' })
    },
    {
      key: 'sell',
      label: '出',
      onClick: () => dispatch({ type: 'SET_POST_TYPE', payload: 'sell' })
    }
  ];

  // 商品标签下拉菜单配置
  const categoryItems: MenuProps['items'] = [
    {
      key: '学习资料',
      label: '学习资料',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '学习资料' })
    },
    {
      key: '生活用品',
      label: '生活用品',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '生活用品' })
    },
    {
      key: '代办跑腿',
      label: '代办跑腿',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '代办跑腿' })
    },
    {
      key: '咨询答疑',
      label: '咨询答疑',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '咨询答疑' })
    },
    {
      key: '零食',
      label: '零食',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '零食' })
    },
    {
      key: '账号会员',
      label: '账号会员',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '账号会员' })
    },
    {
      key: '数码电子',
      label: '数码电子',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '数码电子' })
    },
    {
      key: '其他',
      label: '其他',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '其他' })
    }
  ];

  // 校区下拉菜单配置
  const campusItems: MenuProps['items'] = [
    {
      key: '1',
      label: '凌水校区',
      onClick: () => {
        setCampusId(1);
        setCampusName('凌水校区');
      }
    },
    {
      key: '2',
      label: '开发区校区',
      onClick: () => {
        setCampusId(2);
        setCampusName('开发区校区');
      }
    },
    {
      key: '3',
      label: '盘锦校区',
      onClick: () => {
        setCampusId(3);
        setCampusName('盘锦校区');
      }
    }
  ];

  const {
    post_type,
    tag,
    content,
    title,
    images,
    previewImages,
    existingImages,
    campus_id,
    campus_name,
    price,
    status,
    isEdit,
    goods_id,
    fromAI,
  } = state

  // 文件上传处理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // 限制最多3张图片（基于当前显示的图片数量）
    const remainingSlots = 3 - previewImages.length;
    
    // 筛选有效图片文件
    const validFiles = files.slice(0, remainingSlots).filter(file => {
      if (file.type.startsWith('image/')) {
        return true;
      } else {
        message.error(`${file.name} 不是有效的图片文件`);
        return false;
      }
    });

    if (validFiles.length > 0) {
      const newImages = [...images, ...validFiles];
      dispatch({ type: 'SET_IMAGES', payload: newImages });
      
      // 生成预览图片URL
      const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
      const allPreviewUrls = [...previewImages, ...newPreviewUrls];
      dispatch({ type: 'SET_PREVIEW_IMAGES', payload: allPreviewUrls });
    }
  };

  // 删除图片（统一处理新上传和已有图片）
  const removeImage = (index: number) => {
    // 删除预览图片
    const newPreviewUrls = previewImages.filter((_, i) => i !== index);
    dispatch({ type: 'SET_PREVIEW_IMAGES', payload: newPreviewUrls });
    
    // 判断删除的是新上传的图片还是已有图片
    if (previewImages[index].startsWith('blob:')) {
      // 新上传的图片：清理blob URL并从images数组中删除
      URL.revokeObjectURL(previewImages[index]);
      // 计算在images数组中的实际索引
      const blobCount = previewImages.slice(0, index).filter(url => url.startsWith('blob:')).length;
      const newImages = images.filter((_, i) => i !== blobCount);
      dispatch({ type: 'SET_IMAGES', payload: newImages });
    } else {
      // 已有图片（服务器URL）：从existingImages中删除
      const serverUrlCount = previewImages.slice(0, index).filter(url => !url.startsWith('blob:')).length;
      const newExistingImages = existingImages.filter((_, i) => i !== serverUrlCount);
      dispatch({ type: 'SET_EXISTING_IMAGES', payload: newExistingImages });
    }
  };

  const handlePublish = async () => {
    // 验证所有必填字段
    if (!title.trim()) {
      message.warning('请输入商品标题');
      return;
    }
    
    if (tag === '商品标签') {
      message.warning('请选择商品标签');
      return;
    }
    
    if (campus_name === '校区选择') {
      message.warning('请选择校区');
      return;
    }
    
    if (price === null || price === undefined || price < 0) {
      message.warning('请输入有效的商品价格');
      return;
    }

    // // 敏感词检测
    // try {
    //   const textToCheck = `${title} ${content}`.trim();
      
    //   if (textToCheck) {
    //     message.loading({ content: '正在检测内容安全性...', key: 'sensitiveCheck' });
        
    //     const checkResult = await aiAPI.checkSensitive(textToCheck);
        
    //     message.destroy('sensitiveCheck');
        
    //     if (!checkResult.isSafe) {
    //       // 检测到敏感内容
    //       const warningMessage = checkResult.words && checkResult.words.length > 0
    //         ? `内容包含敏感词：${checkResult.words.join('、')}，请修改后再发布`
    //         : `${checkResult.reason}，请修改后再发布`;
          
    //       Modal.warning({
    //         title: '内容审核未通过',
    //         content: warningMessage,
    //         okText: '知道了',
    //       });
    //       return;
    //     }
        
    //     message.success({ content: '内容安全检测通过', duration: 1 });
    //   }
    // } catch (error: any) {
    //   message.destroy('sensitiveCheck');
    //   console.error('敏感词检测失败:', error);
      
    //   // 检测失败时询问用户是否继续
    //   const confirmed = await new Promise<boolean>((resolve) => {
    //     Modal.confirm({
    //       title: '敏感词检测失败',
    //       content: '无法完成内容安全检测，是否仍要继续发布？',
    //       okText: '继续发布',
    //       cancelText: '取消',
    //       onOk: () => resolve(true),
    //       onCancel: () => resolve(false),
    //     });
    //   });
      
    //   if (!confirmed) {
    //     return;
    //   }
    // }

    // 发布或更新商品
    try {
      let success = false;
      
      if (isEdit && goods_id) {
        // 编辑模式：调用修改API
        // 判断是否需要上传图片：
        // 1. 如果有新上传的File对象（images数组不为空），则上传新图片
        // 2. 如果没有新上传，但用户删除了旧图片（previewImages长度 < existingImages长度），也需要上传来更新
        const shouldUploadImages = images.length > 0 || previewImages.length !== existingImages.length;
        
        success = await updateMarketGoods(
          goods_id,
          title,
          campus_id,
          post_type,
          status,
          content,
          price,
          tag,
          shouldUploadImages ? images : undefined  // 有修改才传递图片
        );
      } else {
        // 新建模式：调用发布API
        success = await publishMarketGoods(
          title,
          campus_id,
          post_type,
          content,
          price,
          tag,
          images
        );
      }
      
      if (success) {
        console.log(isEdit ? '修改成功' : '发布成功');
        navigate('/market');
      }
    } catch (error) {
      console.error(isEdit ? '修改失败:' : '发布失败:', error);
    }
  }

  const handlePublishDebounce=useDebouncedCallback(handlePublish)

  return (
    <div className='template-container'>
      <Navbar 
        backActive={true} 
        backPath={
          isEdit 
            ? '/user/history' 
            : fromAI 
              ? '/publish/market-publish-ai' 
              : '/publish/market-publish-choice'
        } 
        title='商品发布模板' 
      />

      <div className='content'>
        <div className='form-wrapper'>
          <div className='title'>
            <label htmlFor="title-input">标题</label>
            <div className='title-input'>
              <div className="input-wrapper">
                <input 
                  id="title-input"
                  type="text"
                  placeholder='请输入商品标题' 
                  value={title} 
                  onChange={setTitle}
                  maxLength={50}
                  className="native-input"
                />
              </div>
            </div>
          </div>

          <div className='sort'>
            <label htmlFor="sort-input">标签（请选择合适的标签）</label>
            <div className='sort-input'>
              <div className="antd-dropdown-container">
                <Dropdown menu={{ items: postTypeItems }} placement="bottomLeft">
                  <Button className="dropdown-button dropdown-goodstype">{post_type === 'receive' ? '收' : '出'}</Button>
                </Dropdown>
                <Dropdown menu={{ items: categoryItems }} placement="bottomLeft">
                  <Button className="dropdown-button dropdown-category">{tag}</Button>
                </Dropdown>
                <Dropdown menu={{ items: campusItems }} placement="bottomLeft">
                  <Button className="dropdown-button dropdown-campus">{campus_name}</Button>
                </Dropdown>
              </div>
            </div>
          </div>

          <div className='price'>
            <label htmlFor="price">价格</label>
            <div className='price-num'>
              <div className="input-number-wrapper">
                <input 
                  id="price"
                  type="number"
                  placeholder='商品价格'
                  value={price ?? ''}
                  onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
                  min={0}
                  max={999999}
                  step={0.01}
                  className="native-input-number"
                />
                <div className="input-addon">元</div>
              </div>
            </div>
          </div>

          <div className='img-upload'>
            <div className='img-upload-label'>
              上传图片（最多3张）
            </div>
          <div className={`template-upload ${previewImages.length >= 3 ? 'upload-max-reached' : ''}`}>
            {/* 统一显示所有图片预览（新上传的和已有的） */}
            {previewImages.map((url, index) => (
              <div key={index} className="upload-item uploaded">
                <img src={url} alt={`preview-${index}`} />
                <div className="upload-actions">
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="remove-btn"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
            
            {/* 上传按钮 */}
            {previewImages.length < 3 && (
              <div className="upload-item upload-button">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="upload-label">
                  <div className="upload-content">
                    <span className="plus-icon">+</span>
                    <div className="upload-text">上传图片</div>
                  </div>
                </label>
              </div>
            )}
          </div>
          </div>

          <div className='detail'>
            <label htmlFor="detail-input">
              商品详情
            </label>
            <div className='detail-input'>
              <div className="textarea-wrapper">
                <textarea
                  id="detail-input"
                  placeholder="请详细描述商品信息、规格、使用状况等"
                  value={content}
                  onChange={setContent}
                  maxLength={500}
                  rows={4}
                  className="native-textarea"
                  style={{ height: px2rem(130) }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='submit'>
        <button onClick={handlePublishDebounce}>{isEdit ? '保存修改' : '发布'}</button>
      </div>
    </div>
  )
}

export default Template
