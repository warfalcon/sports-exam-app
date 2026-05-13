const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.put('/', auth, async (req, res) => {
  try {
    const { examDate, password } = req.body;
    
    const updates = {};
    if (examDate) updates.examDate = examDate;
    if (password) updates.password = password;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      user: {
        id: user._id,
        username: user.username,
        gender: user.gender,
        color: user.color,
        examDate: user.examDate
      }
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/list', auth, async (req, res) => {
  try {
    const users = await User.find().select('username gender');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

module.exports = router;