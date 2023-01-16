import { model, Schema } from "mongoose";

const assetDBSchema = new Schema(
  {
    name: { type: String},
    type: { type: String},
    poster: { type: Schema.Types.ObjectId, ref: "User" },
    pictures:[{type: String}],
    model:{type:String},
    stats: {
      sales: { type: Number},
      swaps: { type: Number},
      views: { type: Number}
    },
    properties: {
      faces: { type: Number},
      verts: { type: Number},
      filetype: { type: String},
      files: [{ type: Schema.Types.ObjectId, ref: "File" }]
    },
    price: {type: Number},
    creditValue: {type: Number}
  },
  {
    timestamps: true,
  }
);

assetDBSchema.methods.toJSON = function () {
  const asset = this.toObject();
  
  delete asset.updatedAt;
  delete asset.__v;
  return asset;
};


export default model("Asset", assetDBSchema);
