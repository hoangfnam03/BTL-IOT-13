import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // Import file CSS

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    // Kiểm tra nếu tài khoản và mật khẩu không trống
    if (username.trim() === '' || password.trim() === '') {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    // Nếu không có lỗi, điều hướng đến trang chủ (dashboard)
    navigate('/dashboard');
  };

  const handleRegisterRedirect = () => {
    navigate('/register'); // Điều hướng đến trang đăng ký
  };

  return (
    <div className="login-container">
      <h2>Đăng Nhập</h2>
      <div className="form-group">
        <label>Tên đăng nhập</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Mật khẩu</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button onClick={handleLogin}>Đăng Nhập</button>
      {error && <p className="error-message">{error}</p>}

      {/* Nút Đăng ký */}
      <div className="register-link">
        <p>
          Chưa có tài khoản?{' '}
          <span className="register-button" onClick={handleRegisterRedirect}>
            Đăng ký ngay
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
