import createHttpError from "http-errors"
import assetModel from "../../api/models/assetModel.js";
import { refreshTokens, verifyAccessToken } from "../tools/tokenTools.js";

export const JWTAuth = async (req, res, next) => {
    if (!req.cookies.accessToken) {      
      next(createHttpError(401, "No access token in cookies."))
  } else {
    try {
      const currentAccessToken = req.cookies.accessToken
      const payload = await verifyAccessToken(currentAccessToken)
      if(payload.result !== "fail"){
        /* console.log("passingToken") */
      req.user = {
        _id: payload._id,
        username: payload.username,
        role: payload.role
      }
      next()
      }else{
        /* console.log("failedToken",req.cookies.refreshToken) */
        const  {accessToken, refreshToken, user} = await refreshTokens(req.cookies.refreshToken)
        /* console.log("refreshed", refreshToken, user) */
      req.user = {
        _id: user._id,
        username: user.username,
        role: user.role
      };
      req.newTokens={
        accessToken,
        refreshToken
      };
      next()}
    } catch (error) {
      console.log(error);      
      next(createHttpError(401, "Token invalid!"))
    }
  }
}

export const AdminOnly = async (req, res, next) => {
  if(req.user.role !== "Admin"){
    next(createHttpError(401, "Access Denied"))
  }
  next()
}
export const isAssetOwner = async (req, res, next) => {
  const asset = assetModel.findById(req.params.assetId) 
  console.log("asset poster: ",asset.poster)
  if(req.user.role === "Admin" || req.user._id === asset.poster){
    next()
  }
  next(createHttpError(401, "Access Denied"))
}