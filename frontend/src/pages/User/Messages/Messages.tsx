import { useEffect, useState, useRef } from "react";
import { Image, Button, Empty } from "antd";
import Navbar from "../../../components/Navbar/Navbar";
import "./Messages.scss";
import { useRecordStore, useUserStore } from "../../../store";
import NoticeModal from "../../../components/NoticeModal/NoticeModal";
import "../../../Icon.scss"
import type { MenuProps } from "antd";
import { Dropdown } from "antd";
import { timeFormat } from "../../../utils/formatters";
import { px2rem } from "../../../utils/rem";
import Icon from "../../../components/Icon/Icon";

interface Conditions {
  type: string;
  read: boolean;
  manage: boolean;
}

const Messages = () => {
  const { isAuthenticated } = useUserStore();
  // 三个筛选条件
  const [conditions, setConditions] = useState<Conditions>({
    type: "all", // 'appeal' 或 'response' 或 'all'
    read: false, // true/false
    manage: false, // true/false
  });
  // 当前显示的类型文本
  const [currentType, setCurrentType] = useState("全部");

  const { fetchResponses, searchAppeals, markResponse } =
    useRecordStore();

  // 申诉/回复类型
  //   interface Response {
  //   user_id: number;
  //   response_type: string;
  //   related_id: number;
  //   content: string;
  //   read_status: string;
  //   created_at: string;
  //   images: string[];
  //   image_count: number;
  // }
  // interface Appeal {
  //   author_id: number;
  //   goods_id: number;
  //   content: string;
  //   status: string;
  //   created_at: string;
  //   image_url: string[];
  // }

  // 当前显示的消息列表
  const [messagesList, setMessagesList] = useState<any[]>([]);
  // 初始状态消息列表
  const [initialMessagesList, setInitialMessagesList] = useState<any[]>([]);
  // 所有消息列表
  const [allMessagesList, setAllMessagesList] = useState<any[]>([]);

  // 不触发渲染的初始与全部消息列表(useRef实现，用于卸载前比较更新)
  const initialMessagesListRef = useRef<any[]>([]);
  const allMessagesListRef = useRef<any[]>([]);

  // 信息类型菜单选择
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "all" });
            setCurrentType("全部");
          }}
        >
          全部
        </div>
      ),
      icon: <Icon name="all" size={18} />,
    },
    {
      key: "2",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "appeal" });
            setCurrentType("申诉");
          }}
        >
          申诉
        </div>
      ),
      icon: <Icon name="appeal" size={18} />,
    },
    {
      key: "3",
      label: (
        <div
          onClick={() => {
            setConditions({ ...conditions, type: "response" });
            setCurrentType("回复");
          }}
        >
          回复
        </div>
      ),
      icon: <Icon name="reply" size={18} />,
    },
  ];

  useEffect(() => {
    const initList = async () => {
      const [responsesData, appealsData] = await Promise.all([
        fetchResponses(),
        searchAppeals()
      ]);
      const combinedMessages = [...appealsData, ...responsesData];

      // 按照 created_at 进行排序
      combinedMessages.sort(
        (b, a) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 生成唯一的 key 值，顺序对应排序后的消息顺序
      const sortedMessagesWithKeys = combinedMessages.map((msg, index) => ({
        ...msg,
        key: `${index}`, // 生成唯一的 key
      }));

      setInitialMessagesList(sortedMessagesWithKeys); // 设置初始消息状态
      initialMessagesListRef.current = sortedMessagesWithKeys; // 保存持久化初始消息状态
      setAllMessagesList(sortedMessagesWithKeys); // 设置全部消息状态
      console.log("初始获取的全部消息:", sortedMessagesWithKeys);
    };

    // 初始化获取全部messages，不筛选，存入initialMessagesList
    if(!initialMessagesList.length)
    initList();

    // 组件卸载时更新同步已读/未读信息
    return () => {
      // console.log("当前:",allMessagesListRef.current, "vs" ,"最初:",initialMessagesListRef.current);
      const changes = allMessagesListRef.current.filter((msg) => {
        const initialMessage = initialMessagesListRef.current.find(
          (imsg) => (imsg.id === msg.id && (("response_type" in imsg && "response_type" in msg) || ("type" in imsg && "type" in msg)) && (imsg.read_status !== msg.read_status))
        );
        return initialMessage && initialMessage.read_status !== msg.read_status;
      });

      if (changes.length > 0) {
        const updateData = {
          messages: changes.map((msg) => ({
            message_id: msg.id,
            type: `${msg.response_type ? "response" : "appeal"}`,
            status: msg.read_status,
          })),
        };

        markResponse(updateData);
        // console.log("已更新消息状态:", changes);
      }

      // console.log("组件卸载");
    };
  }, []);

  useEffect(() => {
    const handleList = async (type: string, read: boolean) => {
      let combinedMessages: any[] = allMessagesList;
      // 刷新消息列表
      if (type === "response") {
        // 筛选为回复消息
        combinedMessages = combinedMessages.filter(
          (msg) => "response_type" in msg
        );
      } else if (type === "appeal") {
        // 筛选为申诉消息
        combinedMessages = combinedMessages.filter((msg) => "type" in msg);
      }

      if (read) {
        // 筛选为已读消息
        combinedMessages = combinedMessages.filter(
          (msg) => msg.read_status === "read"
        );
      } else {
        // 筛选为未读消息
        combinedMessages = combinedMessages.filter(
          (msg) => msg.read_status === "unread"
        );
      }

      // 按照 created_at 进行排序
      combinedMessages.sort(
        (b, a) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // 生成唯一的 key 值，顺序对应排序后的消息顺序
      const sortedMessagesWithKeys = combinedMessages.map((msg, index) => ({
        ...msg,
        key: `${index}`, // 生成唯一的 key
      }));

      console.log("筛选时的消息列表:", sortedMessagesWithKeys);
      setMessagesList(sortedMessagesWithKeys);
    };

    if (initialMessagesList.length > 0) {
      handleList(conditions.type, conditions.read);
    }
  }, [conditions, allMessagesList]);

  return (
    <div>
      {!isAuthenticated && <NoticeModal type="login"/>}
      <Navbar title="信箱" backActive={true} backPath="/user" />
      <div className="messages-container">
        <div className="messages-control">
          <div className="messages-control-item">
            <Dropdown menu={{ items }}>
              <div onClick={(e) => e.preventDefault()} style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={conditions.type === "all" ? "all" : conditions.type === "appeal" ? "appeal" : "reply"} size={20} />
                {currentType}
              </div>
            </Dropdown>
          </div>
          <div
            className="messages-control-item"
            onClick={() => {
              setConditions({ ...conditions, read: !conditions.read });
            }}
          >
            <div className="messages-control-item-btn">
              {
                conditions.read === false ? (
                  <Icon name="messages" size={20} />
                ) : (
                  <Icon name="messages-read" size={20} />
                )
              }
              <button>{conditions.read === false ? "未读" : "已读"}</button>
            </div>
          </div>
        </div>

        <div className="messages-list">
          {messagesList.length === 0 ? (
            <div className="messages-empty">
              <Empty
                description={
                  conditions.read === false
                    ? "还没有未读消息"
                    : "还没有已读消息"
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            messagesList.map((message) => (
              <div key={message.key} className="messages-list-item">
                {!message.response_type ? (
                  <div className="message-appeal">
                  <div className="appeal-row">
                    <div className="appeal-type" style={{ backgroundColor: `${message.status === "pending"
                        ? "rgb(233, 218, 8)"
                        : message.status === "resolved"
                        ? "#3bc570"
                        : "#ff5a5f"}` }}>申诉</div>
                    <div className="appeal-title">《{message.title.length > 8 ? message.title.slice(0, 8) + '...' : message.title}》</div>
                    {conditions.read === false ? (
                      <Button
                        className="response-read-control"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("type" in msg && "type" in message)) {
                                return { ...msg, read_status: "read" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为已读
                      </Button>
                    ) : (
                      <Button
                        className="response-read-control"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("type" in msg && "type" in message)) {
                                return { ...msg, read_status: "unread" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为未读
                      </Button>
                    )}
                    <div className="appeal-time">
                      {timeFormat(message.created_at, "MM-DD")}
                    </div>
                  </div>
                  <div className="appeal-row">
                    <div className="appeal-content">{message.content}</div>
                  </div>
                </div>
              ) : (
                <div className="message-response">
                  <div className="response-row">
                    {message.response_type === "violation" ? (
                      <div className="response-type-violation">违规</div>
                    ) : (
                      <div className="response-type-response">处理</div>
                    )}
                    <div className="response-title">《{message.title.length > 7 ? message.title.slice(0, 7) + '...' : message.title}》</div>
                    {conditions.read === false ? (
                      <Button
                        className="response-read-control"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("response_type" in msg && "response_type" in message)) {
                                return { ...msg, read_status: "read" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为已读
                      </Button>
                    ) : (
                      <Button
                        className="response-read-control"
                        size="small"
                        onClick={(e) => {
                          e.preventDefault(); // 如果需要阻止默认行为
                          // 找到 allMessagesList 中对应 message 的 id 的元素
                          const updatedMessagesList = allMessagesList.map(
                            (msg) => {
                              if (msg.id === message.id && ("response_type" in msg && "response_type" in message)) {
                                return { ...msg, read_status: "unread" }; // 更新 read_status 属性
                              }
                              return msg; // 对于其他消息保持不变
                            }
                          );
                          // 更新 allMessagesList 状态
                          setAllMessagesList(updatedMessagesList);
                          allMessagesListRef.current = updatedMessagesList; // 保存持久化全部消息状态
                        }}
                      >
                        设为未读
                      </Button>
                    )}

                    <div className="response-time">
                      {timeFormat(message.created_at, "MM-DD")}
                    </div>
                  </div>
                  <div className="response-row">
                    <div className="response-content">{message.content}</div>
                  </div>
                </div>
              )}
            </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
