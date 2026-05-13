const express = require('express');
const Record = require('../models/Record');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', auth, async (req, res) => {
  try {
    const { date, sports, duration, note } = req.body;
    
    const record = new Record({
      userId: req.user._id,
      date,
      sports,
      duration,
      note
    });

    await record.save();
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { sport, startDate, endDate } = req.query;
    
    let query = { userId: req.user._id };
    
    if (sport && sport !== 'all') {
      query['sports.type'] = sport;
    }
    
    if (startDate) {
      query.date = { ...query.date, $gte: new Date(startDate) };
    }
    
    if (endDate) {
      query.date = { ...query.date, $lte: new Date(endDate) };
    }

    const records = await Record.find(query).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const records = await Record.find({
      userId: req.user._id,
      date: { $gte: thisMonth }
    });

    const thisMonthRecords = records.length;
    
    const streak = await calculateStreak(req.user._id);
    
    const allRecords = await Record.countDocuments({ userId: req.user._id });

    res.json({
      thisMonthRecords,
      streak,
      totalRecords: allRecords
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.get('/trend', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await Record.find({
      userId: req.user._id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRecords = records.filter(r => 
        r.date.toISOString().split('T')[0] === dateStr
      );
      
      trendData.push({
        date: dateStr,
        count: dayRecords.length,
        totalScore: dayRecords.reduce((sum, r) => 
          sum + r.sports.reduce((s, sport) => s + (sport.score || 0), 0), 0
        )
      });
    }

    res.json(trendData);
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const record = await Record.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!record) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
});

async function calculateStreak(userId) {
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    
    const hasRecord = await Record.exists({
      userId,
      date: {
        $gte: checkDate,
        $lt: new Date(checkDate.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (hasRecord) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return streak;
}

module.exports = router;