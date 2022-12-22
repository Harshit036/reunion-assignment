const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const postSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  creator: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
  likes: [{ type: mongoose.Types.ObjectId, required: true, ref: "User" }],
  comments: [{ type: mongoose.Types.ObjectId, required: true, ref: "Comment" }],
  time: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
