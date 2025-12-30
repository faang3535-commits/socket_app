const prisma = require('../../prisma');

class ChatBufferService {
   constructor() {
      this.buffers = new Map();
      this.timeouts = new Map();
      this.THRESHOLD = 50;
      this.FLUSH_INTERVAL = 60000;
   }

   async addMessage(roomId, message) {
      if (!this.buffers.has(roomId)) {
         this.buffers.set(roomId, []);
      }

      const roomQueue = this.buffers.get(roomId);

      roomQueue.push({
         content: message.content,
         file: message.file || [],
         senderId: message.senderId,
         tempId: message.tempId,
      });

      if (roomQueue.length >= this.THRESHOLD) {
         console.log(`[Batching] Room ${roomId} reached threshold. Flushing to DB...`);
         await this.flushBuffer(roomId);
         return;
      }

      if (!this.timeouts.has(roomId)) {
         const timeout = setTimeout(() => {
            this.flushBuffer(roomId);
         }, this.FLUSH_INTERVAL);
         this.timeouts.set(roomId, timeout);
      }
   }

   removeMessage(roomId, tempId) {
      if (!this.buffers.has(roomId)) {
         return;
      }

      const roomQueue = this.buffers.get(roomId);
      const messageIndex = roomQueue.findIndex(msg => msg.tempId === tempId);

      if (messageIndex > -1) {
         roomQueue.splice(messageIndex, 1);
         console.log(`[Batching] Removed message with tempId ${tempId} from room ${roomId} buffer.`);
      }

      if (roomQueue.length === 0) {
         this.buffers.delete(roomId);
         if (this.timeouts.has(roomId)) {
            clearTimeout(this.timeouts.get(roomId));
            this.timeouts.delete(roomId);
         }
      }
   }

   updateMessage(roomId, tempId, updates) {
      if (!this.buffers.has(roomId)) return;
      const roomQueue = this.buffers.get(roomId);
      const messageIndex = roomQueue.findIndex(msg => msg.tempId === tempId);
      if (messageIndex > -1) {
         roomQueue[messageIndex] = {
            ...roomQueue[messageIndex],
            ...updates
         }
         return true;
      }
      return false;
   }

   async flushBuffer(roomId) {
      if (this.timeouts.has(roomId)) {
         clearTimeout(this.timeouts.get(roomId));
         this.timeouts.delete(roomId);
      }

      const messages = this.buffers.get(roomId);
      if (!messages || messages.length === 0) return;
      this.buffers.delete(roomId);

      try {
         await prisma.messages.createMany({
            data: messages.map((message) => ({
               content: message.content,
               file: message.file,
               senderId: message.senderId,
               roomId: roomId,
               reaction: message.reaction || null,
            })),
         });
      } catch (error) {
         const existing = this.buffers.get(roomId) || [];
         this.buffers.set(roomId, [...messages, ...existing]);
         console.error(`[Batching] Failed to flush buffer for room ${roomId}:`, error);
      }
   }

   getUnreadBufferedMessages(userId) {
      const unreadMessages = [];

      for (const [roomId, messages] of this.buffers.entries()) {
         if (roomId.includes(userId)) {
            const userUnreadMessages = messages.filter(msg => msg.senderId !== userId);
            unreadMessages.push(...userUnreadMessages.map(msg => ({
               ...msg,
               roomId,
               sentAt: new Date(),
               isBuffered: true,
               tempId: msg.tempId,
            })));
         }
      }

      return unreadMessages;
   }
}

module.exports = new ChatBufferService();