/* 
Modern ES6 Approach to define functions in objects
You no longer need to specify the function keyword when defining functions inside objects:

var myObj = {
  myMethod(params) {
    // ...do something here
  },
  myOtherMethod(params) {
    // ...do something here
  },
  nestedObj: {
    myNestedMethod(params) {
      // ...do something here
    }
  }
};

info => https://stackoverflow.com/questions/10378341/functions-inside-objects
*/

// module.exports = {
//     hello() {
//         return {
//             text: 'Hello world!',
//             views: 13554
//         }
//     }
// };

const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const path = require("path");
const fs = require("fs");

const User = require("../models/user");
const Post = require("../models/post");

// utility untuk menghapus image di file system
const clearImage = (filePath) => {
  fileP = path.join(__dirname, "..", filePath);
  fs.unlink(fileP, (err) => console.log(err));
};

module.exports = {
  // perhtaikan userInput adalah object dari RootMutation createUser arg di schema.js
  createUser: async function ({ userInput }, req) {
    // validation
    const errors = [];

    if (!validator.isEmail(userInput.email)) {
      errors.push({
        message: "email is invalid",
      });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, {
        min: 5,
      })
    ) {
      errors.push({
        message: "invalid password",
      });
    }
    if (errors.length > 0) {
      const error = new Error("invalid input");
      error.data = errors;
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({
      email: userInput.email,
    });

    if (existingUser) {
      const error = new Error("User already exist");
      throw error;
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);

    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw,
    });

    const createdUser = await user.save();

    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({
      email: email,
    });

    if (!user) {
      const error = new Error("user not found");
      error.code = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);

    if (!isEqual) {
      const error = new Error("password is incorrect!");
      error.code = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        email: user.email,
        userId: user._id.toString(),
      },
      "superdupersecretkey",
      {
        expiresIn: "1h",
      }
    );

    return {
      token: token,
      userId: user._id.toString(),
    };
  },
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }

    const errors = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, {
        min: 5,
      })
    ) {
      errors.push({
        message: "title is not valid, minimum 5 characters",
      });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, {
        min: 5,
      })
    ) {
      errors.push({
        message: "content is not valid, minimum 5 characters",
      });
    }

    if (errors.length > 0) {
      const error = new Error("input validation is invalid");
      error.data = errors;
      error.code = 422;

      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("user not found");
      error.code = 401;

      throw error;
    }

    const post = new Post({
      title: postInput.title,
      imageUrl: postInput.imageUrl,
      content: postInput.content,
      creator: user,
    });

    // save post to Post db
    const createdPost = await post.save();

    // save post to User db
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async function ({ page }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }

    const PERPAGE = 2;
    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .skip((page - 1) * PERPAGE)
      .limit(PERPAGE)
      .sort({
        createdAt: -1,
      })
      .populate("creator");

    return {
      posts: posts.map((el) => {
        return {
          ...el._doc,
          _id: el._id.toString(),
          createdAt: el.createdAt.toISOString(),
          updatedAt: el.updatedAt.toISOString(),
        };
      }),
      totalPosts: totalPosts,
    };
  },
  post: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      throw error;
    }

    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const error = new Error("post not found!");
      error.code = 404;
      throw error;
    }

    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    };
  },
  updatePost: async function ({ id, postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      console.log(error);
      throw error;
    }

    const post = await Post.findById(id).populate("creator");

    // cek apakah pengedit sama dgn creator post terkait
    if (post.creator._id.toString() !== req.userId.toString()) {
      const error = new Error("user not authorized to edit");
      error.code = 403;
      console.log(error);
      throw error;
    }

    if (!post) {
      const error = new Error("post not found!");
      error.code = 404;
      console.log(error);
      throw error;
    }

    // validation input form
    const errors = [];

    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, {
        min: 5,
      })
    ) {
      errors.push({
        message: "title is not valid, minimum 5 characters",
      });
    }

    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, {
        min: 5,
      })
    ) {
      errors.push({
        message: "content is not valid, minimum 5 characters",
      });
    }

    if (errors.length > 0) {
      const error = new Error("input validation is invalid");
      error.data = errors;
      error.code = 422;
      console.log(error.data);
      throw error;
    }

    post.title = postInput.title;
    if (postInput.imageUrl !== "undefined") {
      post.imageUrl = postInput.imageUrl;
    }
    post.content = postInput.content;

    const updatedPost = await post.save();

    console.log(updatedPost);

    return {
      ...updatedPost._doc,
      _id: updatedPost._id.toString(),
      createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString(),
    };
  },
  deletePost: async function ({ id }, req) {
    if (!req.isAuth) {
      const error = new Error("not authenticated");
      error.code = 401;
      console.log(error);
      throw error;
    }

    const post = await Post.findById(id);

    // cek apakah post tidak tersedia di db
    if (!post) {
      const error = new Error("no post found to delete");
      error.code = 404;
      console.log(error);
      throw error;
    }

    // cek apakah yang menghapus post adalah creatornya
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("not authorized to delete lthis post");
      error.code = 403;
      console.log(error);
      throw error;
    }

    // hapus image yang ada di file system
    clearImage(post.imageUrl);

    // hapus post di Post db
    await Post.findByIdAndRemove(id);

    // hapus post yg ada di User db
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("user not found");
      error.code = 404;
      throw error;
    }

    user.posts.pull(id);
    await user.save();

    // return Boolean
    return true;
  },
  updateStatus: async function ({ status }, req) {
    if (!req.isAuth) {
      const error = new Error("not autenthicated");
      error.code = 401;
      throw error;
    }

    // if status empty

    // buat status
    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("user not found");
      error.code = 404;
      throw error;
    }

    user.status = status;
    await user.save();

    return {
      ...user._doc,
      _id: user._id.toString(),
    };
  },
  user: async function (args, req) {
    if (!req.isAuth) {
      const error = new Error("not autenthicated");
      error.code = 401;
      throw error;
    }

    const user = await User.findById(req.userId);

    if (!user) {
      const error = new Error("user not found");
      error.code = 404;
      throw error;
    }

    return {
      ...user._doc,
      _id: user._id.toString(),
    };
  },
};
