import express from "express";
import q2m from "query-to-mongo";
import createHttpError from "http-errors";
import { AdminOnly, isAssetOwner, JWTAuth } from "../../lib/auth/middleware.js";
import { createTokens, refreshTokens } from "../../lib/tools/tokenTools.js";
import {
  checkUserSchema,
  checkValidationResult as checkUserValidationResult,
} from "../validators/userValidator.js";
import {
  checkMessageSchema,
  checkValidationResult as checkMessageValidationResult,
} from "../validators/messageValidator.js";
import {
  checkChatSchema,
  checkValidationResult as checkChatValidationResult,
} from "../validators/chatValidator.js";
import userModel from "../models/userModel.js";
import chatModel from "../models/chatModel.js";
import MessageModel from "../models/MessageModel.js";
import passport from "passport";
import multer from "multer"; 
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import transactionModel from "../models/transactionModel.js";
import assetModel from "../models/assetModel.js";
import fileModel from "../models/fileModel.js";
import commentModel from "../models/commentModel.js";

const expectedDomains= [
  "https://www.3depot.org",
  "https://3-depot-crgeg5i1q-pasha127.vercel.app/",
  "https://3-depot-fe.vercel.app/",
  "https://3Depot.org",
  "www.3dpot.org",
  "https://3-depot-fe-git-main-pasha127.vercel.app/",
  "https://3-depot-fe-pasha127.vercel.app/"
]



const localEndpoint = process.env.BE_PROD_URL;

const router = express.Router();


const cloudinaryAvatarUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, 
    params: {folder: "3DepotAvatars"},
  }),
  limits: { fileSize: 1024 * 1024 }
}).single("image")

const cloudinaryProductUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, 
    params: {folder: "3DepotProducts"},
  }),
  limits: { fileSize: 1024 * 1024 }
}).array("image")


const cloudinaryModelUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, 
    params: {folder: "3DepotProducts", resource_type: "image"},
  })
}).single("model")

const cloudinaryMsgPicUploader = multer({
  storage: new CloudinaryStorage({
    cloudinary, 
    params: {folder: "3DepotMessages", resource_type: "image"},
  }),
  limits: { fileSize: 1024 * 1024 }
}).single("image")


////////////////////////////  USERS  ////////////////////////////



 router.get("/user/googleLogin", passport.authenticate("google",{scope:["email","profile"]})) 

router.get("/user/googleRedirect", passport.authenticate("google",{session: false}), async (req, res, next) => {

  try {
    const {accessToken,refreshToken} = req.user
    res.cookie("accessToken",accessToken,{"httpOnly":true});
    res.cookie("refreshToken",refreshToken,{"httpOnly":true});
    res.redirect(`${process.env.FE_DEV_URL}/`/* ?loginSuccessful=true */ );
  }catch(error){
    console.log(error)
      next(error);
  }   
}) 

router.post("/user/register", async (req, res, next) => {
    try {
        console.log(req.headers.origin, "POST user at:", new Date());        
        const existingUser = await userModel.find({ $or : [{email: req.body.email}, {username:req.body.username} ] });
   /*  console.log("this is existing user", existingUser); */
    if (existingUser.length > 0) {
      next(createHttpError(400, `Email or username already in use`));
    }else{

        const newUser = new userModel({...req.body, credits: 10, email:req.body.email.toLowerCase()});
    const { _id } = await newUser.save();
        if (_id) {
            const { accessToken, refreshToken } = await createTokens(newUser);
            res.cookie("accessToken", accessToken, {httpOnly:true});
            res.cookie("refreshToken", refreshToken, {httpOnly:true});
            res.status(201).send(newUser);
          } else {
            console.log("Error in returned registration");
            next(createHttpError(500, `Registration error`));
        }}
  } catch (error) {
        console.log("Error in registration", error);
        next(error);
    }   
});

