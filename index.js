const express = require("express");

const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
app.use(cors());

require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI);

app.use(express.json());

const userRoutes = require("./routes/user");
app.use("/user", userRoutes);

app.get("/", (req, res) => {
  res.status(200).json("welcome on Remember app");
});

app.all("*", (req, res) => {
  res.status(404).json("Page not found");
});

app.listen(process.env.PORT, () => {
  console.log("Server is running 🤘");
});
