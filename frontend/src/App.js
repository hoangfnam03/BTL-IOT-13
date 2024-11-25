import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './login';
import Register from './Register';
import Dashboard from './dashboard'; // Giả sử bạn đã có trang Dashboard

const App = () => {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Route mặc định sẽ điều hướng đến trang đăng nhập */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Các route khác của ứng dụng */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
