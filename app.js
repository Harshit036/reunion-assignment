const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const HttpError = require("./models/http-error");

const { check } = require("express-validator");

const postsControllers = require("./controllers/posts-controllers");
const usersControllers = require("./controllers/users-controllers");
const commentsControllers = require("./controllers/comments-controllers");
const checkAuth = require("./middleware/check-auth");

const app = express();

app.use(bodyParser.json());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept, Authorization"
//   );
//   res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

//   next();
// });

//User routes
app.post("/api/signup", usersControllers.signup); // Not Needed
app.post("/api/authenticate", usersControllers.login);

//Posts routes
app.get("/api/posts/:pid", postsControllers.getPostById);

// Protected routes
app.use(checkAuth);
app.get("/api/user/", usersControllers.getUserById);
app.post("/api/follow/:uid", usersControllers.follow);
app.post("/api/unfollow/:uid", usersControllers.unfollow);
app.post("/api/posts/", postsControllers.createPost);
app.delete("/api/posts/:pid", postsControllers.deletePost);
app.post("/api/like/:pid", postsControllers.likePost);
app.post("/api/unlike/:pid", postsControllers.unlikePost);
app.post("/api/comment/:pid", commentsControllers.comment);
app.get("/api/all_posts", postsControllers.getPostsByUserId);

// Any error happened while requesting any route
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route.", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

const passwordDB = "Harshit01%40";

mongoose.set("strictQuery", false);
mongoose
  .connect(
    `mongodb+srv://HarshitVaish:${passwordDB}@reunion.pqpojqy.mongodb.net/reunion?retryWrites=true&w=majority`
  )
  .then(() => {
    const port = process.env.PORT || 5000;
    app.listen(port, () => {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
