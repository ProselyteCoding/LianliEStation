import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useUserStore from '../../../store/userStore';
import './Register.scss';

const AdminRegister: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { adminRegister } = useUserStore();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await adminRegister({
        username: values.username,
        password: values.password,
        email: values.email,
      });
      message.success('管理员注册成功！即将跳转到登录页...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '注册失败，请重试';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-register-container">
      <Card 
        title="管理员注册（后门）" 
        className="admin-register-card"
        bordered={false}
      >
        <Form
          name="admin_register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, message: '用户名至少3个字符' },
              { max: 20, message: '用户名最多20个字符' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="输入管理员用户名" 
            />
          </Form.Item>

          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="输入邮箱地址" 
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="输入密码" 
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="再次输入密码" 
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              block
            >
              注册管理员账号
            </Button>
          </Form.Item>

          <div className="login-link">
            已有账号？
            <Button 
              type="link" 
              onClick={() => navigate('/login')}
            >
              立即登录
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AdminRegister;
