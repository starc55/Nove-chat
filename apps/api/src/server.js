import { createServer } from "node:http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { registerChatSocket } from "./sockets/chat.socket.js";
import { startTelegramDeliveryWorker } from "./services/telegram.service.js";

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: { origin: env.CLIENT_URL.split(",").map((origin) => origin.trim()), credentials: true }
});
app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("system:ready", { connectedAt: new Date().toISOString() });
  registerChatSocket(socket);
});

httpServer.listen(env.PORT, () => console.log(`NOVA API http://localhost:${env.PORT}`));
const telegramWorker = startTelegramDeliveryWorker();

function shutdown(signal) {
  console.log(`${signal}: server yopilmoqda`);
  if (telegramWorker) clearInterval(telegramWorker);
  httpServer.close(() => process.exit(0));
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