router.post("/user/avatar", JWTAuth, cloudinaryAvatarUploader, async (req, res, next) => {
    try {
        console.log(req.headers.origin, "POST user at:", new Date());        
        const updatedUser = await userModel.findByIdAndUpdate(req.user._id,{avatar:req.file.path});
        res.status(201).send({message:`${updatedUser._id} avatar uploaded`})
      } catch (error) {
        console.log("Error in avatar upload", error);
        next(error);
    }   
});

router.put("/user/login", async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await userModel.checkCredentials(email, password);  
      if (user) {
        const { accessToken, refreshToken } = await createTokens(user);
        res.cookie("accessToken", accessToken, {httpOnly:true});
        res.cookie("refreshToken", refreshToken, {httpOnly:true});
        res.status(200).send(user);
      } else {
      next(
        createHttpError(401, `Credentials did not match or user not found.`)
      );
      }
    } catch (error) {
        console.log("Error in log in");
      next(error);
    }
});
  
router.post("/user/refreshTokens", async (req, res, next) => {
    try {
    const currentRefreshToken = req.cookies.refreshToken;
    const { accessToken, refreshToken, user } = await refreshTokens(
      currentRefreshToken
    );
      res.cookie("accessToken", accessToken, {httpOnly:true});
      res.cookie("refreshToken", refreshToken, {httpOnly:true});
    res.status(201).send({ message: `${user.username} refreshed tokens` });
    } catch (error) {
      console.log("Refresh tokens", error);
      next(error);
    }
});

router.get("/user/all", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET all users at:", new Date());
    const users = await userModel.find();
    res.status(200).send(users);
  } catch (error) {
    console.log("Get all", error);
    next(error);
  }
});

router.put("/user/logout", JWTAuth, async (req, res, next) => {
  try {
    console.log(req.headers.origin, "PUT user logout at:", new Date());
    /* console.log(req); */
    const user = await userModel.findOne({ _id: req.user._id });
    if (user) {
      const userObj = user.toObject();
      res.clearCookie("refreshToken");
      res.clearCookie("accessToken");
      /*  res.redirect(`${process.env.FE_DEV_URL}/`) */
      res.status(200).send({ message: `${userObj.username} logged out` });
    } else {
      next(createHttpError(404, "User not found"));
    }
  } catch (error) {
    console.log("error put me");
    next(error);
  }
});

router.get("/user/me", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true, domain: "."});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true, domain: "."});
  }
  try {
    console.log(req.headers.origin, "GET me at:", new Date());
    /* console.log(req); */
    const user = await userModel.find({ _id: req.user._id }).populate({
      path : 'uploads',
      populate : {
        path : 'file'
      }
    });
     if (user) {
      /* console.log("found user", user); */
      res.status(200).send(user);
     } else {

       next(createHttpError(404, "User not found"));
     }
  } catch (error) {
    console.log("error get me");
    next(error);
  }
});

router.get("/user/email/:emailValue", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET by email at:", new Date());
    const user = await userModel.findOne({ email: req.params.emailValue.toLowerCase()});
     if (user) {
      /* console.log("found user", user); */
      res.status(200).send(user);
     } else {
       next(createHttpError(404, "User not found"));
     }
  } catch (error) {
    console.log("error getting by email");
    next(error);
  }
});

router.put("/user/me", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "PUT User at:", new Date());
    const foundUser = await userModel.findById(
      req.user._id);
    if(req.body.firstName){foundUser.firstName = req.body.firstName}
    if(req.body.lastName){foundUser.lastName = req.body.lastName}
    if(req.body.username){
      const sameNamedUser=await userModel.findOne({username:req.body.username})
      console.log("same named user: ",sameNamedUser);
      if(sameNamedUser){
      next(createHttpError(401, "Username Taken"))
      return
    }
      else{foundUser.username = req.body.username}
    }
    foundUser.save();
    res.status(200).send(foundUser);
  } catch (error) {
    console.log("Put me", error);
    next(error);
  }
});

