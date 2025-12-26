import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { socket } from './services/socket';
import { supabase } from './lib/supabase.ts';
import { SocketProvider } from './context/SocketContext.tsx';
import { Provider } from 'react-redux';
import { store } from './store';

const Root = () => {
  useEffect(() => {
    const initsocket = async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        socket.auth = { token };
        socket.connect();
      }
    }
    initsocket();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        socket.auth = { token: session.access_token };
        if (!socket.connected) socket.connect();
      } else {
        socket.disconnect();
      }
    });
    return () => {
      subscription.unsubscribe();
      socket.disconnect();
    };

  }, []);
  return (
    <SocketProvider>
      <Provider store={store}>
        <App />
      </Provider>
    </SocketProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)