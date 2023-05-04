const express = require("express");
const app = express();
const hostname = "127.0.0.1";
const port = 8080;
const db = require("./models");
const mongoose = require("mongoose");

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

io.on("connection", async (socket) => {
  const users = db.Wheel.find();
  /* var tutorial = await createWheel({
    title: "Tutorial #1",
    number: 4,
  });

  var user = await createUser(tutorial._id, {
    username: "jack",
    bet: 10,
  });
  
  var tutorials = await getTutorialsInCategory(tutorial._id);
  console.log("\n>> all Tutorials in Cagetory:\n", tutorials);

  console.log("\n>> Tutorial:\n", tutorial); */
  io.emit("msg", { command: "connected", data: users });
});
const getTutorialsInCategory = function (categoryId) {
  return db.User.find({ category: categoryId })
    .populate("category", "name -_id")
    .select("-comments -images -__v");
};
const createWheel = function (tutorial) {
  return db.Wheel.create(tutorial).then((docTutorial) => {
    console.log("\n>> Created Tutorial:\n", docTutorial);
    return docTutorial;
  });
};
const createUser = function (wheelId, comment) {
  return db.User.create(comment).then((docComment) => {
    console.log("\n>> Created Comment:\n", docComment);

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