router.delete("/user/me", JWTAuth, async (req, res, next) => {
  try {
    console.log(req.headers.origin, "DELETE User at:", new Date());
    const deletedUser = await userModel.findByIdAndDelete(req.user._id);
    if (deletedUser) {
      res.status(204).send({ message: "User has been deleted." });
    } else {
      next(createHttpError(404, "User Not Found"));
    }
  } catch (error) {
    console.log("Delete Me", error);
    next(error);
  }
});
router.delete("/user/:userId", JWTAuth, AdminOnly, async (req, res, next) => {
  try {
    console.log(req.headers.origin, "DELETE User at:", new Date());
    const deletedUser = await userModel.findByIdAndDelete(req.params.userId);
    if (deletedUser) {
      res.status(204).send({ message: "User has been deleted." });
    } else {
      next(createHttpError(404, "User Not Found"));
    }
  } catch (error) {
    console.log("Delete User", error);
    next(error);
  }
});

router.post(
  "/user/new",
  JWTAuth,
  checkUserSchema,
  checkUserValidationResult,
  async (req, res, next) => {
    if (req.newTokens) {
      res.cookie("accessToken", req.newTokens.newAccessToken);
      res.cookie("refreshToken", req.newTokens.newRefreshToken);
    }
    try {
      console.log(req.headers.origin, "POST user at:", new Date());
      const newUser = new userModel(req.body);
      const createdUser= await newUser.save();
      res.status(201).send(createdUser);
    } catch (error) {
      console.log("Post new user", error);
      next(error);
    }
  }
);

router.get("/user/:userId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET user at:", new Date());
    const foundUser = await userModel.findById(req.params.userId);
    if (foundUser) {
      res.status(200).send(foundUser);
    } else {
      next(createHttpError(404, "user Not Found"));
    }
  } catch (error) {
    console.log("Get user by ID", error);
    next(error);
  }
});

//------------------------------------ chats ---------------------------

router.post("/chat", JWTAuth, checkChatSchema, checkChatValidationResult, async (req, res, next) => {
    try {
      const newChat = await chatModel(req.body);
      const { _id } = await newChat.save();
      console.log("newChat");
      if (_id) {
        res.status(201).send(_id);
      } else {
        next(createHttpError(404, `Error - Chat Not Created`));
      }
    } catch (error) {
      next(error);
    }
});

router.get("/chat/me/history", JWTAuth, async (req, res, next) => {
  try {
    const chats = await chatModel.find({ members: req.user._id }).populate('messages').populate('members');
    if (chats) {
      res.send(chats);
    } else {
      next(
        createHttpError(404, `Chats Not Found`)
        );
      }
    } catch (error) {
      next(error);
    }
});

router.get("/chat/me", JWTAuth, async (req, res, next) => {
  try {
    const chats = await chatModel.find({ members: req.user._id });
    if (chats) {
      res.send(chats);
    } else {
      next(
        createHttpError(404, `Error - Chats Not Found`)
        );
      }
    } catch (error) {
      next(error);
    }
});


  
  router.get("/chat/:chatId", JWTAuth, async (req, res, next) => {
    try{
      const chat = await chatModel.findById(req.params.chatId).populate('messages').populate('members');
      /* console.log("this is chat", chat); */
      if (chat) {
        res.status(200).send(chat);
      } else {
        next(createHttpError(404, `Error - Chat Not Found`));
      }
    }catch(error){
      console.log(error)
      next(error)
    }
  });
  
  router.delete("/chat/:chatId", JWTAuth, async (req, res, next) => {
    try {
      const deletedChat = await chatModel.findOne({_id:req.params.chatId});
      if (deletedChat) {
        await deletedChat.remove();
        res.status(204).send({message:`Deleted chat:${deletedChat._id}`});
      } else {
        next(createHttpError(404, `Error - Chat Not Found`));
      }
    } catch (error) {
      console.log(error)
      next(error); 
    }
  }); 
  
  // ------------------- message endpoints -----------------------------
  

  router.post("/message/pic", JWTAuth, cloudinaryMsgPicUploader, async (req, res, next) => {
    try {
        console.log(req.headers.origin, "POST MsgPic at:", new Date());        
        if(req.file.path){res.status(201).send({imgURL:`${req.file.path}`});}
        else{res.status(400).send({message:"Image Upload Failed"})}
      } catch (error) {
        console.log("Error in msg pic upload", error);
        next(error);
    }   
  });


  router.post("/message", JWTAuth, checkMessageSchema, checkMessageValidationResult, async (req, res, next) => {
    try {
      const newMessage = await MessageModel({...req.body, sender: req.user._id});
      const { _id } = await newMessage.save();
      if (_id) {
        res.status(201).send(_id);
      } else {
        next(createHttpError(404, `Message could not be created`));
      }
    } catch (error) {
    next(error);
  }
});

