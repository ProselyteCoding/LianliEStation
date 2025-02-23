import React, { use } from 'react'
import './Template.scss'
import Tabbar from '../../components/Tabbar/Tabbar'
import add from '../../assets/more.png'
import takePlace from '../../assets/takePlace.png'
import logo from '../../assets/logo.png'
import { useState,useEffect,useReducer } from 'react'
import { useUserStore } from '../../store'
import axios from 'axios'
import { useLocation } from 'react-router-dom'
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie'

const initialState = {
  id:1,
  title: '',
  content: '',
  author_id: null as number | null,
  create_at: '',
  status:"active",
  price: 0,
  campus_id: 1,
  post_type: '买/卖',
  tag: '商品类型',
  images: [] as File[],
  error: null as string | null,
  campus_name: '校区选择',
  likes: 0,
  complints: 0,
}

type Action=
  | { type: 'SET_POST_TYPE', payload: string }
  | { type: 'SET_TAG', payload: string }
  | { type: 'SET_CONTENT', payload: string }
  | { type: 'SET_TITLE', payload: string }
  | { type: 'SET_IMAGES', payload: File[] }
  | { type: 'SET_ERROR', payload: string | null }
  | { type: 'SET_CAMPUS_ID', payload: number }
  | { type: 'SET_CAMPUS_NAME', payload: string }
  | { type: 'SET_AUTHOR_ID', payload: number | null }
  | { type: 'SET_CREATE_AT', payload: string }
  | { type: 'SET_PRICE', payload: number }
  | { type: 'SET_ID', payload: number}

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
        auther_id: action.payload,
      }
    case 'SET_CREATE_AT':
      return {
       ...state,
        create_at: action.payload,
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
  const setPostType = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    dispatch({ type: 'SET_POST_TYPE', payload: (e.currentTarget.innerText==='买'?'receive':'sell') })
  }
  const setPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_PRICE', payload: e.target.valueAsNumber })
  }
  const setTag = (e:React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    dispatch({ type: 'SET_TAG', payload: e.currentTarget.innerText })
  }
  const setContent = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CONTENT', payload: e.target.value })
  }
  const setTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_TITLE', payload: e.target.value })
  }
  const setImages = (value: File[]) => {
    dispatch({ type: 'SET_IMAGES', payload: value })
  }
  const setError = (value: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: value })
  }
  const setCampusId = (value: number) => {
    dispatch({ type: 'SET_CAMPUS_ID', payload: value })
    dispatch({ type: 'SET_CAMPUS_NAME', payload: document.getElementById(value.toString())?.innerText?? '校区选择' })
  }
  const setCampusName = (value: string) => {
    dispatch({ type: 'SET_CAMPUS_NAME', payload: value })
  }
  const setCreateAt = (value: string) => {
    dispatch({ type: 'SET_CREATE_AT', payload: value })
  }

  const token = Cookies.get("auth-token");
  const currentUser = useUserStore(state => state.currentUser)
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    setCreateAt(new Date().toISOString())
    setCampusId(currentUser?.campus_id || 1)
    initialPostType(templateData?.post_type || 'receive')
    initialTag(templateData?.tag || '商品类型')
    initialContent(templateData?.details || '')
    initialTitle(templateData?.title || '')    
    initialPrice(templateData?.price || 0)
  },[])

  const {
    id,
    post_type,
    tag,
    content,
    title,
    images,
    error,
    campus_id,
    campus_name,
    author_id,
    create_at,
    price,
    likes,
    complints,
  } = state

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 3) {
      setError('最多上传3张图片')
      return
    }
    setImages(files)
    setError(null)
  }

  const handleSuccess =async () => {
    setIsSuccess(true);
    // 设置 3 秒后提示消失
    setTimeout(() => {
      setIsSuccess(false);
    }, 3000);
  };

  const handleCampusChange = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setCampusId(parseInt(e.currentTarget.id))
    setCampusName(e.currentTarget.innerText)
    
  }

  const handlePublish = async () => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('author_id', author_id?.toString()?? '');
    formData.append('create_at', create_at);
    formData.append('status', 'active');
    formData.append('price', price.toString());
    formData.append('campus_id', campus_id.toString());
    formData.append('post_type', post_type);
    formData.append('tag', tag);
    images.forEach((image) => {
      formData.append('images', image);
    });
    formData.append('likes', likes.toString());
    formData.append('complints', complints.toString());
    axios.post('http://localhost:5000/api/posts/publish', formData,{
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    }).then(() => {
      handleSuccess()
      console.log('发布成功')
      window.location.href = '/target-page'
  })
  .catch((error) => {
      console.log(error)

  })
}

  return (
    <div className='template-container'>
      <div className='navbar'>
        <div className='logo'>
          <img src={logo} alt="logo" />          
        </div>
        <div className='text'>
          连理e站
        </div>
      </div>
       
      <div className='content'>
        <div className='title'>
          <label htmlFor="title-input">标题</label>
          <div className='title-input'>
            <input type='text' placeholder='标题' value={title} onChange={(e)=>setTitle(e)}/>
          </div>
        </div>

        <div>

      {/* 显示提示框 */}
      {isSuccess && (
        <div className='alert'>
          <div className='publish-success'>
            <p>发布成功</p>
          </div>
        </div>
      )}

    </div>

        <div className='sort'>
          <label htmlFor="sort-input">分类</label>
          <div className='sort-input'>
          <div className="dropdown">
            <div className='dropdown-sellOrBuy'>
              <button className="dropdown-button">{`${post_type==='receive'?'买':'卖'}`}</button>
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={(e) => setPostType(e)}>买</div>
                <div className="dropdown-item" onClick={(e) => setPostType(e)}>卖</div>
              </div>
            </div>
            <div className='dropdown-category'>
              <button className="dropdown-button">{`${tag}`}</button>
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>跑腿代课</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>数码电子</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>生活用品</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>拼单组队</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>学业资料</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>捞人询问</div>
                  <div className="dropdown-item" onClick={(e) => setTag(e)}>其他</div>
                </div>
            </div>
            <div className='dropdown-campus'>
              <button className="dropdown-button">{`${campus_name}`}</button>
                <div className="dropdown-menu">
                  <div className="dropdown-item" id="1" onClick={(e) => handleCampusChange(e)}>凌水校区</div>
                  <div className="dropdown-item" id="2" onClick={(e) => handleCampusChange(e)}>开发区校区</div>
                  <div className="dropdown-item" id="3" onClick={(e) => handleCampusChange(e)}>盘锦校区</div>
                </div>
            </div>
            
          </div>
          </div>
        </div>

        <div className='price'>
            <label htmlFor="price">价格</label>
              <div className='price-num'>
                <input type="number" placeholder='商品价格' value={price} onChange={(e) =>setPrice(e) }/>
              </div>
        </div>

        <div className='img-upload'>
          <div className='img-upload-up'>
            <label htmlFor="upload-icon">
              上传图片
            </label>
            <div className='img-upload-icon'>
              <input type="file" accept="image/*" id='upload-icon' multiple onChange={(e) => handleImageChange(e)}/>
              <img src={add} alt="add" onClick={()=>(document.getElementById('upload-icon') as HTMLInputElement)?.click()}/>
            </div>
          </div>
          <div className='img-upload-down'>
            {error? 
              <div className='error'>{error}</div> 
              : 
              <div>
                <img src={images[0] ? URL.createObjectURL(images[0]) : takePlace} alt="takePlace" />
                <img src={images[1] ? URL.createObjectURL(images[1]) : takePlace} alt="takePlace" />
                <img src={images[2] ? URL.createObjectURL(images[2]) : takePlace} alt="takePlace" />
              </div>
              }

          </div>

        </div>

        <div className='detail'>
            <label htmlFor="detail-input">
                商品详情
            </label>
            <div className='detail-input'>
              <textarea placeholder={"商品详情"} value={content} onChange={(e)=>setContent(e)} />
            </div>
        </div>
    </div>

    <div className='submit'>
      <button onClick={() => handlePublish()}>发布</button>
    </div>
    </div>
  )
}

export default Template
