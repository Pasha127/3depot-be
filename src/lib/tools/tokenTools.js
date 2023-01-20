import createHttpError from "http-errors"
import jwt from "jsonwebtoken"
import userModel from "../../api/models/userModel.js";


export const createTokens = async user => {
  const accessToken = await createAccessToken({ _id: user._id, username: user.username, role: user.role });
  const refreshToken = await createRefreshToken({ _id: user._id });
 
  user.refreshToken = refreshToken;
  await user.save();

  return { accessToken, refreshToken }
}

const createAccessToken = payload =>
  new Promise(function (res, rej) {
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" }, (err, token) => {
      if (err) rej(err);
      else res(token);
    })
  }
  )

export const verifyAccessToken = accessToken =>
  new Promise((res, rej) =>
    jwt.verify(accessToken, process.env.JWT_SECRET, (err, originalPayload) => {
      if (err) res({result: "fail"});
      else res(originalPayload);
    })
  )

const createRefreshToken = payload =>
  new Promise((res, rej) => {
    jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: "5d" }, (err, token) => {
      if (err) rej(err);
      else res(token);
    })
  }
  )

const verifyRefreshToken = refreshToken =>
  new Promise((res, rej) =>
    jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, originalPayload) => {
      if (err) rej(err);
      else res(originalPayload);
    })
  )

export const refreshTokens = async currentRefreshToken => {
  if(!currentRefreshToken){ throw new createHttpError(401, "Refresh token invalid!")}
  try {    
    const refreshTokenPayload = await verifyRefreshToken(currentRefreshToken);
    if(!refreshTokenPayload)throw new createHttpError(401, "Refresh token invalid!");
    const user = await userModel.findById(refreshTokenPayload._id);
    if (!user) throw new createHttpError(404, `User with id ${refreshTokenPayload._id} not found!`);
    if (user.refreshToken && user.refreshToken === currentRefreshToken) {
      const { accessToken, refreshToken } = await createTokens(user)
      return { accessToken, refreshToken, user:user.toObject() }
    } else {
      throw new createHttpError(401, "Refresh token invalid!")
    }
  } catch (error) {
    throw new createHttpError(401, "Refresh token invalid! 2")
  }
}