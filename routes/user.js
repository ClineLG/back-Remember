const express = require("express");

const router = express.Router();

const User = require("../models/User");

const fileUpload = require("express-fileupload");

const uid2 = require("uid2");

const SHA256 = require("crypto-js/sha256");

const encBase64 = require("crypto-js/enc-base64");
const convertToBase64 = require("../utils/convertToBase64");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const isAuthenticated = require("../middleware/isAuthenticated");
const { todo } = require("node:test");

router.post("/signup", fileUpload(), async (req, res) => {
  try {
    console.log(req.body);

    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ message: "Parametters missing" });
    }

    const isUserExist = await User.findOne({ email: email });
    if (isUserExist) {
      return res.status(400).json({ message: "email already used" });
    }
    const salt = uid2(24);
    const hash = SHA256(password + salt).toString(encBase64);
    const token = uid2(34);

    const newUser = new User({
      email: email,
      username: username,
      token: token,
      hash: hash,
      salt: salt,
    });

    if (req.files) {
      const convertedImage = convertToBase64(req.files.image);
      const image = await cloudinary.uploader.upload(convertedImage, {
        folder: `Rememeber/user/${newUser._id}`,
      });
      newUser.avatar = {
        secure_url: image.secure_url,
        public_id: image.public_id,
      };
    }
    await newUser.save();

    res.status(200).json({
      _id: newUser._id,
      token: newUser.token,
      username: newUser.username,
      avatar: newUser.avatar,
      todos: null,
      thinks: null,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    console.log(req.body);

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Parametters missing" });
    }

    const userDetails = await User.findOne({ email: email });

    if (!userDetails) {
      return res.status(404).json({ error: "Email address unknown" });
    }
    const { salt, token, hash, _id, username, avatar } = userDetails;

    const hashTest = SHA256(password + salt).toString(encBase64);

    if (hashTest !== hash) {
      return res.status(404).json({ message: "wrong parameters" });
    }

    res.status(200).json({
      _id: _id,
      token: token,
      username: username,
      avatar: avatar,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get("/allTasks", isAuthenticated, async (req, res) => {
  try {
    const tasks = await User.findById(req.body.user).select("todos");
    res.status(200).json(tasks);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put("/addTask", isAuthenticated, async (req, res) => {
  try {
    console.log(req.body);

    const { task, pro, perso, emergency } = req.body;
    const user = await User.findById(req.body.user);

    user.todos.push({
      task: task,
      pro: pro,
      perso: perso,
      emergency: emergency,
    });

    await user.save();
    res.status(200).json(user.todos[user.todos.length - 1]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put("/taskDone", isAuthenticated, async (req, res) => {
  try {
    console.log(req.body);

    const { taskId } = req.body;
    const user = await User.findById(req.body.user);
    const task = user.todos.id(taskId);
    task.done = !task.done;
    await user.save();
    res.status(200).json(user.todos.id(taskId));
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});
router.delete("/deleteTask/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params);
    const id = req.params.id;
    const user = await User.findById(req.body.user);
    const taskTodelete = user.todos.id(id);
    user.todos.pull(taskTodelete);
    await user.save();

    res.status(200).json({ message: "task successfully deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.get("/allThoughts", isAuthenticated, async (req, res) => {
  try {
    const thoughts = await User.findById(req.body.user).select("thinks");
    res.status(200).json(thoughts);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put("/addThink", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    // console.log("REQBODYTHINKS", req.body);

    const { think, title } = req.body;

    const user = await User.findById(req.body.user);
    if (req.files) {
      const convertedImage = convertToBase64(req.files.image);
      const image = await cloudinary.uploader.upload(convertedImage, {
        folder: `Remember/user/${user._id}`,
      });

      user.thinks.push({
        title: title,
        think: think,
        image: {
          secure_url: image.secure_url,
          public_id: image.public_id,
        },
      });
    } else {
      user.thinks.push({ title: title, think: think });
    }
    console.log(user.thinks[user.thinks.length - 1]);
    await user.save();
    res.status(200).json(user.thinks[user.thinks.length - 1]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/deleteThink/:id", isAuthenticated, async (req, res) => {
  try {
    console.log(req.params);
    const id = req.params.id;
    const user = await User.findById(req.body.user);
    const thinkTodelete = user.thinks.id(id);

    if (user.thinks.id(id).image) {
      const image = user.thinks.id(id).image;
      await cloudinary.uploader.destroy(image.public_id);
    }

    user.thinks.pull(thinkTodelete);
    await user.save();

    res.status(200).json({ message: "think successfully deleted" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
