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
            })),
         });
      } catch (error) {
         const existing = this.buffers.get(roomId) || [];
         this.buffers.set(roomId, [...messages, ...existing]);
         console.error(`[Batching] Failed to flush buffer for room ${roomId}:`, error);
      }
   }
}

module.exports = new ChatBufferService();