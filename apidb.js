const express = require("express");
const app = express();
const hostname = "127.0.0.1";
const port = 8080;
const db = require("./models");
const mongoose = require("mongoose");
const segments = [
  "0",
  ".5",
  "0",
  "3",
  "0",
  "2",
  "0",
  ".5",
  "0",
  ".5",
  "0",
  "20",
  "0",
  "2",
  "0",
  ".5",
  "0",
  "3",
  "0",
  ".5",
  "0",
  "2",
  "0",
  ".5",
  "0",
  ".5",
  "0",
  "2",
  "0",
  "2",
  "0",
  "5",
];
const wheelSchema = new mongoose.Schema({
  bet: { type: Number, default: 0 },
  date: { type: Date, default: Date.now },
});

async function saveUser(val) {
  const filter = { username: val.username };
  const options = { upsert: true };
  const updateDoc = {};

  const result = await User.updateOne(filter, updateDoc, options);
  console.log(
    `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
  );
}
async function saveBet(val) {
  const filter = { username: val.username };
  const options = { upsert: true };
  const updateDoc = {
    $set: { bet: val.bet },
  };

  const result = await User.updateOne(filter, updateDoc, options);
  console.log(
    `${result.matchedCount} document(s) matched the filter, updated ${result.modifiedCount} document(s)`
  );
}

app.use(express.json());

app.get("/api/users", async (req, res) => {
  const users = await User.find();

  return res.status(200).json(users);
});

app.get("/api/addbet", async (req, res) => {
  const bet = new Bet({
    username: req.query.username,
    bet: req.query.bet,
  });
  const myres = await bet.save();

  return res.status(200).json(myres);
});
const { Server } = require("socket.io");

const io = new Server(2020, {
  cors: {
    origin: "http://localhost:3000",
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
    credentials: true,
  },
});
const options = { upsert: true };
io.on("connection", async (socket) => {
  addNewWheel(socket.id);
  socket.on("addBet", async (data, wheel) => {
    var user = await createUser(data.pid, data);
    data.date = Date.now;

    wheel[0].total = wheel[0].total + data.bet;
    io.emit("msg", { command: "pushbet", data: data, wheel: wheel });
    const filter = { status: "Pending" };
  });
  socket.on("spin", async (data) => {
    spin(socket.id);
  });
  socket.once("getlist", async () => {
    getLast();
  });
});
setInterval(async () => {}, 20000);

const getPrize = (newPrizeNumber, pos) => {
  var num = newPrizeNumber + pos;
  if (num < 0) {
    num = segments.length - num;
  }
  if (num > segments.length - 1) {
    num = num - segments.length;
  }

  return num;
};
const getLast = async (id) => {
  const users2 = await db.Wheel.find({ status: "Done" })
    .limit(10)
    .sort({ date: -1 })
    .populate("users");

  io.emit("msg", { command: "lastList", data: users2 });
};
const spin = async (id) => {
  const newPrizeNumber = Math.floor(Math.random() * (segments.length - 1));
  //const newPrizeNumber = 15;

  const filteruser = { win: -1 };

  const resultuser = await db.User.find(filteruser);
  var _tot = 0;
  var _net = 0;
  resultuser.forEach(async (item) => {
    item.win = item.bet * segments[getPrize(newPrizeNumber, item.position)];
    _tot = _tot + item.bet;
    _net = _net + item.win;

    const result2 = await db.User.updateOne(
      { _id: item._id, pid: item.pid },
      item,
      options
    );
  });

  const filter = { status: "Pending" };

  // users[0].number = newPrizeNumber;
  //users[0].status = "Done";
  const updateDoc = {
    $set: { number: newPrizeNumber, total: _tot, net: _net },
  };
  const result = await db.Wheel.updateOne(filter, updateDoc, options);
  const users = await db.Wheel.find({ status: "Pending", number: { $gte: 0 } })
    .limit(1)
    .sort({ date: -1 })
    .populate("users");

  io.to(id).emit("msg", { command: "spin", data: users });

  const updateDoc2 = {
    $set: { status: "Done" },
  };
  const resultw = await db.Wheel.updateOne(
    { status: "Pending", number: { $gte: 0 } },
    updateDoc2,
    options
  );
  setTimeout(async () => {
    addNewWheel(id);
  }, 30000);
};
const addNewWheel = async (id) => {
  const users = await db.Wheel.find({ status: "Pending" })
    .limit(1)
    .sort({ date: -1 })
    .populate("users");
  if (users.length == 0) {
    var tutorial = await createWheel();

    io.to(id).emit("msg", { command: "update", data: [tutorial] });
  } else {
    clearTimeout(setTime);
    io.to(id).emit("msg", { command: "update", data: users });
    var setTime = setTimeout(async () => {
      //spin(users[0]._id);
    }, 1000);
  }
};
const createWheel = function (tutorial) {
  return db.Wheel.create(tutorial).then((docTutorial) => {
    clearTimeout(setW);
    var setW = setTimeout(() => {
      spin(docTutorial._id);
    }, 30000);
    return docTutorial;
  });
};
const createUser = function (wheelId, comment) {
  return db.User.create(comment).then((docComment) => {
    return db.Wheel.findByIdAndUpdate(
      wheelId,
      { $push: { users: docComment._id } },
      { new: true, useFindAndModify: false }
    );
  });
};
const getTutorialWithPopulate = function (id) {
  return db.Wheel.findById(id).populate("users");
};
const start = async () => {
  try {
    await mongoose
      .connect("mongodb+srv://salar:42101365@wheel.fynaznf.mongodb.net/test")
      .then(() => console.log("connection"));

    app.listen(
      port,

      () => {
        console.log(hostname + ":" + port);
      }
    );
  } catch (error) {
    console.error(error);
    //process.exit(1);
  }
};

start();
