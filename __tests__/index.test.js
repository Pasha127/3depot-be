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









/* 

describe("POST /user/register", () => {
  let user;

  beforeEach(() => {
    user = {
      email: "test@gmail.com",
      username: "test",
      password: "test123",
      name: "Test User"
    };
  });

  it("should register a new user", async () => {
    const res = await request(app)
      .post("/user/register")
      .send(user);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        email: user.email,
        username: user.username,
        name: user.name,
        credits: 10
      })
    );
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should return a 400 error if the email is already in use", async () => {
    await userModel.create(user);
    const res = await request(app)
      .post("/user/register")
      .send(user);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toEqual(`Email or username already in use`);
  });

  it("should return a 500 error if there is an internal server error", async () => {
    const saveSpy = jest.spyOn(userModel.prototype, "save").mockImplementationOnce(() => {
      throw new Error("Test error");
    });
    const res = await request(app)
      .post("/user/register")
      .send(user);
    expect(saveSpy).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toEqual(500);
    expect(res.body.message).toEqual(`Registration error`);
  });
}); */