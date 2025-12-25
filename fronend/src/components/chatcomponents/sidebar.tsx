import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface SidebarProps {
   users: any[];
   selectedUser: any;
   joinRoom: (user: any) => void;
}

/* 
Type '{ users: any[]; selectedUser: any; loadChatAndJoinRoom: (userToChatWith: any) => Promise<void>; }' is not assignable to type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'.
  Property 'users' does not exist on type 'IntrinsicAttributes & Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>'.ts(2322)

*/

const Sidebar = ({ users, selectedUser, joinRoom }: SidebarProps) => {
   const navigate = useNavigate();
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