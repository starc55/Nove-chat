import { z } from "zod";
import { authorizeCustomer, getConversationPresence } from "../services/chat.service.js";

const joinSchema = z.object({ visitorId: z.string().uuid(), publicId: z.string().min(3).max(30) });

export function registerChatSocket(socket) {
  socket.on("conversation:join", async (payload, acknowledge = () => {}) => {
    try {
      const input = joinSchema.parse(payload);
      const conversation = await authorizeCustomer(input.publicId, input.visitorId);
      const room = `conversation:${conversation.id}`;
      if (socket.data.chatRoom) await socket.leave(socket.data.chatRoom);
      socket.data.chatRoom = room;
      socket.data.chatIdentity = input;
      await socket.join(room);
      socket.emit("operator:presence", await getConversationPresence(conversation.id));
      acknowledge({ success: true });
    } catch {
      acknowledge({ success: false, error: "Suhbatga ulanish rad etildi." });
    }
  });

  socket.on("typing:start", () => {
    if (socket.data.chatRoom) socket.to(socket.data.chatRoom).emit("typing:start", { senderType: "CUSTOMER" });
  });
  socket.on("typing:stop", () => {
    if (socket.data.chatRoom) socket.to(socket.data.chatRoom).emit("typing:stop", { senderType: "CUSTOMER" });
  });
}
