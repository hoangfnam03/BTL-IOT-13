import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Register.css'; // Import file CSS


const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = () => {
    axios
      .post('http://localhost:3001/api/register', { username, password })
      .then((response) => {
        if (response.data.success) {
          navigate('/login'); // Điều hướng trở lại trang đăng nhập sau khi đăng ký thành công
        } else {
          setError('Đăng ký không thành công!');
        }
      })
      .catch(() => {
        setError('Có lỗi xảy ra, vui lòng thử lại sau.');
      });
  };

  return (
    <div className="register-container">
      <h2>Đăng Ký</h2>
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
      <button onClick={handleRegister}>Đăng Ký</button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default Register;
