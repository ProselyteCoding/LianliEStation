// src/components/ChatInput.tsx
import React, { useRef, useState, useEffect, Suspense, lazy } from "react";
import { Input, Button, Space, message, Modal, Spin } from "antd";
import { SmileOutlined, SendOutlined } from "@ant-design/icons";
import type { EmojiClickData } from "emoji-picker-react";
import "./ChatInput.scss";
import { useMainStore } from "../../store";
import { aiAPI } from "../../api";

// 懒加载 emoji-picker-react (150KB)
const EmojiPicker = lazy(() => import("emoji-picker-react"));

type Props = {
  id: number;
  parent_id?: number;
  replyToName?: string; // 被回复人的昵称
  onCommentSuccess?: () => void; // 评论成功后的回调
}

const ChatInput: React.FC<Props> = ({id, parent_id, replyToName, onCommentSuccess}) => {
  const [inputText, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [parentId, setParentId] = useState<number | null>(null);
  const updateForumInteract = useMainStore((state)=>state.updateForumInteract);
  const emojiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (parent_id) {
    setParentId(parent_id);
    }
  }, [parent_id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [emojiRef]);
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setText((prev) => prev + emojiData.emoji); // 把表情加到文本后面
  };

  const sendMessage = async () => {
    if (!inputText.trim()) {
      return;
    }

    // 敏感词检测
    try {
      message.loading({ content: '正在检测内容...', key: 'commentCheck' });
      
      const checkResult = await aiAPI.checkSensitive(inputText.trim());
      
      message.destroy('commentCheck');
      
      if (!checkResult.isSafe) {
        // 检测到敏感内容
        const warningMessage = checkResult.words && checkResult.words.length > 0
          ? `评论包含敏感词：${checkResult.words.join('、')}`
          : checkResult.reason;
        
        Modal.warning({
          title: '评论审核未通过',
          content: warningMessage,
          okText: '知道了',
        });
        return;
      }
    } catch (error: any) {
      message.destroy('commentCheck');
      console.error('敏感词检测失败:', error);
      // 评论检测失败时静默继续，不打断用户体验
    }

    // 发送评论
    try {
      await (parentId 
        ? updateForumInteract(id, "comment", inputText, parentId, undefined) 
        : updateForumInteract(id, "comment", inputText, undefined, undefined)
      );
      
      setText(""); // 清空输入框
      
      // 调用回调通知父组件刷新评论列表
      if (onCommentSuccess) {
        onCommentSuccess();
      }
    } catch (error) {
      console.error('发送评论失败:', error);
    }
  }

  return (
    <div className="chat-input">
      <Space direction="vertical" className="chat-input__space">
        {/* 文字输入框 */}
        <Input.TextArea
          value={inputText}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={replyToName ? `@${replyToName}...` : "发表您的意见..."}
          autoFocus
        />

        {/* 已选择的图片预览
        {inputImages.length > 0 && (
          <Space wrap>
            {inputImages.map((url, idx) => (
              <Image key={idx} src={url} width={80} />
            ))}
          </Space>
        )} */}

        <Space>
          {/* 表情按钮 */}
          <Button
            icon={<SmileOutlined />}
            onClick={() => setShowEmoji(!showEmoji)}
          />
          {showEmoji && (
            <div className="chat-input__emoji-picker" ref={emojiRef}>
              <Suspense fallback={<Spin size="small" tip="加载中..." />}>
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false} 
                />
              </Suspense>
            </div>
          )}

          {/* 上传图片
          <Upload
            showUploadList={false}
            beforeUpload={(file) => {
              const url = URL.createObjectURL(file);
              addImage(url);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>上传图片</Button>
          </Upload> */}

          {/* 发送按钮 */}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendMessage}
          >
            发送
          </Button>
        </Space>
      </Space>
    </div>
  );
};

export default ChatInput;
