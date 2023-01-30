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
import bodyParser from "body-parser";

export const server = express();
export const httpServer = createServer(server);
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
  origin: [
      "https://www.3depot.org",
      "https://3-depot-crgeg5i1q-pasha127.vercel.app/",
      "https://3-depot-fe.vercel.app/",
      "https://3Depot.org",
      "www.3dpot.org",
      "https://3-depot-fe-git-main-pasha127.vercel.app/",
      "https://3-depot-fe-pasha127.vercel.app/",
      "https://api.3depot.org",
      "http://localhost:3000"
  ],
  credentials: true
}));
server.use(cookieParser());
server.use(express.json());
server.use(passport.initialize());
/* server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json()); */
server.use("/", router);
server.use(errorHandler);
