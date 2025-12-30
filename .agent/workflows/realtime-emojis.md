---
description: Real-time Emoji/Reaction System Workflow
---

This workflow explains how the real-time reaction (emoji) system is implemented across the socket application.

### 1. Data Flow Overview
The system follows a "Persistence First, Update Second" pattern:
1. **Trigger**: User selects an emoji from the `ContextMenu` in the `MessagesList`.
2. **API Update**: A PUT request is sent to the backend (either to the DB or the Buffer).
3. **Socket Broadcast**: Once the API succeeds, the frontend emits a `send_reaction` event.
4. **Server Relay**: The server updates the internal buffer and broadcasts `receive_reaction` to the room.
5. **State Sync**: All clients in the room receive the event and update their Redux state via the `updateReaction` reducer.

---

### 2. Backend Implementation details

#### A. Message Buffer (`backend/src/services/chatBuffer.js`)
- **`updateMessage(roomId, tempId, updates)`**: Finds a message in the active memory queue by `tempId` and merges the new `reaction`.
- **`flushBuffer`**: Modified to include the `reaction` field when performing the `prisma.messages.createMany` operation.

#### B. API Controller (`backend/src/controllers/userController.js`)
- **`editMessageFromBuffer`**: Handles requests for messages not yet in the DB. It parses the `roomId` and `tempId` to update the reactive memory.
- **`editMessage`**: Standard DB update using Prisma for persistent messages.

#### C. Socket Handler (`backend/src/sockets/socketHandler.js`)
- **`send_reaction`**: 
    - Updates the ChatBuffer if it's a temporary message.
    - Uses `io.to(roomId).emit` to notify everyone in the current chat.
    - Uses `io.to(receiverId).emit` as a fallback for the specific user.

---

### 3. Frontend Implementation details

#### A. Redux State (`fronend/src/store/slices/chatSlice.tsx`)
- **`updateReaction`**: A reducer that iterates through the `messages` array and updates the `reaction` property if the `id` (database) or `tempId` (local) matches the incoming payload.

#### B. Global Listener (`fronend/src/layouts/chat/chat.tsx`)
- Houses the `useEffect` socket listener for `receive_reaction`. 
- This ensures that even if you are not the one who reacted, your UI stays in sync.

#### C. Interaction Logic (`fronend/src/components/chatcomponents/chatlist.tsx`)
- **`handleEdit`**: The core function that orchestrates the flow.
    - Detects if the message is in the DB (`msg.id`) or Buffer (`msg.tempId`).
    - Calls the appropriate API endpoint.
    - Emits the socket event only after a successful response.

---

### 4. Verification Steps
1. Open the app in two different browsers/tabs.
2. Send a message from User A to User B.
3. React to that message from User A.
4. **Expected**: User B's message should show the emoji immediately without a page refresh.
