require('dotenv').config();
const express = require('express');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 初始化数据库
const dbPath = path.join(__dirname, 'database.json');
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, {
  users: [],
  records: []
});

// 认证中间件
function auth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: '未授权访问' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = db.data.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: '用户不存在' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'token无效' });
  }
}

// 注册
app.post('/api/auth/register', async (req, res) => {
  await db.read();
  
  const { username, password, gender, color } = req.body;
  
  if (!username || !password || !gender) {
    return res.status(400).json({ message: '请填写完整信息' });
  }

  const existingUser = db.data.users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ message: '用户名已存在' });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = {
    id: Date.now(),
    username,
    password: hashedPassword,
    gender,
    color: color || 'blue',
    examDate: null,
    createdAt: new Date().toISOString()
  };

  db.data.users.push(user);
  await db.write();

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  res.status(201).json({
    token,
    user: {
      id: user.id,
      username: user.username,
      gender: user.gender,
      color: user.color,
      examDate: user.examDate
    }
  });
});

// 登录
app.post('/api/auth/login', async (req, res) => {
  await db.read();
  
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: '请填写用户名和密码' });
  }

  const user = db.data.users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: '用户名或密码错误' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: '用户名或密码错误' });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      gender: user.gender,
      color: user.color,
      examDate: user.examDate
    }
  });
});

// 获取当前用户
app.get('/api/auth/me', auth, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      gender: req.user.gender,
      color: req.user.color,
      examDate: req.user.examDate
    }
  });
});

// 获取用户列表（不需要认证）
app.get('/api/users/list', async (req, res) => {
  await db.read();
  const users = db.data.users.map(u => ({
    username: u.username,
    gender: u.gender
  }));
  res.json(users);
});

// 更新用户信息
app.put('/api/users', auth, async (req, res) => {
  await db.read();
  
  const { examDate, password } = req.body;
  const userIndex = db.data.users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: '用户不存在' });
  }

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.data.users[userIndex].password = hashedPassword;
  }
  
  if (examDate !== undefined) {
    db.data.users[userIndex].examDate = examDate;
  }
  
  await db.write();
  
  const updatedUser = db.data.users[userIndex];
  res.json({
    user: {
      id: updatedUser.id,
      username: updatedUser.username,
      gender: updatedUser.gender,
      color: updatedUser.color,
      examDate: updatedUser.examDate
    }
  });
});

// 创建记录
app.post('/api/records', auth, async (req, res) => {
  await db.read();
  
  const { date, sports, duration, note } = req.body;
  
  const record = {
    id: Date.now(),
    userId: req.user.id,
    date,
    sports,
    duration: duration || 0,
    note: note || '',
    createdAt: new Date().toISOString()
  };

  db.data.records.push(record);
  await db.write();
  
  res.status(201).json(record);
});

// 获取记录列表
app.get('/api/records', auth, async (req, res) => {
  await db.read();
  
  const { sport, startDate, endDate } = req.query;
  
  let filtered = db.data.records.filter(r => r.userId === req.user.id);
  
  if (startDate) {
    filtered = filtered.filter(r => r.date >= startDate);
  }
  
  if (endDate) {
    filtered = filtered.filter(r => r.date <= endDate);
  }
  
  if (sport && sport !== 'all') {
    filtered = filtered.filter(r => r.sports.some(s => s.type === sport));
  }
  
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  res.json(filtered);
});

// 删除记录
app.delete('/api/records/:id', auth, async (req, res) => {
  await db.read();
  
  const recordIndex = db.data.records.findIndex(
    r => r.id === parseInt(req.params.id) && r.userId === req.user.id
  );
  
  if (recordIndex === -1) {
    return res.status(404).json({ message: '记录不存在' });
  }
  
  db.data.records.splice(recordIndex, 1);
  await db.write();
  
  res.json({ message: '删除成功' });
});

// 首页
app.get('/', (req, res) => {
  res.json({ message: '体育打卡后端服务运行中' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});