router.get(
  "/message/me",
  JWTAuth, async (req, res, next) => {
    try {
      const messages = await MessageModel.find({sender:req.user._id});
      /* console.log("found messages: ", messages ) */
      if (messages) {
        res.status(200).send({messages});
      } else {
        next(createHttpError(404, `Messages not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  "/message/:messageId",
  JWTAuth, async (req, res, next) => {
    try {
      const message = await MessageModel.findById(req.params.messageId);
      /* console.log("found message: ", message ) */
      if (message) {
        res.status(200).send(message);
      } else {
        next(createHttpError(404, `Message not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Transactions ~~~~~~~~~~~~~~~~~~~~~~~~~~~

router.get("/transaction/", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Transactions At:", new Date());
    const foundTransactions = await transactionModel.find();
    console.log("Found Transactions: ", foundTransactions);
    if (foundTransactions) {
      res.status(200).send(foundTransactions);
    } else {
      next(createHttpError(404, "Transactions Not Found"));
    }
  } catch (error) {
    console.log("Get Transactions Error:", error);
    next(error);
  }
});

router.get("/transaction/:transactionId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Transaction At:", new Date());
    const foundTransaction = await transactionModel.findById(req.params.transactionId);
    console.log("Found Transaction: ", foundTransaction);
    if (foundTransaction) {
      res.status(200).send(foundTransaction);
    } else {
      next(createHttpError(404, "Transaction Not Found"));
    }
  } catch (error) {
    console.log("Get Transaction By ID Error:", error);
    next(error);
  }
});

router.post("/transaction/", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    const newTransaction = await transactionModel(req.body);
    const { _id } = await newTransaction.save();
    console.log("New Transaction: ", _id);
    if (_id) {
      res.status(201).send(_id);
    } else {
      next(createHttpError(400, `Error - Transaction Not Created`));
    }
  } catch (error) {
    next(error);
  }
});

router.put("/transaction/:transactionId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Transaction At:", new Date());
    const foundTransaction = await transactionModel.findByIdAndUpdate(req.params.transactionId, {...req.body},{new:true});
    console.log("Updated Transaction: ", foundTransaction);
    if (foundTransaction) {
      res.status(200).send(foundTransaction);
    } else {
      next(createHttpError(404, "Transaction Not Found Or Update Failed"));
    }
  } catch (error) {
    console.log("Update Transaction By ID Error:", error);
    next(error);
  }
});

router.delete("/transaction/:transactionId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Transaction At:", new Date());
    const foundTransaction = await transactionModel.findByIdAndDelete(req.params.transactionId, {...req.body});
    console.log("Deleted Transaction: ", foundTransaction);
    if (foundTransaction) {
      res.status(204).send(foundTransaction);
    } else {
      next(createHttpError(404, "Transaction Not Found Or Update Failed"));
    }
  } catch (error) {
    console.log("Update Transaction By ID Error:", error);
    next(error);
  }
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Comments ~~~~~~~~~~~~~~~~~~~~~~~~~~~

