const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");

const commentPost = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const postId = req.params.pid;
  const { text } = req.body;

  const createdComment = new Comment({
    text,
    commentedOn: postId,
  });
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Commenting failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  let post;
  try {
    post = await Post.findById(postId);
  } catch (err) {
    const error = new HttpError("Commenting failed, please try again.", 500);
    return next(error);
  }

  if (!post) {
    const error = new HttpError("Could not find post for provided id.", 404);
    return next(error);
  }

  try {
    createdComment.save();
    post.comments.push(createdComment);
    post.save();
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // await createdComment.save({ session: sess });
    // post.comments.push(createdComment);
    // await post.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating post failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ id: createdComment.id });
};

exports.comment = commentPost;
