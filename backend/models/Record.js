const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  sports: [{
    type: {
      type: String,
      enum: ['800m', '50m', 'situp', 'jump', 'stretch'],
      required: true
    },
    result: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      default: 0
    }
  }],
  duration: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

recordSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Record', recordSchema);