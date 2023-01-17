import { model, Schema } from "mongoose";

const requestDBSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    comments: {type: Schema.Types.ObjectId, ref: "Comment"},
    content: {
      text: { type: String, default: " "},
      media: { type: String, default: "" }
    }
  },
  {
    timestamps: true,
  }
);

requestDBSchema.methods.toJSON = function () {
  const comment = this.toObject();
  
  delete comment.updatedAt;
  delete comment.__v;
  return comment;
};


export default model("Comment", requestDBSchema);
