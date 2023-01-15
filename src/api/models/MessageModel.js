import { model, Schema } from "mongoose";

const messageDBSchema = new Schema(
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

messageDBSchema.methods.toJSON = function () {
  const message = this.toObject();
  
  delete message.updatedAt;
  delete message.__v;
  return message;
};


export default model("Message", messageDBSchema);
