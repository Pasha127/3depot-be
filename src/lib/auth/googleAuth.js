import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import userModel from "../../api/models/userModel.js";
import { createTokens } from "../tools/tokenTools.js";

const googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: `${process.env.FE_DEV_URL}/user/googleRedirect`,
  },
  async (_, __, profile, passportNext) => {
    //(accessToken, refreshToken, profile, cb)

    try {
      const { email, sub, picture, given_name, family_name } = profile._json;
     /*  console.log("google data", email, sub, picture); */
      const user = await userModel.findOne({ email });
      if (user) {
        const tokens = await createTokens(user);
        passportNext(null, tokens);
      } else {
        const newUser = new userModel({
          email: email.toLowerCase(),
          username: email.split("@")[0],
          firstName:given_name,
          lastName:family_name,
          avatar: picture,
          credits: 10
        });
        const createdUser = await newUser.save();
        const { accessToken } = await createTokens(createdUser);
        passportNext(null, { accessToken });
      }
    } catch (error) {
      console.log(error);
      passportNext(error);
    }
  }
);

export default googleStrategy;
