import { Socket } from "socket.io";
import chatModel from "../api/models/chatModel.js";
import MessageModel from "../api/models/MessageModel.js";
import userModel from "../api/models/userModel.js";
import  {io}  from "../server.js";
/* const socket = io(process.env.FE_DEV_URL); */




export let onlineUsers = [];
export const newConnectionHandler = (newClient) => {
  let joinedRoom = "";
  newClient.emit("welcome", {
    message: `Connection established on pipeline: ${newClient.id}`
  });
  newClient.on("setUsername", (payload) => {
    console.log("setUsername: ",payload);
    const individuals = onlineUsers.map(person => {return(person._id)}) 
    if(individuals.includes(payload._id)){
  }else{onlineUsers.push({_id:payload._id, username: payload.username, socketId: newClient.id});
     }console.log(onlineUsers); 
    io.emit("listUpdate", onlineUsers);
  });
  
 newClient.on("joinRoom", async(socket)=>{
    console.log("joinRoom :", socket.chatRoomId);
    newClient.join(socket.chatRoomId); 
    joinedRoom = socket.chatRoomId;
  }) 
  
  newClient.on("sendMessage", async (socket) => {
    console.log("sendMsg");
    console.log("this is incoming message", socket.message.message);
    const msg = new MessageModel(socket.message.message);
    console.log("this is saved message", msg);
    const newMsg = await msg.save();
    const commonChat = await chatModel.find({
      members: socket.message.members
    });
    if (commonChat.length === 1) {
      commonChat[0].messages.push(newMsg._id);
      
      await commonChat[0].save();
     
      console.log("msg txt: ",socket.message.message.content.text);
      const chatId = commonChat[0]._id.toString();
      console.log("chatId: ",chatId);
      newClient.join(chatId);
      io.to(chatId).emit("newMessage", socket.message.message);
    } else {
      console.log("no chat");
      const newChat = new chatModel({
        members: socket.message.members,
        messages: [newMsg._id],
      });
      console.log("new chat", newChat);
      const { _id } = await newChat.save();
      console.log("chat_id", _id);
      newClient.join(_id);
      io.to(_id).emit("newMessage", socket.message.message);
    }
  });
  
  newClient.on("logOut", () => {
    console.log("disconnect - logout");
    onlineUsers = onlineUsers.filter((user) => user.socketId !== newClient.id);
    io.emit("listUpdate", onlineUsers);
  });
  
  newClient.on("disconnect", () => {
    console.log("disconnect");
    onlineUsers = onlineUsers.filter((user) => user.socketId !== newClient.id);
    io.emit("listUpdate", onlineUsers);
  });
};

