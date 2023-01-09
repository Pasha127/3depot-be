import { model, Schema } from "mongoose";
import MessageModel from "./MessageModel.js";

const chatDBSchema = new Schema(
  {
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message" }],
  },
  {
    timestamps: true,
  }
);


chatDBSchema.pre("remove", async function (next) {
  try{
    await MessageModel.deleteMany({ _id: { $in: this.messages } })
    next();
  }catch(err){
    next(err)
  }
});

chatDBSchema.methods.toJSON = function () {
  const chat = this.toObject();
  
  delete chat.createdAt;
  delete chat.updatedAt;
  delete chat.__v;
  return chat;
};


export default model("Chat", chatDBSchema);
