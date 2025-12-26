import {
   ContextMenu,
   ContextMenuContent,
   ContextMenuItem,
   ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface ContextMenuProps {
   children: React.ReactNode;
   onEdit?: () => void;
   onDelete?: () => void;
}

const Context_Menu = ({ children, onEdit, onDelete }: ContextMenuProps) => {
   return (
      <ContextMenu modal={false}>
         <ContextMenuTrigger>
            {children}
         </ContextMenuTrigger>
         <ContextMenuContent className="dark:bg-neutral-900 bg-white dark:text-white text-black dark:border-neutral-600 border-neutral-400">
            <ContextMenuItem className="hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white" onClick={onEdit}>Edit</ContextMenuItem>
            <ContextMenuItem className="hover:bg-neutral-200 dark:hover:bg-neutral-700 dark:hover:text-white" onClick={onDelete}>Delete</ContextMenuItem>
         </ContextMenuContent>
      </ContextMenu>
   )
}

export default Context_Menu