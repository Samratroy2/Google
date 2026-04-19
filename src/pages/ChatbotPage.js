import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import styles from './ChatbotPage.module.css';

const SUGGESTED = [
  'Need food for 20 people urgently',
  'Find doctor near me',
  'I am an NGO',
  'Show available volunteers',
  'How does AI matching work?',
  'Help'
];

// ---------------- MESSAGE COMPONENT ----------------
function Message({ msg }) {
  const isBot = msg.from === 'bot';

  return (
    <div className={`${styles.msgWrap} ${isBot ? styles.bot : styles.user}`}>
      {isBot && <div className={styles.botAvatar}>🤖</div>}

      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {msg.text.split('\n').map((line, i) => {
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} style={{ margin: '2px 0' }}>
              {parts.map((p, j) =>
                j % 2 === 1 ? <strong key={j}>{p}</strong> : p
              )}
            </p>
          );
        })}

        <div className={styles.msgTime}>{msg.time}</div>
      </div>
    </div>
  );
}

// ---------------- MAIN COMPONENT ----------------
function ChatbotPage() {
  // ✅ FIX: use users instead of volunteers
  const { needs, users } = useApp();

  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text:
        'Hello! I’m SmartAid AI 🤖\n\nI can help you:\n• Post needs\n• Find volunteers\n• Assist NGOs\n\nTell me what you need.',
      time: 'Now'
    }
  ]);

  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);

  const endRef = useRef(null);

  // Auto scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  // ---------------- SEND MESSAGE ----------------
  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;

    setInput('');
    setError(null);

    const userMsg = {
      from: 'user',
      text: msg,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    setMessages((m) => [...m, userMsg]);
    setTyping(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

        // ✅ FIX: send users instead of volunteers
        body: JSON.stringify({
          message: msg,
          needs,
          users
        })
      });

      if (!res.ok) throw new Error('Server error');

      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text: data.reply || 'No response from AI.',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ]);
    } catch (err) {
      console.error(err);

      setError('AI connection failed');

      setMessages((m) => [
        ...m,
        {
          from: 'bot',
          text:
            '⚠️ Unable to connect to AI service.\n\nMake sure backend is running on port 5000.',
          time: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      ]);
    }

    setTyping(false);
  };

  // ---------------- UI ----------------
  return (
    <div className={styles.page}>
      <div className={styles.chatCol}>

        {/* HEADER */}
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderAvatar}>🤖</div>
          <div>
            <div className={styles.chatHeaderName}>SmartAid Assistant</div>
            <div className={styles.chatHeaderStatus}>
              <span className={styles.onlineDot} />
              Online · AI-powered
            </div>
          </div>
        </div>

        {/* MESSAGES */}
        <div className={styles.messages}>
          {messages.map((m, i) => (
            <Message key={i} msg={m} />
          ))}

          {typing && (
            <div className={`${styles.msgWrap} ${styles.bot}`}>
              <div className={styles.botAvatar}>🤖</div>
              <div className={`${styles.bubble} ${styles.botBubble}`}>
                Typing...
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* ERROR */}
        {error && (
          <div className={styles.errorBanner}>
            ⚠️ {error}
          </div>
        )}

        {/* INPUT */}
        <div className={styles.inputRow}>
          <input
            className={styles.inputBox}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Describe your need..."
          />
          <button className={styles.sendBtn} onClick={() => send()}>
            ➤
          </button>
        </div>

        {/* SUGGESTIONS */}
        <div className={styles.suggestions}>
          {SUGGESTED.map((s) => (
            <button
              key={s}
              className={styles.suggChip}
              onClick={() => send(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;