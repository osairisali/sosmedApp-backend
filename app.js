const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { graphqlHTTP } = require("express-graphql");

const auth = require("./middlewares/auth");

// import settingan graphql
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");

const app = express();

// hanya digunakan untuk parse form header bentuk application/x-www-form-urlencoded ke body
// app.use(bodyParser.urlencoded({extended: false}))

// penanganan CORS error
app.use((req, res, next) => {
  // setHeader tidak mengirim header, melainkan hanya setting server untuk merubah header yg diterima dr client
  res.setHeader("Access-Control-Allow-Origin", "*"); // allow client dr manapun, bisa google.com, api.com, dll
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // trik untuk menghindari decline dari graphql akibat client mengirimkan options sebelum kirim data lainnya
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  // seandainya OPTIONS tidak dibuat logic seperti di atas, maka OPTIONS ini akan jalan ke step berikutnya,
  // yaitu graphql, sementara graphql selalu menolak (decline) method OPTIONS
  next();
});

app.use(auth);

// setting graphql route ke '/graphql' dan arg kedua adalah fun graphqlHttp dengan object settingannya
app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    // grahpiql untuk interface interaktif api graphql
    graphiql: true,
    // function untuk format error pada graphql
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const data = err.originalError.data;
      const code = err.originalError.code || 500;
      const message = err.message || "an error has occured";
      return {
        message: message,
        status: code,
        data: data,
      };
    },
  })
);

// multer file storage settings
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + "-" + file.originalname);
  },
});

// funtion untuk file filter multer
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

// parse data dari Content-Type: application/json pada header
// jadi json untuk dikirim ke server
app.use(bodyParser.json());

// multer server validation
app.use(
  multer({
    storage: fileStorage,
    fileFilter: fileFilter,
  }).single("image")
);

// end point REST untuk iamges
app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    throw new Error("not authenticated");
  }

  // jika image tdk diupload
  if (!req.file) {
    return res.status(200).json({
      message: "no image provided",
    });
  }

  // jika image diupload, maka hapus image yg sdh ada di file system jika ada
  if (req.body.oldPath) {
    clearImage(req.body.oldPath);
  }

  return res.status(201).json({
    message: "file stored",
    filePath: req.file.path,
  });
});

app.use("/images", express.static(path.join(__dirname, "images")));

app.use((error, req, res, next) => {
  console.log(`error ditangkap pada app.js -> ${error}`);

  // message pada error otomatis dibuatkan
  const message = error.message;

  // jk error diterima dr selain validation results, buat status code 500
  const status = error.statusCode || 500;
  const data = error.data;

  res.status(status).json({
    message: message,
    data: data,
  });
});

mongoose
  .connect(
    `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-ddce4.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`
  , {useNewUrlParser: true, useUnifiedTopology: true})
  .then((connected) => {
    app.listen(`${process.env.APP_PORT}`);
    console.log('npm start success: ', connected)
  })
  .catch((err) => console.log(err));

// utility untuk menghapus image di file system
const clearImage = (filePath) => {
  fileP = path.join(__dirname, "..", filePath);
  fs.unlink(fileP, (err) => console.log(err));
};
