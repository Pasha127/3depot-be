import { Schema, model } from "mongoose";
import bcrypt from "bcrypt";

const userDBSchema = new Schema(
  {
    password: { type: String },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true},
    firstName: { type: String, default: "Jo"},
    lastName: { type: String, default: "Doe"},
    purchases:  [{ type: Schema.Types.ObjectId, ref: "Asset" }],
    uploads:  [{ type: Schema.Types.ObjectId, ref: "Asset" }],
    cart:  [{ type: Schema.Types.ObjectId, ref: "Asset" }],
    avatar: { type: String, default: "https://cdn.pixabay.com/photo/2016/08/08/09/17/avatar-1577909_960_720.png" },
    credits: { type: Number },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

userDBSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hash = await bcrypt.hash(this.password, 11);
    this.password = hash;
  }
  next();
});

userDBSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.createdAt;
  delete user.updatedAt;
  delete user.__v;
  delete user.refreshToken;
  return user;
};

userDBSchema.static("checkCredentials", async function (email, plainPass) {
  const user = await this.findOne({ email });
  if (user) {
    const isMatch = await bcrypt.compare(plainPass, user.password);
    if (isMatch) {
      return user;
    } else {
      return null;
    }
  } else {
    return null;
  }
});

userDBSchema.static("cleanModel", () => {});

export default model("User", userDBSchema);
