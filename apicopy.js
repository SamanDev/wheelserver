const express = require("express");
const app = express();
const hostname = "127.0.0.1";
const port = 8080;
const db = require("./models");
const mongoose = require("mongoose");
const axios = require("axios").create({ baseUrl: "http://139.99.144.72:8081" });

let segments = [
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
let wheel = {
  status: "Pending",
  number: 0,
  total: 0,
  net: 0,
  avex: 0,
  aveBetx: 0,
  serverCode: Math.floor(Math.random() * 9999),
  serverSec: 0,
  startNum: 0,
  date: new Date(),
  users: [],
};
let timeSpin = 17;

app.use(express.json());

const { Server } = require("socket.io");

const io = new Server(2020, {
  cors: {
    origin: "http://localhost:3000",
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
  },
});
const getUserService2 = (token) => {
  return axios({
    url: "http://139.99.144.72:8081/api/req/getUser",
    method: "get",
    headers: {
      Authorization: token ? `LooLe  ${token}` : null,
    },
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      return err;
    });
};
const getUserService = (token, user) => {
  return axios({
    url: "http://139.99.144.72:2053/MavenSpringApi?Password=aPipASsSeCreT@Key!&JSON=Yes",
    method: "post",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },

    data: "Command=AccountsGet&Player=" + user,
  })
    .then((response) => {
      return response.data;
    })
    .catch((err) => {
      return err;
    });
};
const wheelNamespace = io.of("/wheel");
wheelNamespace.use(async (socket, next) => {
  const user = socket.handshake.auth.username;
  const token = socket.handshake.auth.token;
  console.log(user);
  if (socket.user != user) {
    const userdata = await getUserService(token, user);
    console.log(userdata);
    if (userdata?.username == user) {
      wheelNamespace.in(user).disconnectSockets(true);

      socket.join(user);

      socket.userdata = userdata;
      socket.user = userdata.username;
      next();
    } else {
      next();
    }
  } else {
    next();
  }
});

wheelNamespace.on("disconnect", (reason) => {
  if (reason === "io server disconnect") {
    // the disconnection was initiated by the server, you need to reconnect manually
    wheelNamespace.connect();
  }
  console.log(reason); // else the socket will automatically try to reconnect
});
wheelNamespace.on("connection", async (socket) => {
  socket.on("addBet", async (data) => {
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
    wheelNamespace.in(socket.user).emit("msg", {
      command: "online",
      data: wheelNamespace.sockets.size,
    });
    console.log(socket.user);
    wheelNamespace
      .in(socket.user)
      .emit("msg", { command: "user", data: socket.userdata });
    wheelNamespace
      .in(socket.user)
      .emit("msg", { command: "update", data: wheel });
    const users2 = await db.Wheel.find({ status: "Done" })
      .limit(10)
      .sort(data.sorting)
      .populate("users");
    wheelNamespace
      .in(socket.user)
      .emit("msg", { command: data.command, data: users2 });
  });
  // getLast(socket);
});

const getPrize = (newPrizeNumber, pos) => {
  var num = newPrizeNumber + pos;
  if (num < 0) {
    num = segments.length + num;
  }
  if (num > segments.length - 1) {
    num = num - segments.length;
  }

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
const getPrizePos = (users) => {
  var newPrizeNumber = users.serverCode * users?.serverSec;
  newPrizeNumber = newPrizeNumber + users.serverCode * users?.startNum;
  newPrizeNumber = newPrizeNumber + users.serverCode * users?.total;
  newPrizeNumber = newPrizeNumber % segments.length;
  return newPrizeNumber;
};
const getPrizeAve = (wheel, pos) => {
  var newPrizeNumber = wheel.number;
  if (pos) {
    var newData = groupBySingleField(wheel.users, "position");
    var num = 0;
    var numtot = 0;

    for (const property in newData) {
      numtot = numtot + 1;
      num =
        num +
        parseFloat(segments[getPrize(newPrizeNumber, parseInt(property))]);
    }
    num = parseFloat(num / numtot).toFixed(2);
  } else {
    var num = parseFloat(segments[getPrize(newPrizeNumber, -4)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, -3)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, -2)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, -1)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, 0)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, 1)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, 2)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, 3)]);
    num = num + parseFloat(segments[getPrize(newPrizeNumber, 4)]);

    num = parseFloat(num / 9).toFixed(2);
  }

  return num;
};
let users2;
const getLast = async (socket) => {
  users2 = await db.Wheel.find({ status: "Done" })
    .limit(10)
    .sort({ date: -1 })
    .populate("users");
  wheelNamespace.emit("msg", { command: "lastList", data: users2 });
};