router.post("/comment/:assetId", JWTAuth, cloudinaryModelUploader, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log("incoming comment", req.body.text)
    const incomingComment = req.body;
    const newComment = await commentModel({
      sender: req.user._id,
      content:{
        text: incomingComment.text,
        media: incomingComment.media
      }
    })
    const {_id} = await newComment.save()
    const updatedAsset = await assetModel.findByIdAndUpdate(
      req.params.assetId, 
      { $push: { comments: _id } }
  ,{new:true}).populate("file").populate({
    path : 'comments',
    populate : {
      path : 'sender'
    }
  });
    console.log("New comment: ", _id);
    if (_id) {
      res.status(201).send(updatedAsset);
    } else {
      next(createHttpError(400, `Error - Comment Not Saved`));
    }
  } catch (error) {
    next(error);
  }
});


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Assets ~~~~~~~~~~~~~~~~~~~~~~~~~~~

router.get("/asset/search/:query", async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  const mongoQuery = q2m(req.query)
  try {
    console.log(req.headers.origin, `Search Assets for ${req.params.query} At:`, new Date());
    const foundAssets = await assetModel.find({
      $or: [
        { name: { $regex: new RegExp(req.params.query, "i") } },
        { keywords: { $regex: new RegExp(req.params.query, "i") } },
        { description: { $regex: new RegExp(req.params.query, "i") } },
      ],
    }).populate("file").populate({
      path : 'comments',
      populate : {
        path : 'sender'
      }
    })
    .skip(mongoQuery.options.skip)
    .limit(mongoQuery.options.limit);
    /* .sort(mongoQuery.options.sort); */
    console.log("Found Assets: ", foundAssets);
    if (foundAssets) {
      res.status(200).send(foundAssets);
    } else {
      next(createHttpError(404, "Assets Not Found"));
    }
  } catch (error) {
    console.log("Get Assets Error:", error);
    next(error);
  }
});

/* router.get("/asset/me", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  const mongoQuery = q2m(req.query)
  try {
    console.log(req.headers.origin, "GET Assets At:", new Date());
    const foundAssets = await assetModel.find({poster: req.user._id}).sort(mongoQuery.options.sort);
    console.log("Found Assets: ", foundAssets);
    if (foundAssets) {
      res.status(200).send(foundAssets);
    } else {
      next(createHttpError(404, "Assets Not Found"));
    }
  } catch (error) {
    console.log("Get Assets Error:", error);
    next(error);
  }
}); */



router.get("/asset/:assetId", async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Asset At:", new Date());
    const foundAsset = await assetModel.findById(req.params.assetId).populate({
      path : 'comments',
      populate : {
        path : 'sender'
      }
    }).populate('file');
    console.log("Found Asset: ", foundAsset);
    if (foundAsset) {
      res.status(200).send(foundAsset);
    } else {
      next(createHttpError(404, "Asset Not Found"));
    }
  } catch (error) {
    console.log("Get Asset By ID Error:", error);
    next(error);
  }
});

router.get("/asset", async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  const mongoQuery = q2m(req.query)
  try {
    console.log(req.headers.origin, "GET Assets At:", new Date());
    const foundAssets = await assetModel.find().sort(mongoQuery.options.sort);
    console.log("Found Assets: ", foundAssets);
    if (foundAssets) {
      res.status(200).send(foundAssets);
    } else {
      next(createHttpError(404, "Assets Not Found"));
    }
  } catch (error) {
    console.log("Get Assets Error:", error);
    next(error);
  }
});
router.post("/asset", JWTAuth, cloudinaryModelUploader, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.body, req.file)
    const uploadedData = req.body;
    const newFile = await fileModel({
      name: uploadedData.name,
      type: uploadedData.type,
      link: req.file.path
    })
    const savedFile = await newFile.save();
    const newAsset = await assetModel({
      name: uploadedData.name,
      type: uploadedData.type,
      poster: uploadedData.poster,
      description: uploadedData.description,
      keywords: uploadedData.keywords,
      file: savedFile._id
    });
    const { _id } = await newAsset.save();
    const user = await userModel.findByIdAndUpdate(
      req.user._id, 
      { $push: { uploads: _id } }
  ,{new:true});
    console.log("New Asset: ", _id);
    if (_id) {
      res.status(201).send(_id);
    } else {
      next(createHttpError(400, `Error - Asset Not Created`));
    }
  } catch (error) {
    next(error);
  }
});


