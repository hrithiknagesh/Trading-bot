require("dotenv").config();
const http      = require("http");
const { Server } = require("socket.io");
const app       = require("./app");
const connectDB = require("./config/db");
const botService = require("./services/bot.service");

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);

  // Attach Socket.IO so bot can push live updates
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" },
  });

  // Give botService access to io so it can emit ticks
  botService.setIO(io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
  });

  server.listen(PORT, () => console.log(`✅ Server running → http://localhost:${PORT}`));
});
