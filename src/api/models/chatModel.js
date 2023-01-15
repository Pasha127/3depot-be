import { model, Schema } from "mongoose";
import MessageModel from "./MessageModel.js";
import { v2 as cloudinary } from "cloudinary";

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
    const msgArray = await MessageModel.find({ _id: { $in: this.messages } })
    msgArray.forEach(message =>{
      if(message.content.media) {
        const mediaUrl= message.content.media.split("/")
        cloudinary.uploader.destroy(`3DepotMessages/${mediaUrl[mediaUrl.length -1].split(".")[0]}`, function(error,result) {
          console.log(result, `${mediaUrl[mediaUrl.length -1].split(".")[0]}`, error) }) 
      }
    })    
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
