const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  text: {
    type: String,
    trim: true,
    required: true,
  },
  commentedOn: { type: mongoose.Types.ObjectId, required: true, ref: "Post" },
});

module.exports = mongoose.model("Comment", commentSchema);
