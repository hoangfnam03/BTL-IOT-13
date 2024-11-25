const mysql = require('mysql');

// Tạo kết nối
const db = mysql.createConnection({
  host: 'localhost',       // Địa chỉ MySQL
  user: 'root',            // Tên người dùng MySQL
  password: '',    // Mật khẩu
  database: 'iot'   // Tên database
});

// Kết nối
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

module.exports = db;
