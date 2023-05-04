const express = require("express");
const cors = require("cors");
const dbConfig = require("./app/config/db.config");

const app = express();

var corsOptions = {
  origin: "http://localhost:3000",
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

const db = require("./app/models");
const Role = db.role;
const User = db.user;

db.mongoose
  .connect(`mongodb+srv://salar:42101365@wheel.1pavbxp.mongodb.net/Wheelof`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch((err) => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to bezkoder application." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
let segments = [
  "2",
  "4",
  "2",
  "8",
  "2",
  "4",
  "2",
  "4",
  "2",
  "8",
  "2",
  "20",
  "2",
  "4",
  "2",
  "4",
  "2",
  "4",
  "2",
  "4",
  "2",
  "10",
  "2",
  "8",
  "2",
  "25",
  "2",
  "0",
  "10",
];
let wheel = {
  status: "Pending",
  number: 0,
  total: 0,
  net: 0,
  avex: 0,
  aveBetx: 0,
  serverCode: Math.floor(Math.random() * 9999),
  serverSec: 0,
  startNum: 1,
  date: new Date(),
  users: [],
};
let timeSpin = 45;
// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
const { Server } = require("socket.io");

const io = new Server(2020, {
  cors: {
    origin: "http://localhost:3000",
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
  },
});
const wheelNamespace = io.of("/wheel");
wheelNamespace.use((socket, next) => {
  const user = socket.handshake.auth;

  if (socket.user != user.username || 1 == 1) {
    socket.userdata = user;
    socket.user = user.username;
  } else {
    socket.userdata = user;
  }
  if (socket.user != null) {
    wheelNamespace.in(user.username).disconnectSockets(true);

    socket.join(user.username);
  }

  next();
});

wheelNamespace.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // the disconnection was initiated by the server, you need to reconnect manually
    wheelNamespace.connect();
  }
  console.log(reason); // else the socket will automatically try to reconnect
});
wheelNamespace.on("connection", (socket) => {
  socket.on("getwheel", () => {
    wheelNamespace
      .in(socket.user)
      .emit("msg", { command: "update", data: wheel });
    wheelNamespace.in(socket.user).emit("msg", {
      command: "user",
      data: socket.userdata,
    });
    wheelNamespace.in(socket.user).emit("msg", {
      command: "online",
      data: wheelNamespace.sockets.size,
    });
  });

  socket.on("addBet", (data) => {
    if (wheel.status == "Pending") {
      data.date = new Date();
      data.win = -1;
      data.username = socket.user;
      wheel.users.push(data);

      wheel.total = wheel.total + data.bet;

      wheelNamespace.emit("msg", { command: "update", data: wheel });
    }
  });
  socket.on("getlist", async (data) => {
    if (data.sorting.win) {
      var udata = [];
      const userswin = await db.userWheel
        .find({ username: socket.user }, { pid: 1 })
        .limit(20)
        .sort(data.sorting);

      var userlist = groupBySingleField(userswin, "pid");

      Object.keys(userlist).forEach((key) => {
        udata.push({ _id: key });
      });

      const wh = await db.Wheel.find({ $or: udata })
        .sort({ net: -1 })
        .populate("wheelusers");
      wheelNamespace
        .in(socket.user)
        .emit("msg", { command: data.command, data: wh });
    } else {
      const users2 = await db.Wheel.find({ status: "Done" })
        .limit(25)
        .sort(data.sorting)
        .populate("wheelusers");
      wheelNamespace.emit("msg", { command: data.command, data: users2 });
    }
  });

  // getLast(socket);
});
function initial() {
  console.log("initial");
  const createWheelData = () => {
    const d = new Date();
    let seconds = d.getSeconds();
    let newwheel = {
      status: "Pending",
      number: 0,
      total: 0,
      net: 0,
      serverCode: Math.floor(Math.random() * 9999),
      avex: 0,
      aveBetx: 0,
      serverSec: seconds,
      startNum: wheel.number,
      date: d,
      users: [],
    };

    wheel = newwheel;

    wheelNamespace.emit("msg", {
      command: "update",
      data: wheel,
    });
    setTimeout(() => {
      spin();
    }, 30000);
  };
  const spin = () => {
    const d = new Date();
    let seconds = d.getSeconds();

    wheel.serverSec = seconds;
    let newPrizeNumber = getPrizePos(wheel);
    wheel.number = newPrizeNumber;

    wheel.status = "Spin";
    wheelNamespace.emit("msg", {
      command: "update",
      data: wheel,
    });
    setTimeout(() => {
      spinstop();
    }, 10000);
    if (wheel.users.length > 0) {
      dec();
    }
  };
  const spinstop = () => {
    var _time = 1000;
    wheel.status = "Spining";
    var _tot = 0;
    var _net = 0;
    if (wheel.users.length > 0) {
      wheel.users.forEach((item) => {
        item.win = item.bet * getPrize(segments[wheel.number], item.position);
        _tot = _tot + item.bet;
        _net = _net + item.win;
      });
    }
    wheel.total = _tot;
    wheel.net = _net;
    wheelNamespace.emit("msg", {
      command: "update",
      data: wheel,
    });
    if (wheel.users.length > 0) {
      _time = 2000;
      inc();
    }

    setTimeout(() => {
      doneWheel();
    }, _time);
  };
  const doneWheel = async () => {
    var _time = 1000;
    wheel.status = "Done";
    wheelNamespace.emit("msg", {
      command: "update",
      data: wheel,
    });
    if (wheel.total > 0) {
      _time = 3000;
      let wu = wheel.users;
      var wheeldb = await createWheel(wheel);

      wu.forEach(async (item) => {
        item.pid = wheeldb._id;
        var user = await createUser(wheeldb._id, item);
      });
    }

    setTimeout(() => {
      createWheelData();
    }, _time);
  };
  createWheelData();
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "moderator",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'moderator' to roles collection");
      });

      new Role({
        name: "admin",
      }).save((err) => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}

