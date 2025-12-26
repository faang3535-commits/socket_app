import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/axios';
import { Cross, Pencil, Send } from 'lucide-react';
import FileUploadDropzone from '@/components/fileUploader';
import { supabase } from '@/lib/supabase';
import Sidebar from '@/components/chatcomponents/sidebar';
import ChatHeader from '@/components/chatcomponents/chatheader';
import MessagesList from '@/components/chatcomponents/chatlist';
import { useSocket } from '@/context/SocketContext';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { setMessages, addMessage } from '@/store/slices/chatSlice';

const Chat = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state: any) => state.chat.messages);
  const selectedUser = useSelector((state: any) => state.chat.selectedUser);
  const { socket } = useSocket();
  const [input, setInput] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const navigate = useNavigate();
  const sessionString = localStorage.getItem('sb-bivjfuifyqourtgzxrkj-auth-token');
  const session = sessionString ? JSON.parse(sessionString) : null;
  const token = session?.access_token;
  const rawUser = session?.user || {};
  const typingTimeoutRef = useRef<any>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false)
  const [editMessage, setEditMessage] = useState<any>(null)

  const user = useMemo(() => {
    return {
      id: rawUser.id,
      email: rawUser.email,
      username: rawUser.user_metadata?.username || rawUser.email?.split('@')[0] || 'Guest',
      ...rawUser
    };
  }, [rawUser.id, rawUser.email, rawUser.user_metadata?.username]);

  // Navigate and fetch users
  useEffect((): any => {
    if (!token) navigate('/login');

    const fetchUsers = async () => {
      try {
        const data = await apiService.get('/users/allusers');
        setUsers(data.users);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [navigate, user.id]);

  // Listen for incoming messages
  useEffect(() => {
    if (!socket || !selectedUser) return;

    const handleMessage = async (msg: any) => {
      const currentRoomId = [user.id, selectedUser.id].sort().join('_');
      if (msg.senderId !== user.id && msg.roomId === currentRoomId) {

        if (msg.signedFiles && msg.signedFiles.length > 0) {
          dispatch(addMessage(msg));
          return;
        }

        const filePaths = msg.files || msg.file || [];

        if (filePaths.length > 0) {
          const signedUrlResults = await Promise.all(
            filePaths.map(async (path: string) => {
              const { data } = await supabase
                .storage
                .from('Dev')
                .createSignedUrl(path, 86400);
              return data?.signedUrl;
            })
          );

          const signedFiles = signedUrlResults.filter((url): url is string => url !== undefined);
          dispatch(addMessage({ ...msg, signedFiles }));
        } else {
          dispatch(addMessage(msg));
        }
      }
    };

    socket.on('receive_message', handleMessage);

    return () => {
      socket.off('receive_message', handleMessage);
    };
  }, [socket, user.id, dispatch, selectedUser]);

  // Join room when selected user changes
  useEffect(() => {
    if (!socket || !selectedUser || !user.id) return;
    const roomId = [user.id, selectedUser.id].sort().join('_');
    socket.emit('join_room', roomId);
  }, [socket, selectedUser, user.id]);

  // Typing indicator
  const handleTyping = () => {
    if (!socket || !user.id || !selectedUser) return;
    const roomId = [user.id, selectedUser.id].sort().join('_');

    socket.emit('typing', { roomId });

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId });
    }, 2000);
  };

  // Typing indicator
  useEffect(() => {
    if (!socket) return;

    const onTyping = ({ from }: { from: string }) => {
      if (from !== user.id) setIsTyping(true);
    };

    const onStopTyping = ({ from }: { from: string }) => {
      if (from !== user.id) setIsTyping(false);
    };

    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [socket, user.id]);

  // Upload data
  useEffect(() => {
    if (!socket || !selectedUser) return;
    const roomId = [user.id, selectedUser.id].sort().join('_');
    socket.emit('upload_data', { roomId });
  }, [selectedUser])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !files?.length) || !socket || !selectedUser) return;
    setIsUploading(true);
    let fileUrls: string[] = [];

    try {
      if (files && files.length > 0) {
        const uploadPromises = files.map(async (file) => {
          try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await apiService.post('/upload/upload', formData);
            return response?.path;
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            return null;
          }
        });

        const uploadResults = await Promise.all(uploadPromises);

        fileUrls = uploadResults.filter((path): path is string => path !== null);

        if (fileUrls.length < files.length) {
          const failedCount = files.length - fileUrls.length;
          alert(`Warning: ${failedCount} file(s) failed to upload. Sending message with ${fileUrls.length} file(s).`);
        }
      }

      if (input.trim() || fileUrls.length > 0) {
        const roomId = [user.id, selectedUser.id].sort().join('_');

        // Generate signed URLs for uploaded files so images display immediately -- ADDED
        let signedFiles: string[] = [];
        if (fileUrls.length > 0) {
          const signedUrlResults = await Promise.all(
            fileUrls.map(async (path: string) => {
              const { data } = await supabase
                .storage
                .from('Dev')
                .createSignedUrl(path, 86400); // 24 hours expiry
              return data?.signedUrl;
            })
          );
          signedFiles = signedUrlResults.filter((url): url is string => url !== undefined);
        }

        const messageData = {
          roomId,
          content: input,
          files: fileUrls,
          signedFiles, // ADDED - include signed URLs for immediate display
          senderId: user.id,
          receiverId: selectedUser.id,
          username: user.username,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        dispatch(setMessages([...messages, messageData]));
        socket.emit('send_message', messageData);
        setInput('');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!socket || !selectedUser || !editMessage) return;
    try {
      const response = await apiService.put('/users/editmessage', { message: editMessage });
      if (response?.status === 200) {
        console.log(response, "sdfsadfdsafsafsafsfsfsdfsdf");
      }
      const newMessages = messages.map((m: any) => m.id === editMessage.id ? { ...m, content: editMessage.content } : m);
      dispatch(setMessages(newMessages));
      setEditOpen(false);
    }
    catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      {/* Sidebar / Contacts */}
      <Sidebar users={users} selectedUser={selectedUser} user={user} />
      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-3xl">
        {selectedUser ? (
          <>
            <ChatHeader selectedUser={selectedUser} />

            <MessagesList selectedUser={selectedUser} user={user} isTyping={isTyping} setEditOpen={setEditOpen} setEditMessage={setEditMessage} />

            {/* Message Input */}
            {!editOpen ? (
              <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-5 border-t dark:border-zinc-800 flex items-center gap-4 sticky bottom-0 z-10">
                <FileUploadDropzone value={files} onValueChange={setFiles} />
                <input
                  type="text"
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border-transparent border focus:border-blue-500 rounded-full px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 dark:text-white outline-none transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="Type a message..."
                  value={input}
                  onChange={(e: any) => { setInput(e.target.value); handleTyping(); }}
                />
                <button
                  type="submit"
                  disabled={isUploading || (!input.trim() && !files?.length)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:saturate-0 disabled:cursor-not-allowed text-white rounded-full p-3.5 flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95"
                >
                  {isUploading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Send size={20} className="mr-0.5 mt-0.5" />
                  )}
                </button>
              </form>
            ) : editOpen && (
              <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-5 border-t dark:border-zinc-800 flex items-center gap-4 sticky bottom-0 z-10">
                <FileUploadDropzone value={files} onValueChange={(newFiles) => setEditMessage({ ...editMessage, signedFiles: newFiles })} />
                <input
                  type="text"
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border-transparent border focus:border-blue-500 rounded-full px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 dark:text-white outline-none transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  placeholder="Type a message..."
                  value={editMessage?.content || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setEditMessage({ ...editMessage, content: e.target.value }); handleTyping(); }}
                />
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={isUploading || (!editMessage?.content?.trim() && !editMessage?.signedFiles?.length)}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:saturate-0 disabled:cursor-not-allowed text-white rounded-full p-3.5 flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95"
                >
                  {isUploading ? (
                    <span className="animate-spin">⏳</span>
                  ) : (
                    <Pencil size={20} className="mr-0.5 mt-0.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditOpen(false); setEditMessage(null) }}
                  className="bg-red-600/70 hover:bg-red-700 disabled:opacity-50 disabled:saturate-0 disabled:cursor-not-allowed text-white rounded-full p-3 flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95"
                >
                  <Cross size={25} className="mr-0 mt-0 rotate-45" />
                </button>
              </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500">
            <div className="w-28 h-28 bg-zinc-200 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-16 h-16 text-zinc-400 dark:text-zinc-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <p className="text-2xl font-medium">Select a contact to start chatting</p>
            <p className="text-md text-zinc-400 mt-1">Your conversations will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
export default Chat;
