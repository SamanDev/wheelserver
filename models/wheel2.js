const mongoose = require("mongoose");

const Wheel = mongoose.model(
  "Wheel",
  new mongoose.Schema({
    status: { type: String, default: "Pending" },
    number: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  })
);

module.exports = Wheel;
