const mongoose = require("mongoose");

const User = mongoose.model(
  "userWheel",
  new mongoose.Schema({
    username: { type: String },
    pid: { type: String },
    wheel: { type: String },

    position: { type: Number, default: 0 },
    bet: { type: Number, default: 0 },
    win: { type: Number, default: -1 },
    date: { type: Date, default: Date.now },
  })
);

module.exports = User;
