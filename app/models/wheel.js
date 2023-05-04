const mongoose = require("mongoose");

const Wheel = mongoose.model(
  "Wheel",
  new mongoose.Schema({
    status: { type: String, default: "Pending" },
    number: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    avex: { type: Number, default: 0 },
    aveBetx: { type: Number, default: 0 },
    serverCode: { type: Number, default: 0 },
    serverSec: { type: Number, default: 0 },
    startNum: { type: Number, default: 0 },

    date: { type: Date, default: Date.now },
    wheelusers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userWheel",
      },
    ],
  })
);

module.exports = Wheel;
