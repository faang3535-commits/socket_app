import ContextMenu from "../contextMenu";
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useSelector } from "react-redux";
import DeleteAlert from "../deleteAlert";
import { setMessages } from "@/store/slices/chatSlice";
import { useDispatch } from "react-redux";
import apiService from "@/services/axios"

const MessagesList = ({ selectedUser, user, isTyping, setEditOpen, setEditMessage }: { selectedUser: any; user: any; isTyping: boolean; setEditOpen: (open: boolean) => void; setEditMessage: (message: any) => void; }) => {
   const messages = useSelector((state: any) => state.chat.messages);
   const lastSeenChat = useSelector((state: any) => state.chat.lastSeenChat);
   const messagesEndRef = useRef<null | HTMLDivElement>(null);
   const { socket } = useSocket();
   const [deleteOpen, setDeleteOpen] = useState(false);
   const dispatch = useDispatch();
   useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [messages]);

   const handleDelete = async (message: any) => {
      if (!socket || !selectedUser || !message) return;
      try {
         const response = await apiService.delete(`/users/deletemessage/${message.id}?URL=${encodeURIComponent(message.file)}`);
         if (response?.status === 200) {
            console.log(response);
         }
         const newMessages = messages.filter((m: any) => m.id !== message.id);
         dispatch(setMessages(newMessages));
         setDeleteOpen(false);
      }
      catch (error) {
         console.error(error);
      }
   };

   return (
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">

         {messages.map((msg: any, index: number) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.type === 'system';

            if (isSystem) {
               return (
                  <div key={index} className="flex justify-center my-4">
                     <span className="text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-">{msg.content}</span>
                  </div>
               )
            }

            return (
               <div key={index} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
                  <div className={`flex w-full px-4 py-1 ${isMe ? 'justify-end' : 'justify-start'}`}>

                     <DeleteAlert deleteOpen={deleteOpen} setDeleteOpen={setDeleteOpen} messageToDelete={msg} hadleDelete={handleDelete} />

                     <div className={`flex max-w-[85%] md:max-w-[70%] items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && (
                           <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400 mb-1">
                              {selectedUser?.username?.charAt(0).toUpperCase() || 'U'}
                           </div>
                        )}
                        <ContextMenu onEdit={() => { setEditMessage({ ...msg }); setEditOpen(true) }} onDelete={() => { setEditMessage({ ...msg }); setDeleteOpen(true); }}>
                           <div className={`relative px-3 py-2 shadow-md rounded-lg ${isMe
                              ? 'bg-blue-600/50 text-white rounded-tr-none'
                              : 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-tl-none'
                              }`}>
                              <div className={`absolute top-0 ${isMe ? '-right-1.5' : '-left-[7px]'}`}>
                                 <div
                                    className={`w-1.5 h-2 ${isMe ? 'bg-blue-600/50' : 'bg-zinc-800'}`}
                                    style={{
                                       clipPath: isMe
                                          ? 'polygon(0 0, 100% 0, 0 100%)'
                                          : 'polygon(100% 0, 100% 100%, 0 0)'
                                    }}
                                 />
                                 {!isMe && (
                                    <div
                                       className="absolute top-0 left-0 w-2 h-3 border-l border-t border-zinc-700/50"
                                       style={{
                                          clipPath: 'polygon(100% 0, 100% 100%, 0 0)'
                                       }}
                                    />
                                 )}
                              </div>

                              {/* Username for received messages */}
                              {!isMe && (
                                 <div className="text-[11px] font-semibold text-blue-400 mb-1">
                                    {selectedUser?.username}
                                 </div>
                              )}

                              {/* Message content */}
                              <div className="flex flex-col gap-1">
                                 {/* Images if any */}
                                 {msg.signedFiles && msg.signedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-1">
                                       {msg.signedFiles.map((url: string, i: number) => (
                                          console.log(url, "url............"),
                                          <img
                                             key={i}
                                             src={url}
                                             alt="attachment"
                                             className="max-h-60 max-w-full rounded-md object-cover"
                                          />
                                       ))}
                                    </div>
                                 )}

                                 {/* Message text and timestamp */}
                                 <div className="flex items-end gap-2">
                                    <p className="whitespace-pre-wrap text-[15px] leading-[1.4] flex-1">
                                       {msg.content}
                                    </p>
                                    <div className={`text-[11px] shrink-0 ${isMe ? 'text-blue-100/70' : 'text-zinc-500'}`}>
                                       {msg.time || new Date(msg.createdAt || msg.sentAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                       })}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </ContextMenu>
                     </div>
                  </div>
               </div>
            );
         })}
         <div ref={messagesEndRef} />

         {messages.find((msg: any) => msg.senderId === user.id) && lastSeenChat.length > 0 && (
            <div className="text-xs text-zinc-400 mt-1 flex justify-end">Last seen {lastSeenChat}</div>
         )}

         <div className={`flex w-full justify-start mb-4 px-4`}>
            <div className={`flex max-w-[80%] md:max-w-[70%] flex-row items-end gap-2`}>
               {isTyping && (
                  <>
                     <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400">
                        {selectedUser?.username?.charAt(0) || 'U'}
                     </div>
                     <div className='bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-sm rounded-bl-none px-4 py-1.5 text-sm shadow-md'>
                        <p className="text-xs text-zinc-400 mt-1 dot-animation">Typing<span>.</span><span>.</span><span>.</span><span>.</span></p>
                     </div>
                  </>
               )}
            </div>
         </div>
      </div>

   )
}

export default MessagesList