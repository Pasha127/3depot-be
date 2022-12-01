import express from "express";
import cors from "cors";
import listEndpoints from "express-list-endpoints";
import router from "././api/router/index.js";
import googleStrategy from "./lib/auth/googleAuth.js";
import errorHandler from "./lib/tools/errorHandler.js";
import mongoose from "mongoose";
import passport from "passport";
import cookieParser from "cookie-parser";
import { Server as SocketServer } from "socket.io";
import { createServer } from "http";
import { newConnectionHandler } from "./socket/index.js";
import { verifyAccessToken } from "./lib/tools/tokenTools.js";


export const server = express();
const httpServer = createServer(server);
export const io = new SocketServer(httpServer);
io.use( async(socket, next) => {
  const token = socket.handshake.headers.cookie?.split(";")[0].replace("accessToken=", "");
 const isAllowed = await verifyAccessToken(token)
  if (isAllowed._id) {
    console.log("is",isAllowed._id)
    next();
  } else {
    console.log('auth failed')
  }
})
io.on('connection', newConnectionHandler)

const port = process.env.PORT || 3001;
passport.use("google", googleStrategy)
server.use(cors({
    origin:process.env.FE_DEV_URL,
    credentials:true
}));
server.use(cookieParser());
server.use(express.json());
server.use(passport.initialize());
server.use("/", router);
server.use(errorHandler);
