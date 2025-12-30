import EmojiPicker from "emoji-picker-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

export default function ChatEmoji({ setInput }: { setInput: (input: any) => void }) {

   const onEmojiClick = (emojiData: any) => {
      setInput((prev: any) => prev + emojiData.emoji);
   };

   return (
      <div className="flex items-center gap-">
         <Popover>
            <PopoverTrigger asChild>
               <Button variant="ghost" size="icon">
                  <Smile className="h-6 w-6 dark:text-white text-black" />
               </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 border-none">
               <EmojiPicker onEmojiClick={onEmojiClick} />
            </PopoverContent>
         </Popover>
      </div>
   );
}