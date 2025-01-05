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
const e = require("express");

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
      email: email,
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
      email: email,
    });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: error.message });
  }
});

router.put("/update", isAuthenticated, fileUpload(), async (req, res) => {
  try {
    const { password, username, email } = req.body;
    const user = await User.findById(req.body.user);

    if (req.files) {
      const convertedImage = convertToBase64(req.files.image);
      const image = await cloudinary.uploader.upload(convertedImage, {
        folder: `Rememeber/user/${user._id}`,
      });
      user.avatar = {
        secure_url: image.secure_url,
        public_id: image.public_id,
      };
    }
    if (password) {
      const newhash = SHA256(password + user.salt).toString(encBase64);
      user.hash = newhash;
    }
    if (username) {
      user.username = username;
    }
    if (email) {
      const isEmailExist = await User.findOne({ email: email });
      if (isEmailExist) {
        return res.status(401).json({ message: "email already used" });
      } else {
        user.email = email;
      }
    }
    await user.save();
    res.status(201).json({
      _id: user._id,
      token: user.token,
      username: user.username,
      avatar: user.avatar,
      email: user.email,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

router.delete("/deleteUser", isAuthenticated, async (req, res) => {
  try {
    const userToDelete = await User.findByIdAndDelete(req.body.user);
    res.status(201).json({ message: "profile deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
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
    const { search, date, page } = req.query;

    const thoughts = await User.findById(req.body.user).select("thinks");
    const arrthougths = thoughts.thinks;
    const thougthsCounter = arrthougths.length;
    console.log(thougthsCounter);

    const ideas = [];
    const afterDate = [];
    const afterPage = [];
    for (let i = 0; i < thougthsCounter; i++) {
      if (search) {
        const newSearch = search.toUpperCase();
        const arrSearch = newSearch.split(" ");
        for (let j = 0; j < arrSearch.length; j++) {
          const titleUp = arrthougths[i].title.toUpperCase();
          if (arrthougths[i].think) {
            const thinkUp = arrthougths[i].think.toUpperCase();
            if (thinkUp.includes(arrSearch[j])) {
              ideas.push(arrthougths[i]);
            }
          }
          if (titleUp.includes(arrSearch[j])) {
            ideas.push(arrthougths[i]);
          }
        }
      } else {
        ideas.push(arrthougths[i]);
      }
    }
    for (let k = 0; k < ideas.length; k++) {
      if (date) {
        const dateToFind = Date(date);

        const dateToString = ideas[k].date.toString();
        const tabDate = dateToString.split(" ").slice(0, 4).join(" ");

        const tabDate2 = date.split(" ").slice(0, 4).join(" ");

        if (tabDate === tabDate2) {
          afterDate.push(ideas[k]);
        }
      } else {
        afterDate.push(ideas[k]);
      }
    }
    const limit = 20;

    const newIdeas = [...new Set(afterDate)];
    if (page) {
      valeurMin = (page - 1) * limit;
      valeurMax = valeurMin + limit;
    } else {
      valeurMin = 0;
      valeurMax = limit;
    }

    for (let l = 0; l < newIdeas.length; l++) {
      if (l >= valeurMin && l < valeurMax) {
        afterPage.push(newIdeas[l]);
      }
    }
    res.status(200).json({ counter: newIdeas.length, thinks: afterPage });
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