const spin = (id) => {
  if (wheel.status == "Pending") {
    const d = new Date();
    let seconds = d.getSeconds();
    wheelNamespace.emit("msg", {
      command: "sec",
      data: parseInt(seconds),
    });

    wheel.serverSec = seconds;
    let newPrizeNumber = getPrizePos(wheel);
    wheel.number = newPrizeNumber;
    //wheelNamespace.emit("msg", { command: "spin", data: newPrizeNumber });

    wheel.status = "Spin";
    wheelNamespace.emit("msg", { command: "update", data: wheel });
  }
};

const createWheel = function (tutorial) {
  tutorial.users = [];
  return db.Wheel.create(tutorial).then((docTutorial) => {
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
const start = async () => {
  try {
    await mongoose

      .connect("mongodb+srv://salar:42101365@wheel.1pavbxp.mongodb.net/Wheelof")
      .then(() => console.log("connection"));

    app.listen(
      port,

      () => {
        console.log(hostname + ":" + port);
        setInterval(async () => {
          if (wheel.status != "Done") {
            var t1 = wheel.date;
            var t2 = new Date();
            var dif = t1.getTime() - t2.getTime();

            var Seconds_from_T1_to_T2 = dif / 1000;
            var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);
            var bagh = timeSpin - (Seconds_Between_Dates % timeSpin);
            if (wheel.status == "Pending") {
              if (parseInt(bagh) == 0) {
                spin();
              } else {
                wheelNamespace.emit("msg", {
                  command: "time",
                  data: parseInt(bagh),
                });
                const d = new Date();
                let seconds = d.getSeconds();
                wheelNamespace.emit("msg", {
                  command: "sec",
                  data: parseInt(seconds),
                });
              }
            } else {
              if (parseInt(bagh) == 10 && wheel.status == "Spin") {
                wheel.status = "Spining";
                var _tot = 0;
                var _net = 0;
                wheel.users.forEach(async (item) => {
                  item.win =
                    item.bet * segments[getPrize(wheel.number, item.position)];
                  _tot = _tot + item.bet;
                  _net = _net + item.win;
                });
                wheel.total = _tot;
                wheel.net = _net;
                wheel.avex = getPrizeAve(wheel, false);
                wheel.aveBetx = _tot > 0 ? getPrizeAve(wheel, true) : 0;
                wheelNamespace.emit("msg", {
                  command: "update",
                  data: wheel,
                });
              } else {
                if (wheel.status == "Spining") {
                  if (parseInt(bagh) == 7) {
                    if (wheel.total > 0) {
                      wheel.status = "Done";
                      let wu = wheel.users;
                      var wheeldb = await createWheel(wheel);

                      wu.forEach(async (item) => {
                        item.pid = wheeldb._id;
                        var user = await createUser(wheeldb._id, item);
                      });
                      wheelNamespace.emit("msg", {
                        command: "update",
                        data: wheel,
                      });
                    } else {
                      wheel.status = "Done";

                      wheelNamespace.emit("msg", {
                        command: "update",
                        data: wheel,
                      });
                    }
                  }
                }
              }
            }
          } else {
            if (wheel.status == "Done") {
              let newwheel = {
                status: "Pending",
                number: 0,
                total: 0,
                net: 0,
                serverCode: Math.floor(Math.random() * 9999),
                avex: 0,
                aveBetx: 0,

                serverSec: 0,
                startNum: wheel.number,
                date: new Date(),
                users: [],
              };

              wheel = newwheel;
              wheelNamespace.emit("msg", {
                command: "update",
                data: wheel,
              });
            }
          }
        }, 1000);
      }
    );
  } catch (error) {
    console.error(error);
    //process.exit(1);
  }
};

start();
