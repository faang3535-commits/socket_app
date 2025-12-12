import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }

    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('chat message', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input && socket) {
      const messageData = {
        text: input,
        username: user.username,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      socket.emit('chat message', messageData);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Live Chat</h1>
        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
          }}
          className="text-sm text-red-500 hover:text-red-700 font-medium"
        >
          Logout
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => {
          const isMe = msg.username === user.username;
          return (
            <div
              key={index}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
                }`}
              >
                {!isMe && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {msg.username}
                  </div>
                )}
                <p className="text-sm">{msg.text}</p>
                <div className={`text-xs mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-4 border-t dark:border-gray-700 shadow-lg">
        <div className="flex space-x-2 max-w-4xl mx-auto">
          <input
            type="text"
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:text-white"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 px-6 font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
