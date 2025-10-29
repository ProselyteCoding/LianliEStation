import React from 'react'
import './ForumPublish.scss'
import { useEffect, useReducer } from 'react'
import { useUserStore } from '../../../store'
import useMainStore from '../../../store/mainStore'
import { useLocation } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Navbar from '../../../components/Navbar/Navbar'
import { Dropdown, Button, message, Modal } from 'antd'
import type { MenuProps } from 'antd'
// import { aiAPI } from '../../../api'
import { px2rem } from '../../../utils/rem'
import NoticeModal from '../../../components/NoticeModal/NoticeModal'
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'

const initialState = {
  id: 1,
  title: '',
  content: '',
  author_id: null as number | null,
  create_at: '',
  status: "active",
  campus_id: 1,
  tag: '帖子标签',
  images: [] as File[],
  previewImages: [] as string[],
  existingImages: [] as string[],
  error: null as string | null,
  campus_name: '校区选择',
  likes: 0,
  complaints: 0,
  isEdit: false,
  post_id: null as number | null,
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
  | { type: 'SET_ID', payload: number }
  | { type: 'SET_STATUS', payload: string }
  | { type: 'SET_IS_EDIT', payload: boolean }
  | { type: 'SET_POST_ID', payload: number | null }

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
    case 'SET_POST_ID':
      return {
        ...state,
        post_id: action.payload,
      }
    default:
      return state
  }
}


