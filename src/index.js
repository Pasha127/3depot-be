import mongoose from "mongoose"
import listEndpoints from "express-list-endpoints"
import {server, httpServer} from "./server.js"

const port = process.env.PORT || 3001


mongoose.connect(process.env.MONGO_CONNECTION_URL);

mongoose.connection.on("connected", () =>
  httpServer.listen(port, () => {
    console.table(listEndpoints(server));
    console.log(`Server running on port ${port}`);
  })
);

server.on("error", (error) =>
  console.log(`Server not running due to ${error}`)
);