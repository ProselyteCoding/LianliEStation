import React, { useState } from "react";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";
import { message } from "antd";
import "./DetailAppeal.scss";
import "../../../Icon.scss";
import { useMainStore, useUserStore } from "../../../store";
import { useParams, useNavigate } from "react-router-dom";
import { useDebounce,useDebouncedCallback } from '../../../hooks/useDebounce'
import Icon from "../../../components/Icon/Icon";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const DetailAppeal = () => {
  const params = useParams();
  const navigate = useNavigate();
  const id = params.goodsId;
  const title = params.goodsTitle;

  const { changeGoodsResponse, publishAppeal, updateGoodsItem } = useMainStore();
  const { updateLikesComplaints } = useUserStore();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [content, setContent] = useState<string>("");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as FileType);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  const handleDislike = async () => {
    if (title && id) {
      const files = fileList
        .filter((file) => file.originFileObj instanceof File)
        .map((file) => file.originFileObj as File);
        
      const res1 = await publishAppeal(
        title,
        Number(id),
        content,
        "goods",
        files
      );
      console.log(res1);
      if (res1) {
        const res2 = await changeGoodsResponse("complaint", id, 1);
        console.log(res2);
        if (res2 === "success") {
          message.success("已提交举报");
          updateGoodsItem('complaint', Number(id), 1);
          updateLikesComplaints('goods', 'complaint', Number(id), 1);
          navigate(`/market/${Number(id)}`);
        } else {
          message.error("举报失败");
        }
      }
    }
  };
  
  const handleDislikeDebounce = useDebouncedCallback(handleDislike)
  
  return (
    <div className="appeal-container">
      <Icon
        name="left"
        size={32}
        className="appeal-cancel"
        onClick={() => navigate(`/market/${Number(id)}`)}
      />
      <div className="appeal-inform">
        很抱歉您遇到不愉快的商品体验，请详细描述您遇到的问题并建议上传相应的照片/截图作为证据，我们将为您维权！
      </div>
      <textarea
        className="appeal-area"
        placeholder="请写下您的问题反馈..."
        onChange={(e) => setContent(e.target.value)}
      ></textarea>
      <div className="appeal-images">
        <div className="appeal-images-title">建议您上传图片证据(最多3张):</div>
        <Upload
          style={{ width: "33%" }}
          listType="picture-card"
          fileList={fileList}
          onPreview={handlePreview}
          onChange={handleChange}
          beforeUpload={() => false}
        >
          {fileList.length >= 3 ? null : uploadButton}
        </Upload>
        {previewImage && (
          <Image
            style={{ width: "33%" }}
            wrapperStyle={{ display: "none" }}
            preview={{
              visible: previewOpen,
              onVisibleChange: (visible) => setPreviewOpen(visible),
              afterOpenChange: (visible) => !visible && setPreviewImage(""),
            }}
            src={previewImage}
          />
        )}
      </div>
      <button className="appeal-submit" onClick={handleDislikeDebounce}>
        提交举报
      </button>
    </div>
  );
};

export default DetailAppeal;