const ForumPublish = () => {
  const location = useLocation()
  const templateData = location.state as any
  const [state, dispatch] = useReducer(reducer, initialState)

  const initialTag = (value: string) => {
    dispatch({ type: 'SET_TAG', payload: value })
  }
  const initialContent = (value: string) => {
    dispatch({ type: 'SET_CONTENT', payload: value })
  }
  const initialTitle = (value: string) => {
    dispatch({ type: 'SET_TITLE', payload: value })
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

  const { isAuthenticated, currentUser } = useUserStore()
  const { publishForumPost, updateForumPost } = useMainStore()
  const navigate = useNavigate()

  useEffect(() => {
    setCreateAt(new Date().toISOString())
    
    // 如果是编辑模式，加载已有数据
    if (templateData?.isEdit) {
      dispatch({ type: 'SET_IS_EDIT', payload: true })
      dispatch({ type: 'SET_POST_ID', payload: templateData.post_id })
      dispatch({ type: 'SET_STATUS', payload: templateData.status || 'active' })
      initialTag(templateData?.tag || '帖子标签')
      initialContent(templateData?.content || '')
      initialTitle(templateData?.title || '')
      
      // 设置校区ID和名称
      const campusId = templateData?.campus_id || currentUser?.campus_id || 1
      dispatch({ type: 'SET_CAMPUS_ID', payload: campusId })
      dispatch({ type: 'SET_CAMPUS_NAME', payload: getCampusName(campusId) })
      
      // 将已有图片转换为预览URL格式
      if (templateData?.existingImages && templateData.existingImages.length > 0) {
        const serverImageUrls = templateData.existingImages.map(
          (url: string) => `${process.env.REACT_APP_API_URL || "http://localhost:5000"}${url}`
        )
        dispatch({ type: 'SET_PREVIEW_IMAGES', payload: serverImageUrls })
        dispatch({ type: 'SET_EXISTING_IMAGES', payload: templateData.existingImages })
      }
    } else {
      // 新建模式
      setCampusId(currentUser?.campus_id || 1)
      initialTag(templateData?.tag || '帖子标签')
      initialContent(templateData?.details || '')
      initialTitle(templateData?.title || '')
    }
  }, [currentUser?.campus_id, templateData])

  // 帖子标签下拉菜单配置
  const tagItems: MenuProps['items'] = [
    {
      key: '生活娱乐',
      label: '生活娱乐',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '生活娱乐' })
    },
    {
      key: '吐槽倾诉',
      label: '吐槽倾诉',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '吐槽倾诉' })
    },
    {
      key: '交友组队',
      label: '交友组队',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '交友组队' })
    },
    {
      key: '咨询答疑',
      label: '咨询答疑',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '咨询答疑' })
    },
    {
      key: '学习资料',
      label: '学习资料',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '学习资料' })
    },
    {
      key: '新闻通知',
      label: '新闻通知',
      onClick: () => dispatch({ type: 'SET_TAG', payload: '新闻通知' })
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
    content,
    title,
    tag,
    images,
    previewImages,
    existingImages,
    campus_id,
    campus_name,
    status,
    isEdit,
    post_id,
  } = state

  // 原生文件上传处理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // 限制最多3张图片
    const remainingSlots = 3 - previewImages.length;
    
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
      message.warning('请输入帖子标题');
      return;
    }
    
    if (tag === '帖子标签' || tag === '帖子标签') {
      message.warning('请选择帖子标签');
      return;
    }
    
    if (campus_name === '校区选择') {
      message.warning('请选择校区');
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

    // 发布或更新帖子
    try {
      let success = false;
      
      if (isEdit && post_id) {
        // 编辑模式：判断是否需要上传图片
        const shouldUploadImages = images.length > 0 || previewImages.length !== existingImages.length;
        
        success = await updateForumPost(
          post_id,
          title,
          content,
          campus_id,
          status, // 保持原有状态
          tag,
          shouldUploadImages ? images : undefined
        );
        
        if (success) {
          message.success('修改成功');
          navigate('/forum');
        }
      } else {
        // 发布模式
        success = await publishForumPost(
          title,
          content,
          campus_id,
          tag,
          images
        );

        if (success) {
          console.log('发布成功');
          navigate('/forum');
        }
      }
    } catch (error) {
      console.error(isEdit ? '修改失败:' : '发布失败:', error);
    }
  }

  const handlePublishDebounce = useDebouncedCallback(handlePublish

  )
  return (
    <div className='template-container'>
      {!isAuthenticated && <NoticeModal type='login'/>}
      <Navbar 
        backActive={true} 
        backPath={isEdit ? '/user/history' : '/forum'} 
        title='帖子发布' 
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
                  placeholder='请输入帖子标题'
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
                <Dropdown menu={{ items: tagItems }} placement="bottom" arrow>
                  <Button className="ant-btn dropdown-button dropdown-category">
                    {tag}
                  </Button>
                </Dropdown>
                <Dropdown menu={{ items: campusItems }} placement="bottom" arrow>
                  <Button className="ant-btn dropdown-button dropdown-campus">
                    {campus_name}
                  </Button>
                </Dropdown>
              </div>
            </div>
          </div>

          <div className='img-upload'>
            <div className='img-upload-label'>
              上传图片（最多3张）
            </div>
            <div className={`template-upload ${previewImages.length >= 3 ? 'upload-max-reached' : ''}`}>
              {/* 已上传图片预览（统一显示新上传和已有图片） */}
              {previewImages.map((url, index) => (
                <div key={index} className="upload-item uploaded">
                  <img src={url} alt={`preview-${index}`} />
                  <div className="upload-actions">
                    <button
                      className="remove-btn"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {/* 上传按钮 */}
              {previewImages.length < 3 && (
                <div className="upload-item upload-button">
                  <label htmlFor="file-input" className="upload-label">
                    <div className="upload-content">
                      <span className="plus-icon">+</span>
                      <span className="upload-text">上传</span>
                    </div>
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className='detail'>
            <label htmlFor="detail-input">
              内容详情
            </label>
            <div className='detail-input'>
              <div className="textarea-wrapper">
                <textarea
                  id="detail-input"
                  placeholder="请输入帖子详情"
                  value={content}
                  onChange={setContent}
                  maxLength={500}
                  className="native-textarea"
                  style={{ height: px2rem(180) }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='submit'>
        <button onClick={() => handlePublishDebounce()}>
          {isEdit ? '保存修改' : '发布'}
        </button>
      </div>
    </div>
  )
}

export default ForumPublish
