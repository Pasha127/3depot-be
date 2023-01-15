import mongoose from "mongoose"
import listEndpoints from "express-list-endpoints"
import {server, httpServer} from "./server.js"

const port = process.env.PORT || 3001
let serverStarted = false;

const startServer = () => {
  if (!serverStarted) {
    httpServer.listen(port, () => {
      console.table(listEndpoints(server));
      console.log(`Server running on port ${port}`);
      serverStarted = true;
    });
  }
};
mongoose.connect(process.env.MONGO_CONNECTION_URL);

mongoose.connection.on("connected", startServer);

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose connection disconnected");
});

mongoose.connection.on("reconnected", startServer);

mongoose.connection.on("error", (error) =>
  console.log(`Mongoose connection failed due to ${error}`)
);

server.on("error", (error) =>
  console.log(`Server not running due to ${error}`)
);