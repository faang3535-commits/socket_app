import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../../services/axios';

const Chat = () => {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiService.get('/users/allusers'); 
                setUsers(data); 
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };
        if (localStorage.getItem('token')) {
            fetchUsers();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (!user.id) return;

        const newSocket = io('http://localhost:3001');
        setSocket(newSocket);

        newSocket.on('receive_message', (msg: any) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && selectedUser && user.id) {
            const roomId = [user.id, selectedUser.id].sort().join('_');
            
            socket.emit('join_room', roomId);
            console.log('Joined room:', roomId);

            setMessages([]);
        }
    }, [socket, selectedUser, user.id]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input && socket && selectedUser) {
            const roomId = [user.id, selectedUser.id].sort().join('_');
            const messageData = {
                roomId,
                message: input,
                senderId: user.id,
                receiverId: selectedUser.id,
                username: user.username,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            
            socket.emit('send_message', messageData);
            setInput('');
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
            
            <aside className="w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                    <span className="font-bold text-lg dark:text-white">Contacts</span>
                    <button
                        onClick={() => {
                            localStorage.clear();    
                            navigate('/login'); 
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                        Logout
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {users.map((u) => (
                        <div
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3 
                            ${selectedUser?.id === u.id ? 'bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-500' : ''}`}
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold uppercase">
                                {u.username.charAt(0)}
                            </div>
                            <span className="text-gray-900 dark:text-gray-200 font-medium">{u.username}</span>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b dark:border-gray-700 flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 mr-3 flex items-center justify-center text-sm font-bold uppercase">
                                {selectedUser.username.charAt(0)}
                            </div>
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{selectedUser.username}</h2>
                        </header>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                            {messages.map((msg, index) => {
                                const isMe = msg.senderId === user.id;
                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[70%] px-4 py-2 rounded-2xl shadow-sm relative ${
                                                isMe
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-bl-none'
                                            }`}
                                        >
                                            {!isMe && (
                                                <div className="text-[10px] text-gray-400 mb-1 opacity-75">
                                                    {msg.username}
                                                </div>
                                            )}
                                            <p className="text-sm">{msg.message}</p>
                                            <span className={`text-[10px] block mt-1 text-right opacity-75 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                                {msg.time}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex gap-2">
                            <input
                                type="text"
                                className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-5 py-3 focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
                                placeholder="Type a message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <button
                                type="submit"
                                disabled={!input.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full p-3 w-12 h-12 flex items-center justify-center transition-all shadow-md transform active:scale-95"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-1">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900">
                        <div className="w-24 h-24 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                            </svg>
                        </div>
                        <p className="text-xl font-medium">Select a contact to start chatting</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Chat;