const getPrize = (newPrizeNumber, pos) => {
  var num = 0;
  if (parseInt(newPrizeNumber.replace("x", "")) == parseInt(pos)) {
    num = parseInt(pos);
  }

  return num;
};
function groupByMultipleFields(data, ...fields) {
  if (fields.length === 0) return;
  let newData = {};
  const [field] = fields;
  newData = groupBySingleField(data, field);
  const remainingFields = fields.slice(1);
  if (remainingFields.length > 0) {
    Object.keys(newData).forEach((key) => {
      newData[key] = groupByMultipleFields(newData[key], ...remainingFields);
    });
  }
  return newData;
}
function groupBySingleField(data, field) {
  return data.reduce((acc, val) => {
    const rest = Object.keys(val).reduce((newObj, key) => {
      if (key !== field) {
        newObj[key] = val[key];
      }
      return newObj;
    }, {});
    if (acc[val[field]]) {
      acc[val[field]].push(rest);
    } else {
      acc[val[field]] = [rest];
    }
    return acc;
  }, {});
}
const getPrizePos = (users) => {
  var newPrizeNumber = users.serverCode * users?.startNum;

  newPrizeNumber = newPrizeNumber + users.serverCode * users?.serverSec;
  newPrizeNumber = newPrizeNumber % segments.length;

  return newPrizeNumber;
};
const getPrizeAve = (wheel, pos) => {
  var newPrizeNumber = wheel.number;
  try {
    if (pos) {
      var newData = groupBySingleField(wheel.users, "position");
      var num = 0;
      var numtot = 0;

      for (const property in newData) {
        numtot = numtot + 1;
        num =
          num +
          parseFloat(getPrize(segments[newPrizeNumber], parseInt(property)));
      }
      num = parseFloat(num / numtot).toFixed(2);
    } else {
      var num = parseFloat(getPrize(segments[newPrizeNumber], 2));
      num = num + parseFloat(getPrize(segments[newPrizeNumber], 4));
      num = num + parseFloat(getPrize(segments[newPrizeNumber], 8));
      num = num + parseFloat(getPrize(segments[newPrizeNumber], 10));
      num = num + parseFloat(getPrize(segments[newPrizeNumber], 20));
      num = num + parseFloat(getPrize(segments[newPrizeNumber], 25));

      num = parseFloat(num / 6).toFixed(2);
    }
  } catch (error) {}

  return num;
};

function groupBySingleField(data, field) {
  return data.reduce((acc, val) => {
    const rest = Object.keys(val).reduce((newObj, key) => {
      if (key !== field) {
        newObj[key] = val[key];
      }
      return newObj;
    }, {});
    if (acc[val[field]]) {
      acc[val[field]].push(rest);
    } else {
      acc[val[field]] = [rest];
    }
    return acc;
  }, {});
}
const sumOfBet = (array) => {
  return array.reduce((sum, currentValue) => {
    var _am = currentValue.bet;
    return sum + _am;
  }, 0);
};
const sumOfWin = (array) => {
  return array.reduce((sum, currentValue) => {
    var _am = currentValue.win;
    return sum + _am;
  }, 0);
};
const dec = async () => {
  var newData = groupBySingleField(wheel.users, "username");

  for (const property in newData) {
    var newuser = await User.findOneAndUpdate(
      { username: property },
      { $inc: { balance2: sumOfBet(newData[property]) * -1 } }
    ).then((res) => {
      if (res?.username) {
        var _d = res;
        _d.balance2 = _d.balance2 - sumOfBet(newData[property]);

        wheelNamespace.in(res.username).emit("msg", {
          command: "user",
          data: _d,
        });
      }
    });
  }
  // if (blnupdate) wheelNamespace.emit("msg", { command: "update", data: wheel });
};
const inc = () => {
  var newDatainc = groupBySingleField(wheel.users, "username");

  for (const property in newDatainc) {
    if (sumOfWin(newDatainc[property]) > 0) {
      var newuserinc = User.findOneAndUpdate(
        { username: property },
        { $inc: { balance2: sumOfWin(newDatainc[property]) } }
      ).then((res) => {
        if (res?.username) {
          var _d = res;
          _d.balance2 = _d.balance2 + sumOfWin(newDatainc[property]);

          wheelNamespace.in(res.username).emit("msg", {
            command: "user",
            data: _d,
          });
        }
      });
    }
  }
};

const createWheel = function (tutorial) {
  tutorial.users = [];
  return db.Wheel.create(tutorial).then((docTutorial) => {
    return docTutorial;
  });
};
const createUser = function (wheelId, comment) {
  return db.userWheel.create(comment).then((docComment) => {
    return db.Wheel.findByIdAndUpdate(
      wheelId,
      { $push: { wheelusers: docComment._id } },
      { new: true, useFindAndModify: false }
    );
  });
};
