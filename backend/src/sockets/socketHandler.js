const ChatBuffer = require('../services/chatBuffer');
const prisma = require('../../prisma');

function setupSocket(io) {
   io.on('connection', (socket) => {
      let activeRoom = null;
      
      socket.join(socket.user.id);
      console.log(`User ${socket.user.id} connected and joined personal room`);

      socket.on('join_room', (roomId) => {
         socket.join(roomId);
         activeRoom = roomId;
         console.log(`User ${socket.user.id} joined room: ${roomId}`);
      });

      socket.on('send_message', async ({ content, files, roomId, tempId }) => {
         try {
            await ChatBuffer.addMessage(roomId, {
               content: content,
               file: Array.isArray(files) ? files : [],
               senderId: socket.user.id,
               tempId: tempId,
            });
            
            const messageData = {
               content: content,
               senderId: socket.user.id,
               file: files,
               roomId: roomId,
               sentAt: new Date(),
               tempId: tempId,
            };
            socket.to(roomId).emit('receive_message', messageData);

            const [userId1, userId2] = roomId.split('_');
            const receiverId = userId1 === socket.user.id ? userId2 : userId1;
            
            io.to(receiverId).emit('receive_message', messageData);

            console.log(`Message sent to receiver ${receiverId}`);
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
            await prisma.users.update({
               where: { id: socket.user.id },
               data: { lastSeen: new Date() },
            });
            console.log("Last seen updated for user:", socket.user.id);
         } catch (error) {
            console.error("Failed to update last seen in socketHandler:", error);
         }
      });

      socket.on("upload_data", async ({ roomId }) => {
         console.log("Upload data received for room:", roomId);
         try {
            console.log("Upload data received for room:", roomId);
            if (activeRoom) {
               await ChatBuffer.flushBuffer(activeRoom);
            }
         } catch (error) {
            console.error("Failed to update upload data :", error);
         }
      });

      socket.on("send_reaction", async ({ roomId, tempId, messageId, reaction }) => {
         try {
            if (tempId) {
               await ChatBuffer.updateMessage(roomId, tempId, { reaction });
            }
            io.to(roomId).emit("receive_reaction", { roomId, tempId, messageId, reaction });
            
            const [userId1, userId2] = roomId.split('_');
            const receiverId = userId1 === socket.user.id ? userId2 : userId1;
            io.to(receiverId).emit("receive_reaction", { roomId, tempId, messageId, reaction });
            
            console.log("Reaction sent for room:", roomId);
         } catch (error) {
            console.error("Failed to process reaction in socketHandler:", error);
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