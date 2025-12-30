import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface ContextMenuProps {
   children: React.ReactNode
   onEdit?: () => void
   onDelete?: () => void
   onEmojiSelect?: (emoji: string) => void
}

const emojis = ["👍", "❤️", "😂", "😮", "😢", "🔥"]

const Context_Menu = ({
   children,
   onEdit,
   onDelete,
   onEmojiSelect,
}: ContextMenuProps) => {
   return (
      <ContextMenu modal={false}>
         <ContextMenuTrigger>{children}</ContextMenuTrigger>

         <ContextMenuContent className="bg-transparent border-none shadow-none text-black dark:text-white">

            {/* 🔹 Emoji Section */}
            <div className="mb-2 bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-full flex gap-1 justify-center shadow-lg">
               {emojis.map((emoji) => (
                  <ContextMenuItem
                     key={emoji}
                     onClick={() => onEmojiSelect?.(emoji)}
                     className="hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white text-md rounded-full p-2 px-2.5"
                  >
                     {emoji}
                  </ContextMenuItem>
               ))}
            </div>
            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-700 rounded-lg shadow-lg overflow-hidden">
               <ContextMenuItem
                  onClick={onEdit}
                  className="hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white"
               >
                  Edit
               </ContextMenuItem>

               <ContextMenuItem
                  onClick={onDelete}
                  className="hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-black dark:hover:text-white"
               >
                  Delete
               </ContextMenuItem>
            </div>
         </ContextMenuContent>
      </ContextMenu>
   )
}

export default Context_Menu
