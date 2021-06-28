// clean semua image yang tidak ada di db pada fs

const mongoose = require("mongoose");
const Post = require("../models/post");
const fs = require("fs");

const cleanFileImageSync = async () => {
  // SETTING CONSTANTS DB
  const MONGODB_URI =
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ddce4.mongodb.net/${process.env.MONGO_DEFAULT_DATABSE}`;

  try {
    const connection = await mongoose.connect(MONGODB_URI);

    if (!connection) {
      throw new Error("connection to DB failed");
    }

    console.log(`clean-image connected to db -> ${connection}`);

    const posts = await Post.find();
    console.log(`posts di db -> ${posts}`);

    // filter gambar yang tidak ada di db pada fs
    let imagesDB = [];

    // gambar yg ada di fs
    const imagesFS = fs.readdirSync("images");
    console.log(`images in fs -> ${imagesFS}`);

    // gambar yg ada di db
    posts.forEach((post) => {
      imagesDB.push(post.imageUrl);
    });

    // pembersihan gambar yg ada di db dari string 'images/'
    const trimImgDB = imagesDB.map((el) => {
      return el.slice(7);
    });
    console.log(`imagesDB -> ${imagesDB}`);

    // filtering gambar yg tdk ada di db return true
    const filteredImage = imagesFS.filter((image) => {
      return trimImgDB.indexOf(image) === -1;
    });
    console.log(`gambar yang akan dihapus -> n\\ ${filteredImage} n\\`);

    // penghapusan
    filteredImage.forEach((el) => {
      fs.unlinkSync(`./images/${el}`);
      console.log("gambar berhasil difilter!");
    });
  } catch (err) {
    console.log(err);
  }

  mongoose.connection.close();
};

// cleanFileImageSync();

// fungsi Async
const cleanFileImageAsync = async () => {
  const MONGODB_URI =
    "mongodb+srv://osairisali:aleXander2323@cluster0-ddce4.mongodb.net/messages";

  try {
    const connection = await mongoose.connect(MONGODB_URI);

    if (!connection) {
      throw new Error("connection to db failed");
    }

    const posts = await Post.find();

    if (!posts) {
      throw new Error("no post(s) found in db");
    }

    // const imageFS = await fs.promises.readdir("images");
    
    // cara lain dengan promisify fungsi fs.readdir
    const asyncReaddir = (dir) => {
      return new Promise((resolve, reject) => {
        fs.readdir(dir, (err, files) => {
          if (err) reject("error reading files in directory");
          if (files) resolve(files);
        });
      })
    };
    const imageFS = await asyncReaddir("images");

    // variabel untuk data image di db
    let imageDB = [];
    posts.forEach((el) => {
      imageDB.push(el.imageUrl);
    });

    // pembersihan gambar yg ada di db dari string 'images/'
    const trimImgDB = imageDB.map((el) => {
      return el.slice(7);
    });
    console.log(`imageDB -> ${trimImgDB}`);

    // ambil imageFS yg tidak ada di DB
    console.log(imageFS);
    let filteredImageFS = [];

    // nggak bisa looping promises pake map, forEach, filter gini
    // looping pake map bisa saja asal array dasarnya bukan promise, dan callback-nya async
    for (let image of imageFS) {
      if (trimImgDB.indexOf(image) === -1) filteredImageFS.push(image);
    }
    console.log(`filteredImageFS -> ${filteredImageFS}`);

    // penghapusan filteredImageFS dari file sytem
    for (let image of filteredImageFS) {
      await fs.promises.unlink(`./images/${image}`, (err) => {
        if (err) {
          throw new Error("error deleting file in file system");
        }
        console.log(`deleting file ${image}`);
      });
    }

    await mongoose.connection.close();
  } catch (err) {
    console.log(err);
  }
};

cleanFileImageAsync();

// const dtFS = [
//     '2020-08-31T00:56:36.200Z-1036636.png', '2020-08-31T00:57:11.038Z-darling-int-the-franxx.png',
//     '2020-08-31T00:57:23.218Z-darling-int-the-franxx.png', '2020-08-31T00:58:11.254Z-wp4366633-sewayaki-kitsune-no-senko-san-wallpapers.png',
//     '2020-08-31T01:02:58.903Z-nasa-V4ZksNimxLk-unsplash (copy).jpg',
//     '2020-08-31T01:04:25.335Z-nasa-V4ZksNimxLk-unsplash.jpg', '2020-08-31T01:06:52.882Z-nasa-V4ZksNimxLk-unsplash.jpg',
//     '2020-08-31T01:07:39.556Z-nasa-V4ZksNimxLk-unsplash (copy).jpg', '2020-08-31T01:08:25.444Z-nasa-V4ZksNimxLk-unsplash.jpg',
//     '2020-08-31T01:08:55.717Z-darling-int-the-franxx (copy).png', '2020-08-31T01:11:21.980Z-darling-int-the-franxx (copy).png',
//     '2020-08-31T01:14:46.952Z-nasa-V4ZksNimxLk-unsplash.jpg'
// ];

// const dtDB = [
//     'images/2020-08-31T00:56:36.200Z-1036636.png',
//     'images/2020-08-31T00:57:23.218Z-darling-int-the-franxx.png',
//     'images/2020-08-31T00:58:11.254Z-wp4366633-sewayaki-kitsune-no-senko-san-wallpapers.png',
//     'images/2020-08-31T01:14:46.952Z-nasa-V4ZksNimxLk-unsplash.jpg'
// ];

// dtDB harus di-trim terlebih dahulu dari images/
// const trimDtDB = [];

// dtDB.forEach(el => {
//     trimDtDB.push(el.slice(7));
// });

// console.log(trimDtDB);

// // filter gambar yang tidak ada di db pada fs
// const filteredImage = dtFS.filter(image => {
//     return trimDtDB.indexOf(image) === -1;
// })

// console.log(filteredImage);

// // hapus gambar yg difilter
// dtDB.forEach(el => {
//     fs.unlink(el, err => {
//         console.log(err);
//     });
// });
