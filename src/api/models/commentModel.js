import { model, Schema } from "mongoose";

const commentDBSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User" },
    content: {
      text: { type: String, default: " "},
      media: { type: String, default: "" }
    },
  },
  {
    timestamps: true,
  }
);

commentDBSchema.methods.toJSON = function () {
  const comment = this.toObject();
  
  delete comment.updatedAt;
  delete comment.__v;
  return comment;
};


export default model("Comment", commentDBSchema);
