import supertest from "supertest";
import mongoose from "mongoose";
import dotenv from "dotenv";
import assetModel from "../src/api/models/assetModel";
import chatModel from "../src/api/models/chatModel";
import fileModel from "../src/api/models/fileModel";
import messageModel from "../src/api/models/MessageModel";
import transactionModel from "../src/api/models/transactionModel";
import userModel from "../src/api/models/userModel";
import { server } from "../src/server";
dotenv.config();
const client = supertest(server);

const newUser = {
    email: "testuser@jest.com",
    username: "jester420",
    firstName: "Jess",
    lastName: "Terr"
}

const newAsset = {
    name: "Rad Horse",
    type: "Game Optimized 3D Model",
    
}


