import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogAction, AlertDialogCancel } from './ui/alert-dialog';

interface DeleteAlertProps {
   deleteOpen: boolean;
   setDeleteOpen: (open: boolean) => void;
   messageToDelete: any;
   handleDelete: (message: any) => void;
}

const DeleteAlert = ({ deleteOpen, setDeleteOpen, messageToDelete, handleDelete }: DeleteAlertProps) => {
   return (
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
         <AlertDialogContent className='dark:bg-transparent bg-neutral-50'>
            <AlertDialogHeader>
               <AlertDialogTitle className='dark:text-white text-black'>Delete message?</AlertDialogTitle>
               <AlertDialogDescription className='dark:text-white text-black'>
                  This message will be permanently removed.
               </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter>
               <AlertDialogCancel className='dark:text-white text-black'>Cancel</AlertDialogCancel>

               <AlertDialogAction
                  className="bg-red-600 hover:bg-red-700 dark:text-white text-black"
                  onClick={async () => { handleDelete(messageToDelete) }}
               >
                  Delete
               </AlertDialogAction>
            </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
   );
}

export default DeleteAlert;