router.put("/asset/:assetId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Asset At:", new Date());
    const foundAsset = await assetModel.findByIdAndUpdate(req.params.assetId, {...req.body},{new:true});
    console.log("Updated Asset: ", foundAsset);
    if (foundAsset) {
      res.status(200).send(foundAsset);
    } else {
      next(createHttpError(404, "Asset Not Found Or Update Failed"));
    }
  } catch (error) {
    console.log("Update Asset By ID Error:", error);
    next(error);
  }
});

router.delete("/asset/:assetId", JWTAuth, /* isAssetOwner, */ async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "Delete Asset At:", new Date());
    const foundAsset = await assetModel.findOne({_id: req.params.assetId});
    console.log("Deleted Asset: ", foundAsset);
    if (foundAsset) {
      await foundAsset.remove()
      res.status(204).send(foundAsset);
    } else {
      next(createHttpError(404, "Asset Not Found Or Delete Failed"));
    }
  } catch (error) {
    console.log("Delete Asset By ID Error:", error);
    next(error);
  }
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Files ~~~~~~~~~~~~~~~~~~~~~~~~~~~

router.get("/file/", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET Files At:", new Date());
    const foundFiles = await fileModel.find();
    console.log("Found Files: ", foundFiles);
    if (foundFiles) {
      res.status(200).send(foundFiles);
    } else {
      next(createHttpError(404, "Files Not Found"));
    }
  } catch (error) {
    console.log("Get Files Error:", error);
    next(error);
  }
});


router.get("/file/:fileId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET File At:", new Date());
    const foundFile = await FileModel.findById(req.params.fileId);
    console.log("Found File: ", foundFile);
    if (foundFile) {
      res.status(200).send(foundFile);
    } else {
      next(createHttpError(404, "File Not Found"));
    }
  } catch (error) {
    console.log("Get File By ID Error:", error);
    next(error);
  }
});

router.post("/file/upload", JWTAuth, cloudinaryModelUploader, async (req, res, next) => {
  try {
      console.log(req.headers.origin, "POST file at:", new Date());        
      const newFile = await fileModel(req.body);
      const { _id } = await newFile.save();
} catch (error) {
      console.log("Error in file upload", error);
      next(error);
  }   
});

router.post("/file/data", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    const newFile = await fileModel(req.body);
    const { _id } = await newFile.save();
    console.log("New File: ", _id);
    if (_id) {
      res.status(201).send(_id);
    } else {
      next(createHttpError(400, `Error - File Not Created`));
    }
  } catch (error) {
    next(error);
  }
});

router.put("/file/:fileId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET File At:", new Date());
    const foundFile = await fileModel.findByIdAndUpdate(req.params.fileId, {...req.body},{new:true});
    console.log("Updated File: ", foundFile);
    if (foundFile) {
      res.status(200).send(foundFile);
    } else {
      next(createHttpError(404, "File Not Found Or Update Failed"));
    }
  } catch (error) {
    console.log("Update File By ID Error:", error);
    next(error);
  }
});

router.delete("/file/:fileId", JWTAuth, async (req, res, next) => {
  if (req.newTokens) {
    res.cookie("accessToken", req.newTokens.newAccessToken, {httpOnly:true});
    res.cookie("refreshToken", req.newTokens.newRefreshToken, {httpOnly:true});
  }
  try {
    console.log(req.headers.origin, "GET File At:", new Date());
    const foundFile = await FileModel.findByIdAndDelete(req.params.fileId, {...req.body});
    console.log("Deleted File: ", foundFile);
    if (foundFile) {
      res.status(204).send(foundFile);
    } else {
      next(createHttpError(404, "File Not Found Or Delete Failed"));
    }
  } catch (error) {
    console.log("Delete File By ID Error:", error);
    next(error);
  }
});


export default router;
