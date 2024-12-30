const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema({
  task: { type: String, unique: true },
  done: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
});

const thinkSchema = new mongoose.Schema({
  think: { type: String },
  date: { type: Date, default: Date.now },
  image: { type: Object },
});

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  username: { type: String, required: true },
  avatar: { type: Object },
  token: { type: String },
  hash: { type: String },
  salt: { type: String },
  todos: [todoSchema],
  thinks: [thinkSchema],
});

const User = mongoose.model("User", userSchema);

module.exports = User;
