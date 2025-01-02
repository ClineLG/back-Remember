const mongoose = require("mongoose");
const { type } = require("node:os");

const todoSchema = new mongoose.Schema({
  task: { type: String },
  done: { type: Boolean, default: false },
  date: { type: Date, default: Date.now },
  pro: { type: Boolean, default: false },
  perso: { type: Boolean, default: true },
  emergency: { type: Boolean, default: false },
});

const thinkSchema = new mongoose.Schema({
  title: { type: String },
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
