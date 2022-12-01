import { model, Schema } from "mongoose";

const transactionDBSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    assets: [{ type: Schema.Types.ObjectId, ref: "Asset" }],
    moneyCharged: {type: Number},
    creditsEarned: {type: Number}
  },
  {
    timestamps: true,
  }
);

transactionDBSchema.methods.toJSON = function () {
  const transaction = this.toObject();
  
  delete transaction.updatedAt;
  delete transaction.__v;
  return transaction;
};


export default model("Transaction", transactionDBSchema);
