const ChatHeader = ({ selectedUser }: { selectedUser: any }) => {
   return (
      <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm p-4 border-b dark:border-zinc-800 flex items-center gap-3 z-10 sticky top-0">
         <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-800 flex items-center justify-center font-bold uppercase text-white shadow-md">
            {selectedUser.username.charAt(0)}
         </div>
         <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{selectedUser.username}</h2>
         </div>
      </header>
   )
}

export default ChatHeader