import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useDispatch } from "react-redux";
import { setLastSeenChat, setMessages, setSelectedUser } from "@/store/slices/chatSlice";
import { supabase } from "../../lib/supabase";
import apiService from "../../services/axios";
import { useRef, useEffect } from "react";
import { useSocket } from "@/context/SocketContext";

interface SidebarProps {
   users: any[];
   selectedUser: any;
   user: any;
}

const Sidebar = ({ users, selectedUser, user }: SidebarProps) => {
   const navigate = useNavigate();
   const dispatch = useDispatch();
   const { socket } = useSocket();
   const prevSelectedUser = useRef<any>(selectedUser);


   const joinRoom = async (userToChatWith: any) => {

      dispatch(setSelectedUser(userToChatWith));

      try {
         const roomId = [user.id, userToChatWith.id].sort().join('_');
         socket.emit('lastseen', { userId: userToChatWith.id, roomId });
         const historyData = await apiService.get(`/users/messages/${roomId}`);

         const allFilePaths: string[] = [];
         if (!historyData) return;
         historyData?.data?.messages.forEach((msg: any) => {
            if (msg.file && msg.file.length > 0) {
               allFilePaths.push(...msg.file);
            }
         });

         const signedUrlMap: Record<string, string> = {};
         if (allFilePaths.length > 0) {
            const signedUrlResults = await Promise.all(
               allFilePaths.map(async (path: string) => {
                  const { data } = await supabase
                     .storage
                     .from('Dev')
                     .createSignedUrl(path, 86400);
                  return { path, url: data?.signedUrl };
               })
            );

            signedUrlResults.forEach(result => {
               if (result.url) {
                  signedUrlMap[result.path] = result.url;
               }
            });
         }

         const enrichedMessages = historyData.data.messages.map((msg: any) => {
            if (msg.file && msg.file.length > 0) {
                  const signedFiles = msg.file.map((path: string) => signedUrlMap[path]);
               return { ...msg, signedFiles };
            }
            return msg;
         });

         dispatch(setMessages(enrichedMessages));

         const lastSeenData = historyData.data.lastSeen.find((u: any) => u.userId == user.id)?.lastSeen;
         let calculatedLastSeen: string = '';
         if (lastSeenData) {
            const seen = new Date(lastSeenData).getTime();
            const cur = new Date().getTime();
            const diffInMs = Math.abs(cur - seen);
            const diffInMin = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
            const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

            if (diffInMin < 1) calculatedLastSeen = 'Just now';
            else if (diffInHours < 1) calculatedLastSeen = `${diffInMin} min ago`;
            else if (diffInDays < 1) calculatedLastSeen = `${diffInHours} hours ago`;
            else if (diffInWeeks < 1) calculatedLastSeen = `${diffInDays} days ago`;
            else calculatedLastSeen = `${diffInWeeks} weeks ago`;
         }
         dispatch(setLastSeenChat(calculatedLastSeen));
      } catch (error) {
         console.error("Failed to update last seen:", error);
      } finally {
         // if (currentRequest === loadingRef.current) {
         //    // setIsLoadingMessages(false);
         // }
      }
      dispatch(setSelectedUser(userToChatWith));
   }

   useEffect(() => {
      if (!socket || !selectedUser) return;
      if (prevSelectedUser.current !== null) {
         const roomId = [user.id, prevSelectedUser.current.id].sort().join('_');
         socket.emit('lastseen', { userId: prevSelectedUser.current.id, roomId });
      }
      prevSelectedUser.current = selectedUser;
   }, [selectedUser]);

   return (
      <aside className="w-80 bg-white dark:bg-zinc-900 border-r dark:border-zinc-700/50 flex flex-col">
         <div className="p-4 sm:p-5 border-b dark:border-zinc-800 flex items-center gap-4">
            <button
               onClick={() => navigate('/')}
               className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
            >
               <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-xl text-zinc-900 dark:text-white tracking-tight">Messages</h1>
         </div>
         <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {users.map((u) => (
               <div
                  key={u.id}
                  onClick={() => joinRoom(u)}
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all duration-200 
                ${selectedUser?.id === u.id
                        ? 'bg-blue-900 text-white shadow-md shadow-blue-500/20'
                        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'}`}
               >
                  <div className="relative">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase transition-colors
                  ${selectedUser?.id === u.id ? 'bg-white/20 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                        {u.username.charAt(0)}
                     </div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <span className={`font-semibold block truncate ${selectedUser?.id === u.id ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {u.username}
                     </span>
                     <p className={`text-xs truncate ${selectedUser?.id === u.id ? 'text-blue-100' : 'text-zinc-400'}`}>
                        Click to chat
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </aside>
   )
}
export default Sidebar