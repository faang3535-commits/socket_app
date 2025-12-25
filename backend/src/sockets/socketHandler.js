const ChatBuffer = require('../services/chatBuffer');
const prisma = require('../../prisma');

function setupSocket(io) {
   io.on('connection', (socket) => {
      let activeRoom = null;

      socket.on('join_room', (roomId) => {
         socket.join(roomId);
         activeRoom = roomId;
         console.log(`User ${socket.user.id} joined room: ${roomId}`);
      });

      socket.on('send_message', async ({ content, files, roomId }) => {
         try {
            await ChatBuffer.addMessage(roomId, {
               content: content,
               file: Array.isArray(files) ? files : [],
               senderId: socket.user.id,
            });

            io.to(roomId).emit('receive_message', {
               content: content,
               senderId: socket.user.id,
               file: files,
               roomId: roomId,
               sentAt: new Date(),
            });
         } catch (error) {
            console.error("Failed to process message in handler:", error);
         }
      });

      socket.on("typing", ({ roomId }) => {
         socket.to(roomId).emit("typing", { from: socket.user.id });
      });

      socket.on("stop_typing", ({ roomId }) => {
         socket.to(roomId).emit("stop_typing", { from: socket.user.id });
      });

      socket.on("lastseen", async ({ userId, roomId }) => {
         try {
            await prisma.rooms.upsert({
               where: { roomId_userId: { roomId: roomId, userId: userId } },
               update: { lastSeen: new Date() },
               create: { roomId: roomId, userId: userId, lastSeen: new Date() },
            });
         } catch (error) {
            console.error("Failed to update last seen in socketHandler:", error);
         }
      });

      socket.on("upload_data", async ({ roomId }) => {
         try {
            console.log("Upload data received for room:", roomId);
            if (activeRoom) {
               await ChatBuffer.flushBuffer(activeRoom);
            }
         } catch (error) {
            console.error("Failed to update upload data :", error);
         }
      });

      socket.on('disconnect', async () => {
         console.log(`User ${socket.id} disconnected.`);
         if (activeRoom) {
            await ChatBuffer.flushBuffer(activeRoom);
         }
      });
   });
}

module.exports = setupSocket;