import React, { useState, useEffect, useRef } from 'react';
import './ForumDetail.scss'
import '../../../Icon.scss';
import { useMainStore,useRecordStore,useUserStore } from '../../../store';
import { useLocation, useNavigate } from 'react-router-dom';
import { Image,Card,Avatar, Button, message} from 'antd';
import { Carousel } from 'antd';
import dayjs from 'dayjs';
import ChatInput from '../../../components/Comment/ChatInput';

const ForumDetail = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    const forumId = params.get('id');
    const updateForumInteract = useMainStore(state => state.updateForumInteract)
    const { updateFavorite, currentUser,updateLikesComplaints } = useUserStore();
    const {Meta} = Card;
    const [openReplies, setOpenReplies] = useState<number | null>(null);
    const [forumState, setForumState] = useState(false)
    const [showComment, setShowComment] = useState(false)
    const [likeState, setLikeState] = useState(false)
    const [parent_id,setParentId] = useState<number | undefined>(undefined)
    const [replyToName, setReplyToName] = useState<string>('') // 被回复人的昵称
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const commentRef = useRef<HTMLDivElement>(null)
    const mainStore = useMainStore()
    const recordStore = useRecordStore()

    useEffect(() => {
        mainStore.fetchPosts();
      }, [refreshTrigger]);

    const forum = mainStore.posts.find((forum)=> forum.id === (forumId?parseInt(forumId):null))

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (commentRef.current && !commentRef.current.contains(event.target as Node)) {
                setShowComment(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    },[])

    // useEffect(() => {
    //     const fetchLikeStatus = async () => {
    //         if (forumId){
    //             const res =await updateForumInteract(parseInt(forumId), 'like',undefined,undefined,1)
    //             if(res === 400){
    //                 setLikeState(true)
    //             }else{
    //                 setLikeState(false)
    //                 updateForumInteract(parseInt(forumId), 'like',undefined,undefined,-1)
    //             }
    //         }
    //     }

    //     const fetchStarStatus = async () => {
    //         if (forumId){
    //             const res = await recordStore.addFavoritePost(forumId?parseInt(forumId):0)
    //             if(res === 400){
    //                 setForumState(true)
    //             }else{
    //                 setForumState(false)
    //                 recordStore.removeFavoritePost(forumId?parseInt(forumId):0)
    //             }
    //         }
    //     }
    //     fetchLikeStatus()
    //     fetchStarStatus()
    // }, [])

    const handleIsRecorded = () => {
        if (currentUser && forumId) {
            if (
                currentUser.likes.find((item) => {
                return (
                    item.targetId === parseInt(forumId) && item.targetType === "post"
                );
                })
            ) {
                setLikeState(true);
                console.log("已点赞");
            } else {
                setLikeState(false);
                console.log("未点赞");
            }

            //   if (
            //     currentUser.complaints.find((item) => {
            //       return (
            //         item.targetId === parseInt(forumId) && item.targetType === "post"
            //       );
            //     })
            //   ) {
            //     setIsDisliked(true);
            //     console.log("已举报");
            //   } else {
            //     setIsDisliked(false);
            //     console.log("未举报");
            //   }

            if (
                currentUser.favorites.posts.find((item) => {
                return (
                    item.id === parseInt(forumId)
                );
                })
            ){
                setForumState(true);
                console.log("已收藏");
            } else {
                setForumState(false);
                console.log("未收藏");
            }
        }
    };

    useEffect(() => {
        handleIsRecorded();
    }, [currentUser]);

    const like = () => {
        console.log('like')
        if (forumId){
            updateForumInteract(parseInt(forumId), 'like',undefined,undefined,likeState?-1:1)
            updateLikesComplaints('post','like',parseInt(forumId),likeState?-1:1)
            setLikeState(!likeState)
        }
    }

    const star = () => {
        console.log('star')
        if(forumId){
            if (!forumState){
                recordStore.addFavoritePost(forumId?parseInt(forumId):0)
                console.log('收藏成功')
                updateFavorite("post",parseInt(forumId),1);
                setForumState(true)
            }
            else{
                recordStore.removeFavoritePost(forumId?parseInt(forumId):0)
                console.log('取消收藏')
                updateFavorite("post",parseInt(forumId),-1);
                setForumState(false)
            }
        }
    }

    const comment = () => {
        console.log('comment')
        setParentId(undefined) // 重置为undefined,表示发送新评论而不是回复
        setReplyToName('') // 清空被回复人昵称
        setShowComment(true)
    }

    const share = () => {
        console.log('share')
        // setShowShare(true)
        navigator.clipboard.writeText(window.location.href);
        message.success('链接已复制到剪贴板');
    }

    // 格式化时间显示
    const formatTime = (timeString: string | undefined) => {
        if (!timeString) return '';
        
        const postDate = dayjs(timeString);
        const now = dayjs();
        const isToday = postDate.isSame(now, 'day');
        const isSameYear = postDate.isSame(now, 'year');

        if (isToday) {
            // 今天：显示"今天 HH:MM"
            return `今天 ${postDate.format('HH:mm')}`;
        } else if (isSameYear) {
            // 当年：显示"MM-DD HH:MM"
            return postDate.format('MM-DD HH:mm');
        } else {
            // 非当年：显示"YYYY-MM-DD HH:MM"
            return postDate.format('YYYY-MM-DD HH:mm');
        }
    }

    return (
        <div className='forum-detail'>

            <div className='forum-navbar'>
                <i className='navbar-icon iconfont icon-left' onClick={() => navigate('/forum')}></i>
                <i className='navbar-icon iconfont icon-share' onClick={share}></i>
            </div>

            <div className='content'>
                <div className="img-container">
                    <Image.PreviewGroup>
                        <Carousel>
                            {forum?.images.map((img, index) => (
                            <div key={index} className="carousel-item">
                                <Image className='img'
                                src={`${process.env.REACT_APP_API_URL || "http://localhost:5000"}${img}`}
                                alt={`image-${index}`}
                                />
                            </div>
                            ))}
                        </Carousel>
                    </Image.PreviewGroup>
                </div>

                <div className="title">
                    {forum?.title}
                </div>

                <div className="text">
                    {forum?.content}
                </div>

                <div className='author_info'>
                    <img 
                        className='author_avatar'
                        src={`${process.env.REACT_APP_API_URL||"http://localhost:5000"}${forum?.author_avatar}`} 
                        alt="avatar" 
                    />
                    <span className='author_name'>{forum?.author_name}</span>
                    <span className="date">{formatTime(forum?.created_at)}</span>
                </div>
                
                <div className="comment">
                <div className="counter">
                    {`评论 ${forum?.comments.length||0}`}
                </div>

                <div className='comment-list'>
                    {
                        forum?.comments.map((comment, index) => (
                            <div className='comment-item' key={index}>
                                <Card  onClick={() => {
                                    setParentId(comment.id)
                                    setReplyToName(comment.user.nickname)
                                    setShowComment(true)
                                }}>
                                    <Meta
                                        avatar={<Avatar src={`${process.env.REACT_APP_API_URL||"http://localhost:5000"}${comment.user.avatar}`} />}
                                        title={
                                            <div>
                                                {comment.user.nickname}
                                                {comment.user.id === forum?.author_id && (
                                                    <span className="author-badge">作者</span>
                                                )}
                                            </div>
                                        }
                                        description={comment.content}
                                    />

                                    {
                                        comment.replies.length > 0 && (
                                            <Button type='link' onClick={(e) => {
                                                e.stopPropagation()
                                                setOpenReplies(openReplies === index ? null : index)
                                                }}>
                                                {openReplies === index ? '收起回复' : `展开${comment.replies.length}条回复`}
                                            </Button>
                                        )
                                    }

                                    {
                                        openReplies === index && (
                                            <div className='replies'>
                                                {
                                                    comment.replies.map((reply, replyIndex) => (
                                                        <div className='reply-item' key={replyIndex}>
                                                            <Card >
                                                                <Meta
                                                                    avatar={<Avatar src={`${process.env.REACT_APP_API_URL||"http://localhost:5000"}${reply.user.avatar}`} />}
                                                                    title={
                                                                        <div>
                                                                            {reply.user.nickname}
                                                                            {reply.user.id === forum?.author_id && (
                                                                                <span className="author-badge">作者</span>
                                                                            )}
                                                                        </div>
                                                                    }
                                                                    description={reply.content}
                                                                />
                                                            </Card>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        )
                                    }
                                </Card>
                            </div>
                        ))
                    }
                </div>
            </div>

        </div>
            
            <div className='commentBar' ref={commentRef}>
                {
                    showComment && (
                    <ChatInput 
                      id={forumId?parseInt(forumId):1} 
                      parent_id={parent_id}
                      replyToName={replyToName}
                      onCommentSuccess={() => setRefreshTrigger(prev => prev + 1)}
                    />
                    )
                }
            </div>

            {/* <div className='shareBar' ref={shareRef}>
                {
                    showShare && (
                    <ShareBar></ShareBar>
                    )
                }
            </div> */}

            <div className="function">
                <div className="comment" onClick={comment}>
                    说点什么吧
                </div>

                <div className="like">
                    <div className="icon">
                        <i className={`iconfont ${likeState ? 'icon-liked2' : 'icon-like2'}`} onClick={like}></i>
                    </div>
                </div>

                <div className='star'>
                    <div className="icon">
                        <i className={`iconfont ${forumState ? 'icon-favorited' : 'icon-favorite'}`} onClick={star}></i>
                    </div>
                </div>

                <div className="share">
                    <div className='icon'>
                        <i className="iconfont icon-share" onClick={share}></i>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ForumDetail;