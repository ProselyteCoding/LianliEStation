import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { message } from "antd";
import { useUserStore } from "../../../../store";
import Navbar from "../../../../components/Navbar/Navbar";
import "./Forget.scss";
import { useDebounce,useDebouncedCallback } from '../../../../hooks/useDebounce'

const Forget: React.FC = () => {
  const [inputs, setInputs] = useState({
    email: "",
    verification: "",
    password: "",
    confirmPassword: "",
  });

  const [countdown, setCountdown] = useState<number>(0);

  const navigate = useNavigate();
  const { requestVerification, changePassword, isAuthenticated } = useUserStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequest = async () => {
    if (countdown > 0) return;

    try {
      await requestVerification(inputs.email);
      message.success("验证码已发送，请查收邮件");
      setCountdown(60);
      const interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      setTimeout(() => {
        clearInterval(interval);
      }, 300000);
    } catch (err: any) {
      if (err.response) {
        message.error(err.response.data.message || "发送验证码失败");
      } else {
        message.error("发送验证码失败，请稍后重试");
      }
    }
  };

  const validatePasswords = () => {
    if (inputs.password !== inputs.confirmPassword) {
      message.error("两次输入的密码不一致");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePasswords()) {
      message.error("两次输入的密码不一致");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}/.test(inputs.password)) {
      message.error("密码不符合要求");
      return;
    }

    try {
      await changePassword(inputs.email, inputs.verification, inputs.password);
      message.success("密码重置成功！正在跳转...");
      setTimeout(() => {
        navigate("/market");
      }, 1500);
    } catch (err: any) {
      if (err.response) {
        message.error(err.response.data.message || "重置密码失败");
      } else {
        message.error("发生未知错误，请稍后重试");
      }
    }
  };

  const isFormComplete = Object.values(inputs).every((value) => value.trim() !== "");
  const handleRequestDebounce = useDebouncedCallback(handleRequest)
  return (
    <div className="forget-container">
      <Navbar title="忘记密码" backActive={true} backPath={isAuthenticated ? "/user/settings" : "/auth/login"} />
      <div className="forget-content">
        <form className="forget-form" onSubmit={handleSubmit}>
          <div className="form-item">
            <label htmlFor="email">账户邮箱</label>
            <input
              required
              type="text"
              name="email"
              id="email"
              value={inputs.email}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="verification">验证码</label>
            <div className="verification-group">
              <input
                required
                type="text"
                name="verification"
                id="verification"
                value={inputs.verification}
                onChange={handleChange}
                className="modern-input verification-input"
              />
              {countdown > 0 ? (
                <button type="button" className="verification-btn disabled" disabled>
                  {Math.ceil(countdown)}秒
                </button>
              ) : (
                <button type="button" className="verification-btn" onClick={handleRequestDebounce}>
                  获取验证码
                </button>
              )}
            </div>
          </div>
          <div className="form-item">
            <label htmlFor="password">新密码 (至少含1个大写字母、1个数字，长度≥8)</label>
            <input
              required
              type="password"
              name="password"
              id="password"
              value={inputs.password}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <div className="form-item">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              required
              type="password"
              name="confirmPassword"
              id="confirmPassword"
              value={inputs.confirmPassword}
              onChange={handleChange}
              className="modern-input"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={!isFormComplete}>
            重置密码
          </button>
        </form>
      </div>
    </div>
  );
};

export default Forget;
