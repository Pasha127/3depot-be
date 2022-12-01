import { model, Schema } from "mongoose";

const chatDBSchema = new Schema(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  {
    timestamps: true,
  }
);

chatDBSchema.methods.toJSON = function () {
  const chat = this.toObject();
  
  delete chat.createdAt;
  delete chat.updatedAt;
  delete chat.__v;
  return chat;
};


export default model("Chat", chatDBSchema);
