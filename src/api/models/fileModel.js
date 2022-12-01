import { model, Schema } from "mongoose";

const fileDBSchema = new Schema(
  {
    name: { type: String},
    type: { type: String},
    link: { type: String}
  },
  {
    timestamps: true,
  }
);

fileDBSchema.methods.toJSON = function () {
  const file = this.toObject();
  
  delete file.updatedAt;
  delete file.__v;
  return file;
};


export default model("File", fileDBSchema);
