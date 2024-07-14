"use client"; // Add this directive to mark the component as a client component

import { useState } from 'react';
import axios from 'axios';
import '../../public/styles.css'; // Ensure this path is correct

export default function Home() {
  const [message, setMessage] = useState('');
  const [npcName, setNpcName] = useState('');
  const [chat, setChat] = useState([]);

  const sendMessage = async () => {
    if (!message || !npcName) return;

    const userMessage = { user: 'You', text: message };
    setChat([...chat, userMessage]);

    try {
      const response = await axios.post('http://localhost:3000/api/chat', { message, npcName });
      const botMessage = { user: npcName, text: response.data.botMessageContent };
      setChat([...chat, userMessage, botMessage]);
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="terminal">
      <h1>Gravedust Chat</h1>
      <div className="chat-window">
        {chat.map((msg, index) => (
          <div key={index} className="chat-message">
            <strong>{msg.user}:</strong> <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="input-area">
        <div className="input-prompt">NPC Name: </div>
        <input
          type="text"
          value={npcName}
          onChange={(e) => setNpcName(e.target.value)}
          className="input-field"
        />
      </div>
      <div className="input-area">
        <div className="input-prompt">&gt;</div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => (e.key === 'Enter' ? sendMessage() : null)}
          className="input-field"
        />
      </div>
    </div>
  );
}
