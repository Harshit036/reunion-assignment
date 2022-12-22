const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

//Completed it
const getPostById = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }
  const postId = req.params.pid;
  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find a place.",
      500
    );
    return next(error);
  }

  // console.log(postId);
  if (!post) {
    const error = new HttpError(
      "Could not find place for the provided id.",
      404
    );
    return next(error);
  }

  const finalresponse = {
    id: post.id,
    likes: post.likes.length,
    comments: post.comments.length,
  };
  res.json(finalresponse);
};

//Completed it
const getPostsByUserId = async (req, res, next) => {
  const userId = req.userData.userId;

  // let posts;
  let userWithPosts;
  try {
    userWithPosts = await User.findById(userId).populate("posts");
  } catch (err) {
    const error = new HttpError(
      "Fetching posts failed, please try again later.",
      500
    );
    return next(error);
  }

  // if (!posts || posts.length === 0) {
  if (!userWithPosts || userWithPosts.posts.length === 0) {
    return next(
      new HttpError("Could not find posts for the provided user id.", 404)
    );
  }

  // console.log(userWithPosts);
  // userWithPosts = userWithPosts.posts.populate("comments");
  const finalresponse = userWithPosts.posts.map((post) => {
    // const userpost = post.toObject({ getters: true });
    // console.log("post iz", post);
    // let postcreated;
    const getPostById = async (id) => {
      try {
        const postcreated = await Post.findById(id).populate("comments");
        return postcreated;
      } catch (err) {
        const error = new HttpError(
          "Fetching posts failed, please try again later.",
          500
        );
        return next(error);
      }
    };
    const postcreated = getPostById(post.id).then((x) => {
      return x;
    });
    console.log("postcreated is", postcreated);
    // const postcomments = postcreated.comments.map((comment) => {
    //   //   // const tempComment = Comment.findById(comment);
    //   //   const tempComment = comment.toObject({ getters: true });
    //   // console.log(comment);
    //   return comment.text;
    // });
    const ans = {
      id: post.id,
      title: post.title,
      desc: post.description,
      created_at: post.date,
      // comments: postcomments,
      likes: !post.likes ? 0 : post.likes.length,
    };
    // console.log(ans);
    return ans;
  });

  // console.log(finalresponse);

  finalresponse.sort((obj1, obj2) => {
    const date1 = obj1.created_at;
    const date2 = obj2.created_at;
    return date1 - date2;
  });
  res.json(finalresponse);
};

//Completed it
const createPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;

  const createdPost = new Post({
    title,
    description,
    creator: req.userData.userId,
  });

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Creating posts failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  console.log(createdPost);

  try {
    createdPost.save();
    user.posts.push(createdPost);
    user.save();
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // await createdPost.save({ session: sess });
    // user.posts.push(createdPost);
    // await user.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "session Creating post failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    id: createdPost.id,
    title: createdPost.title,
    description: createdPost.description,
    time: createdPost.date,
  });
};

const updatePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { title, description } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update post.",
      500
    );
    return next(error);
  }

  if (post.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this post.", 401);
    return next(error);
  }

  post.title = title;
  post.description = description;

  try {
    await post.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update post.",
      500
    );
    return next(error);
  }

  res.status(200).json({ post: post.toObject({ getters: true }) });
};

//Completed it
const deletePost = async (req, res, next) => {
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete post.",
      500
    );
    return next(error);
  }

  if (!post) {
    const error = new HttpError("Could not find post for this id.", 404);
    return next(error);
  }
  console.log(post);
  if (post.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this post.",
      401
    );
    return next(error);
  }

  try {
    post.remove();
    post.creator.posts.pull(post);
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // await post.remove({ session: sess });
    // post.creator.posts.pull(post);
    // await post.creator.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete post.",
      500
    );
    return next(error);
  }

  res.status(200).json({ message: "Deleted post." });
};

//Completed it
const likePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Liking posts failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  // const { title, description } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update post.",
      500
    );
    return next(error);
  }

  // if (post.creator.toString() !== req.userData.userId) {
  //   const error = new HttpError("You are not allowed to edit this post.", 401);
  //   return next(error);
  // }

  if (post.likes.some((user) => user.toString() === req.userData.userId)) {
    const error = new HttpError("Already Liked.", 403);
    return next(error);
  }
  // post.title = title;
  // post.description = description;
  post.likes.push(user);
  post.save();
  res.status(200).json({ post: post.toObject({ getters: true }) });
};

//Completed it
const unlikePost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError(
      "Unliking posts failed, please try again.",
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  // const { title, description } = req.body;
  const postId = req.params.pid;

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not unlike post.",
      500
    );
    return next(error);
  }

  if (!post.likes.some((user) => user.toString() === req.userData.userId)) {
    const error = new HttpError("Already Unliked", 403);
    return next(error);
  }

  try {
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    post.likes.remove(req.userData.userId);
    post.save();
    // await post.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Unliking post failed, please try again.", 500);
    return next(error);
  }
  res.status(200).json({ post: post.toObject({ getters: true }) });
};

exports.getPostById = getPostById;
exports.getPostsByUserId = getPostsByUserId;
exports.createPost = createPost;
exports.updatePost = updatePost;
exports.deletePost = deletePost;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
