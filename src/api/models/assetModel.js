import { model, Schema } from "mongoose";
import fileModel from "./fileModel.js";
import commentModel from "./commentModel.js";
import { v2 as cloudinary } from "cloudinary";

const assetDBSchema = new Schema(
  {
    name: { type: String},
    type: { type: String},
    poster: { type: Schema.Types.ObjectId, ref: "User" },
    pictures:[{type: String}],
    file: { type: Schema.Types.ObjectId, ref: "File" },
    stats: {
      sales: { type: Number},
      swaps: { type: Number},
      views: { type: Number}
    },
    properties: {
      faces: { type: Number},
      verts: { type: Number},
    },
    price: {type: Number},
    creditValue: {type: Number},
    description: {type: String},
    keywords: {type: String},
    comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }]
  },
  {
    timestamps: true,
  }
);

assetDBSchema.pre("remove", async function (next) {
  try{
    const commentArray = await commentModel.find({ _id: { $in: this.comments } })
    commentArray.forEach(comment =>{
      if(comment.content.media) {
        const mediaUrl= comment.content.media.split("/")
        cloudinary.uploader.destroy(`3DepotComments/${mediaUrl[mediaUrl.length -1].split(".")[0]}`, function(error,result) {
          console.log(result, `${mediaUrl[mediaUrl.length -1].split(".")[0]}`, error) }) 
      }
    })    
      await commentModel.deleteMany({ _id: { $in: this.comments } })
      const files = await fileModel.find({ _id: { $in: this.file } })
      files.forEach(file =>{
        if(file.link) {
          const fileUrl= file.link.split("/")
          cloudinary.uploader.destroy(`3DepotProducts/${fileUrl[fileUrl.length -1].split(".")[0]}`, function(error,result) {
            console.log(result, `${fileUrl[fileUrl.length -1].split(".")[0]}`, error) }) 
        }
      })
      await fileModel.deleteMany({ _id: { $in: this.file } })
    next();
  }catch(err){
    next(err)
  }
});



assetDBSchema.methods.toJSON = function () {
  const asset = this.toObject();
  
  delete asset.updatedAt;
  delete asset.__v;
  return asset;
};


export default model("Asset", assetDBSchema);
