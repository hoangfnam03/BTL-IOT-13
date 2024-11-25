import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Dashboard.css';
const Dashboard = () => {
    const [fanData, setFanData] = useState({
        temperature: 0,
        humidity: 0,
        mode: 'auto',
        control: 'off',
        threshold: 25,
      });
      const [loading, setLoading] = useState(true);
      const [newThreshold, setNewThreshold] = useState(fanData.threshold);
      const [statusHistory, setStatusHistory] = useState([]);
      const [settingsHistory, setSettingsHistory] = useState([]);
      const [isStatusHistoryVisible, setIsStatusHistoryVisible] = useState(false);  // State kiểm soát việc hiển thị lịch sử trạng thái
      const [isSettingsHistoryVisible, setIsSettingsHistoryVisible] = useState(false);  // State kiểm soát việc hiển thị lịch sử cài đặt
    
      // Lấy dữ liệu từ API duy nhất
      useEffect(() => {
        const fetchFanData = () => {
          axios.get('http://localhost:3001/api/fanData')
            .then(response => {
              setFanData(response.data);
              setNewThreshold(response.data.threshold);
            })
            .catch(error => console.error('Error fetching fan data:', error))
            .finally(() => setLoading(false));
        };
    
        fetchFanData();
        const interval = setInterval(fetchFanData, 5000); // Cập nhật mỗi 5 giây
    
        return () => clearInterval(interval); // Xóa interval khi component unmount
      }, []);
    
      // Lấy lịch sử trạng thái
      const fetchStatusHistory = () => {
        axios.get('http://localhost:3002/api/statusHistory')
          .then(response => {
            setStatusHistory(response.data);
            setIsStatusHistoryVisible(true);  // Hiển thị bảng lịch sử trạng thái khi nhận được dữ liệu
          })
          .catch(error => console.error('Error fetching status history:', error));
      };
    
      // Lấy lịch sử cài đặt
      const fetchSettingsHistory = () => {
        axios.get('http://localhost:3002/api/statusHistory')
          .then(response => {
            setSettingsHistory(response.data);
            setIsSettingsHistoryVisible(true);  // Hiển thị bảng lịch sử cài đặt khi nhận được dữ liệu
          })
          .catch(error => console.error('Error fetching settings history:', error));
      };
    
      const handleThresholdChange = (e) => {
        setNewThreshold(e.target.value);
      };
    
      const updateThreshold = () => {
        const thresholdValue = parseFloat(newThreshold);
    
        if (isNaN(thresholdValue)) {
          alert('Ngưỡng nhiệt độ không hợp lệ!');
          return;
        }
    
        axios.post('http://localhost:3001/api/changeThreshold', { threshold: thresholdValue })
          .then(response => {
            console.log('Threshold updated:', response.data);
            setFanData(prevData => ({ ...prevData, threshold: thresholdValue }));
          })
          .catch(error => console.error('Error updating threshold:', error));
      };
    
      const toggleMode = () => {
        const newMode = fanData.mode === 'manual' ? 'auto' : 'manual';
        axios.post('http://localhost:3001/api/fanData', { mode: newMode })
          .then(response => {
            console.log('Mode updated:', response.data);
            setFanData(prevData => ({ ...prevData, mode: newMode }));
          })
          .catch(error => console.error('Error updating mode:', error));
      };
    
      const toggleFan = () => {
        const newControl = fanData.control === 'on' ? 'off' : 'on';
        axios.post('http://localhost:3001/api/toggleFan', { control: newControl })
          .then(response => {
            console.log('Fan control updated:', response.data);
            setFanData(prevData => ({ ...prevData, control: newControl }));
          })
          .catch(error => console.error('Error updating fan control:', error));
      };
    
      return (
        <div className="App">
          <h1>Dashboard Quản Lý Quạt</h1>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="content">
              {/* Section: Sensor Data */}
              <div className="sensor-info">
                <div className="sensor-item">
                  <h2>Nhiệt độ</h2>
                  <p>{fanData.temperature} °C</p>
                </div>
                <div className="sensor-item">
                  <h2>Độ ẩm</h2>
                  <p>{fanData.humidity} %</p>
                </div>
              </div>
    
              {/* Section: Current Threshold Temperature */}
              {fanData.mode === 'auto' && (
                <div className="current-threshold">
                  <h3>Ngưỡng Nhiệt Độ Hiện Tại</h3>
                  <p>{fanData.threshold} °C</p>
                </div>
              )}
    
              {/* Section: Threshold Temperature Control */}
              {fanData.mode === 'auto' && (
                <div className="threshold">
                  <h3>Điều Chỉnh Ngưỡng Nhiệt Độ</h3>
                  <input
                    type="number"
                    value={newThreshold}
                    onChange={handleThresholdChange}
                    placeholder="Nhập ngưỡng nhiệt độ"
                    step="0.1"   // Cho phép nhập số thập phân
                    min="0"      // Ngưỡng nhiệt độ không nhỏ hơn 0
                  />
                  <button onClick={updateThreshold}>Xác Nhận</button>
                </div>
              )}
    
              {/* Section: Mode and Fan Control */}
              <div className="controls">
                <button className="mode-toggle" onClick={toggleMode}>
                  {fanData.mode === 'manual' ? 'Chế Độ Thủ Công' : 'Chế Độ Tự Động'}
                </button>
    
                <div className="fan-status">
                  <p><strong>Trạng thái quạt:</strong> {fanData.control === 'on' ? 'Đang bật' : 'Đang tắt'}</p>
    
                  {fanData.mode === 'manual' && (
                    <button onClick={toggleFan}>
                      {fanData.control === 'on' ? 'Tắt Quạt' : 'Bật Quạt'}
                    </button>
                  )}
                </div>
              </div>
    
              {/* History Buttons */}
              <div className="history-buttons">
                <button className="history-button" onClick={fetchStatusHistory}>
                  Xem Lịch Sử Trạng Thái
                </button>
                <button className="history-button" onClick={fetchSettingsHistory}>
                  Xem Lịch Sử Cài Đặt
                </button>
              </div>
    
              {/* Status History */}
              {isStatusHistoryVisible && (
                <div className="history">
                  {statusHistory.length > 0 && (
                    <div>
                      <h3>Lịch Sử Trạng Thái</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Thời Gian</th>
                            <th>Chế Độ</th>
                            <th>Trạng Thái</th>
                            <th>Nhiệt Độ</th>
                            <th>Độ Ẩm</th>
                            <th>Ngưỡng Nhiệt Độ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusHistory.map((status, index) => (
                            <tr key={index}>
                              <td>{status.timestamp}</td>
                              <td>{status.mode}</td>
                              <td>{status.status}</td>
                              <td>{status.temperature} °C</td>
                              <td>{status.humidity} %</td>
                              <td>{status.mode === 'manual' ? '' : status.threshold}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
    
              {/* Settings History */}
              {isSettingsHistoryVisible && (
                <div className="settings-history">
                  {settingsHistory.length > 0 && (
                    <div>
                      <h3>Lịch Sử Cài Đặt</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Thời Gian</th>
                            <th>Cài Đặt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settingsHistory.map((setting, index) => (
                            <tr key={index}>
                              <td>{setting.timestamp}</td>
                              <td>{setting.setting}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
};

export default Dashboard;
