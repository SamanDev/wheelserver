const express = require("express");
const { Server } = require("socket.io");
const users = require("./users");
const bets = require("./bets");
const app = express();
const hostname = "127.0.0.1";
const port = 3001;
var cors = require("cors");
const io = new Server(2020, {
  cors: {
    origin: "http://localhost:3000",
    // or with an array of origins
    // origin: ["https://my-frontend.com", "https://my-other-frontend.com", "http://localhost:3000"],
    credentials: true,
  },
});
io.on("connection", (socket) => {
  socket.on("ping", (callback) => {
    callback();
  });
});

app.use(express.json());

app.get("/api/:user", (req, res) => {
  users.push({
    id: users.length + 1,
    username: req.params.user,
  });
  res.json({ data: users });

  res.end();
});
app.post("/bet/:user/:bet", cors(), (req, res) => {
  bets.push({
    id: users.length + 1,
    username: req.params.user,
    amount: req.params.bet,
  });
  res.json({ data: bets });

  res.end();
});
app.listen(() => {
  console.log(hostname + ":" + port);
});
