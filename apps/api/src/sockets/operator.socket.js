import { z } from "zod";
import { getOperatorConversation } from "../services/operator-chat.service.js";
import { authenticateMiniAppOperator } from "../services/telegram-mini-app.service.js";

const publicIdSchema = z.string().min(3).max(30);

export function registerOperatorSocket(socket) {
  socket.on("operator:join", async (payload, acknowledge = () => {}) => {
    try {
      const auth = await authenticateMiniAppOperator(payload?.initData);
      socket.data.operatorId = auth.operator.id;
      await socket.join("operators:verified");
      await socket.join(`operator:${auth.operator.id}`);
      acknowledge({ success: true, operatorId: auth.operator.id });
    } catch (error) {
      acknowledge({ success: false, error: error.message || "Operator ulanishi rad etildi." });
    }
  });

  socket.on("operator:conversation:join", async (payload, acknowledge = () => {}) => {
    try {
      if (!socket.data.operatorId) throw new Error("Avval operator sifatida ulaning.");
      const publicId = publicIdSchema.parse(payload?.publicId);
      const conversation = await getOperatorConversation(socket.data.operatorId, publicId);
      if (socket.data.operatorRoom) await socket.leave(socket.data.operatorRoom);
      socket.data.operatorRoom = `conversation:${conversation.id}`;
      await socket.join(socket.data.operatorRoom);
      acknowledge({ success: true });
    } catch (error) {
      acknowledge({ success: false, error: error.message || "Suhbatga ulanish rad etildi." });
    }
  });
}
