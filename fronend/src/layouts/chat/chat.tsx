import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/axios';
import { ArrowLeft, Send } from 'lucide-react';
import FileUploadDropzone from '@/components/fileUploader';
import { supabase } from '@/lib/supabase';

const Chat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [lastSeenChat, setLastSeenChat] = useState<any>([]);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const navigate = useNavigate();
  const sessionString = localStorage.getItem('sb-bivjfuifyqourtgzxrkj-auth-token');
  const session = sessionString ? JSON.parse(sessionString) : null;
  const rawUser = session?.user || {};
  const token = session?.access_token;
  const typingTimeoutRef = useRef<any>(null);
  const prevSelectedUser = useRef<any>(selectedUser);
  const [files, setFiles] = useState<File[] | null>(null);

  const user = {
    id: rawUser.id,
    email: rawUser.email,
    username: rawUser.user_metadata?.username || rawUser.email?.split('@')[0] || 'Guest',
    ...rawUser
  };

  // Navigate and fetch users
  useEffect((): any => {
    if (!token) navigate('/login');

    const fetchUsers = async () => {
      try {
        const data = await apiService.get('/users/allusers');
        setUsers(data.filter((u: any) => u.id !== user.id));
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [navigate, user.id]);

  const loadChatAndJoinRoom = async (userToChatWith: any) => {
    setSelectedUser(userToChatWith);
    setMessages([]);
    try {
      const roomId = [user.id, userToChatWith.id].sort().join('_');
      const historyData = await apiService.get(`/users/messages/${roomId}`);
      const enrichedMessages = await Promise.all(
        historyData.messages.map(async (msg: any) => {
          if (msg.file && msg.file.length > 0) {
            const signedFiles = await Promise.all(
              msg.file.map(async (path: string) => {
                const { data } = await supabase
                  .storage
                  .from('Dev')
                  .createSignedUrl(path, 86400);
                return data?.signedUrl;
              })
            );
            return { ...msg, signedFiles };
          }
          return msg;
        })
      );

      setMessages(enrichedMessages);

      const lastSeenData = historyData.lastSeen.find((u: any) => u.userId == user.id)?.lastSeen;
      if (lastSeenData) {
        const seen = new Date(lastSeenData).getTime();
        const cur = new Date().getTime();
        const diffInMs = Math.abs(cur - seen);
        const diffInMin = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

        if (diffInMin < 1) setLastSeenChat('Just now');
        else if (diffInHours < 1) setLastSeenChat(`${diffInMin} min ago`);
        else if (diffInDays < 1) setLastSeenChat(`${diffInHours} hours ago`);
        else if (diffInWeeks < 1) setLastSeenChat(`${diffInDays} days ago`);
        else setLastSeenChat(`${diffInWeeks} weeks ago`);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([]);
    }
  };

  // Socket connection
  useEffect(() => {
    if (!user.id) return;

    const newSocket = io('http://localhost:3001', {
      auth: { token },
    });

    newSocket.on('connect_error', (err: any) => {
      console.error("Socket connection error:", err.message);
    });

    newSocket.on('receive_message', async (msg: any) => {
      if (msg.file && msg.file.length > 0) {
        msg.signedFiles = await Promise.all(
          msg.file.map(async (path: string) => {
            const { data } = await supabase
              .storage
              .from('Dev')
              .createSignedUrl(path, 86400);
            return data?.signedUrl;
          })
        );
      }
      setMessages((prev) => [...prev, msg]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user.id]);

  // Join room
  useEffect(() => {
    if (socket && selectedUser && user.id) {
      const roomId = [user.id, selectedUser.id].sort().join('_');
      socket.emit('join_room', roomId);
    }
  }, [socket, selectedUser, user.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
  }, [socket]);

  // Update last seen
  useEffect(() => {
    if (!socket || !selectedUser) return;
    if (prevSelectedUser.current !== null) {
      const roomId = [user.id, prevSelectedUser.current.id].sort().join('_');
      socket.emit('lastseen', { userId: prevSelectedUser.current.id, roomId });
    }
    prevSelectedUser.current = selectedUser;
    setLastSeenChat('');
  }, [selectedUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !files?.length) || !socket || !selectedUser) return;
    let fileUrls: string[] = [];

    if (files && files.length > 0) {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiService.post('/upload/upload', formData);
        const path = response?.path;
        fileUrls.push(path);
      }
    }
    const roomId = [user.id, selectedUser.id].sort().join('_');
    const messageData = {
      roomId,
      message: input,
      files: fileUrls,
      senderId: user.id,
      receiverId: selectedUser.id,
      username: user.username,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    socket.emit('send_message', messageData);
    setInput('');
    setFiles([]);
  };

  return (
    <div className="flex h-screen bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
      {/* Sidebar / Contacts */}
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
              onClick={() => loadChatAndJoinRoom(u)}
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-zinc-50/50 dark:bg-zinc-950/50 backdrop-blur-3xl">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <header className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md shadow-sm p-4 border-b dark:border-zinc-800 flex items-center gap-3 z-10 sticky top-0">
              <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-600 to-indigo-800 flex items-center justify-center font-bold uppercase text-white shadow-md">
                {selectedUser.username.charAt(0)}
              </div>
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-tight">{selectedUser.username}</h2>
              </div>
            </header>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-600">
              {messages.map((msg, index) => {
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
                      <div className={`flex max-w-[85%] md:max-w-[70%] items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isMe && (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400 mb-1">
                            {selectedUser?.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}

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
                                {msg.message || msg.content}
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
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />

              {messages.find((msg) => msg.senderId === user.id) && lastSeenChat.length > 0 && (
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

            {/* Message Input */}
            <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-5 border-t dark:border-zinc-800 flex items-center gap-4 sticky bottom-0 z-10">
              <FileUploadDropzone value={files} onValueChange={setFiles} />
              <input
                type="text"
                className="flex-1 bg-zinc-100 dark:bg-zinc-800/50 border-transparent border focus:border-blue-500 rounded-full px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 dark:text-white outline-none transition-all duration-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => { setInput(e.target.value); handleTyping(); }}
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:saturate-0 disabled:cursor-not-allowed text-white rounded-full p-3.5 flex items-center justify-center transition-all shadow-lg shadow-blue-500/30 transform hover:scale-105 active:scale-95"
              >
                <Send size={20} className="mr-0.5 mt-0.5" />
              </button>
            </form>
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
  );
};

export default Chat;
