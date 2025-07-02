import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Chatbot() {
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/';
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/chatbot', { message });
      setConversations([...conversations, { message, response: response.data.response }]);
      setMessage('');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>Chatbot</h1>
      <form onSubmit={handleSubmit}>
        <label>Message:</label>
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} />
        <br />
        <button type="submit">Send</button>
      </form>
      <ul>
        {conversations.map((conversation, index) => (
          <li key={index}>
            <p>You: {conversation.message}</p>
            <p>Chatbot: {conversation.response}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Chatbot;