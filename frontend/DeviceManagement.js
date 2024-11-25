import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import { Route, Routes } from 'react-router-dom';

const DeviceManagement = () => {
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [deviceId, setDeviceId] = useState(''); // Giả sử bạn có cách để lấy deviceId

  // Lấy lịch sử trạng thái của thiết bị
  useEffect(() => {
    if (deviceId) {
      axios.get(`http://localhost:3001/api/device-history/${deviceId}`)
        .then(response => setDeviceHistory(response.data))
        .catch(error => console.error('Error fetching device history:', error));
    }
  }, [deviceId]);

  return (
    <div>
      <h2>Quản lý Thiết Bị - Quản lý Quạt</h2>

      <div>
        <label htmlFor="deviceId">Chọn thiết bị:</label>
        <input
          type="text"
          id="deviceId"
          value={deviceId}
          onChange={e => setDeviceId(e.target.value)}
          placeholder="Nhập ID thiết bị"
        />
      </div>

      <h3>Lịch sử trạng thái thiết bị</h3>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Status</th>
            <th>Mode</th>
            <th>Threshold</th>
            <th>Temperature</th>
            <th>Humidity</th>
          </tr>
        </thead>
        <tbody>
          {deviceHistory.map((item, index) => (
            <tr key={index}>
              <td>{item.timestamp}</td>
              <td>{item.status}</td>
              <td>{item.mode}</td>
              <td>{item.threshold}</td>
              <td>{item.temperature}</td>
              <td>{item.humidity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeviceManagement;
