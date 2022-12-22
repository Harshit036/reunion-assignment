const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const jwt = require("jsonwebtoken");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUserById = async (req, res, next) => {
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
    const error = new HttpError("Following failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }
  res.json({
    name: user.name,
    followers: user.followers.length,
    following: user.following.length,
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User exists already, please login instead.",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      "Could not create user, please try again.",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.jwtTokenSecret,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, please try again later.",
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      "Could not log you in, please check your credentials and try again.",
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.jwtTokenSecret,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ token: token });
};

const follow = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  // console.log(req.params.uid);
  let user;
  try {
    user = await User.findById(req.userData.userId);
  } catch (err) {
    const error = new HttpError("Following failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  const userToFollowID = req.params.uid;

  let userToFollow;
  try {
    userToFollow = await User.findById(userToFollowID);
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  if (user.following.some((user) => user.toString() === userToFollowID)) {
    const error = new HttpError("Already Following.", 403);
    return next(error);
  }

  // console.log(user);

  try {
    user.following.push(userToFollow);
    userToFollow.followers.push(user);
    user.save();
    userToFollow.save();
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // user.following.push(userToFollow);
    // userToFollow.followers.push(user);
    // await user.save({ session: sess });
    // await userToFollow.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Following user failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ post: user });
};

const unfollow = async (req, res, next) => {
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
    const error = new HttpError("Following failed, please try again.", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("Could not find user for provided id.", 404);
    return next(error);
  }

  const userToUnFollowID = req.params.uid;

  let userToUnFollow;
  try {
    userToUnFollow = await User.findById(userToUnFollowID);
  } catch (err) {
    const error = new HttpError("Something went wrong.", 500);
    return next(error);
  }

  if (!user.following.some((user) => user.toString() === userToUnFollowID)) {
    const error = new HttpError("No User Found with the given ID.", 403);
    return next(error);
  }

  try {
    user.following.remove(userToUnFollow);
    userToUnFollow.followers.remove(user);
    user.save();
    userToUnFollow.save();
    // const sess = await mongoose.startSession();
    // sess.startTransaction();
    // user.following.remove(userToUnFollow);
    // userToUnFollow.followers.remove(user);
    // await user.save({ session: sess });
    // await userToUnFollow.save({ session: sess });
    // await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Unfollowing user failed, please try again.",
      500
    );
    return next(error);
  }

  res.status(201).json({ user });
};

exports.getUserById = getUserById;
exports.signup = signup;
exports.login = login;
exports.follow = follow;
exports.unfollow = unfollow;
