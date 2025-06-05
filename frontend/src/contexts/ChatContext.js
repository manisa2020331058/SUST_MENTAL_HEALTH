// src/contexts/ChatContext.js
import React, { createContext, useState, useEffect } from 'react';
import io from 'socket.io-client';
import { jwtDecode } from 'jwt-decode'; // npm install jwt-decode

const SOCKET_URL = 'http://localhost:5000';
export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // Safe decoding
    if (token && token.split('.').length === 3) {
      try {
        const decoded = jwtDecode(token);
        setUserId(decoded.id); // Assuming your token has user ID stored as 'id'

        const newSocket = io(SOCKET_URL, {
          auth: { token }
        });

        setSocket(newSocket);
        newSocket.emit('join', decoded.id);

        // Socket listeners
        newSocket.on('message', (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
        });

        return () => newSocket.close();
      } catch (err) {
        console.error("Token decode error:", err.message);
      }
    } else {
      console.warn("Missing or invalid token. Skipping socket connection.");
    }
  }, []);

  const sendMessage = (recipientId, content) => {
    if (socket && userId) {
      socket.emit('sendMessage', {
        sender: userId,
        recipient: recipientId,
        content
      });
    }
  };

  return (
    <ChatContext.Provider value={{ socket, messages, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = React.useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
