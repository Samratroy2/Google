import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { recommendTasksForVolunteer } from '../utils/aiEngine';
import { TYPE_ICONS } from '../data/mockData';
import Button from '../components/UI/Button';
import styles from './ChatbotPage.module.css';

const SUGGESTED = [
  'I need food help urgently',
  'How do I register as a volunteer?',
  'Show me nearby needs',
  'How does AI matching work?',
  'I need medical help',
  'What is demand prediction?',
];

function getReply(text, needs, volunteers) {
  const t = text.toLowerCase();

  if (/food|meal|eat|hunger|water|drink/.test(t))
    return `I can help with food/water needs! 🍱\n\nGo to **Needs** tab and click **"+ Post Need"**, or use the AI classifier — just type your need in plain English and AI will auto-detect the category and urgency.\n\nCurrently there are **${needs.filter(n => n.type === 'Food' && n.status === 'Pending').length}** pending food requests in the system.`;

  if (/doctor|medical|medicine|hospital|sick|hurt|injur/.test(t))
    return `For medical emergencies, go to **Needs → Post Need** and select type "Medical" with urgency "Critical".\n\nWe have **${volunteers.filter(v => v.skill === 'Doctor' && v.available).length}** available doctors registered right now. Our AI will match the nearest and best-fit doctor instantly. 🏥`;

  if (/register|volunteer|sign up|join/.test(t))
    return `To register as a volunteer:\n\n1. Go to the **Volunteers** tab\n2. Click **"+ Register Volunteer"**\n3. Fill in your name, skill, location and availability\n\nYou'll immediately appear in AI match results for suitable needs nearby! 🙋`;

  if (/match|assign|ai match|how.*match/.test(t))
    return `Our AI Matching Engine scores each volunteer for a need on a **0–100% scale** using:\n\n• **Skill match** (40%) — does the volunteer have the right skill?\n• **Distance** (30%) — how close are they?\n• **Urgency bonus** (20%) — critical needs get priority\n• **Experience** (10%) — past task count\n\nClick **"AI Match"** on any pending need to see ranked results instantly! 🤖`;

  if (/predict|demand|forecast|future/.test(t))
    return `The **Demand Predictor** analyses historical need patterns in each area to forecast future requirements — for example: "Area X likely needs food tomorrow (87%)"\n\nThis helps NGOs **pre-position resources** before requests arrive. You can see predictions on the **Dashboard**. 🔮`;

  if (/nearby|map|location/.test(t))
    return `Head to the **Live Map** tab 🗺️ to see:\n\n• 🔴 Red circles = Active needs (size = urgency)\n• 🟢 Green triangles = Available volunteers\n\nClick any marker to see details. You can toggle layers on/off.`;

  if (/help|what|how|guide|options/.test(t))
    return `Here's what I can help you with:\n\n📋 **Post a need** — go to Needs tab\n🙋 **Register as volunteer** — go to Volunteers tab\n🗺️ **See the live map** — go to Map tab\n📊 **Check dashboard stats** — go to Dashboard\n🤖 **AI matching** — click "AI Match" on any need\n\nWhat would you like to do?`;

  if (/shelter|home|house|displaced/.test(t))
    return `For shelter needs, post under the **Shelter** category on the Needs page. 🏠\n\nCurrently **${needs.filter(n => n.type === 'Shelter' && n.status === 'Pending').length}** shelter requests are open. Our logistics volunteers and helpers will be matched automatically.`;

  if (/status|update|complete|done/.test(t))
    return `Volunteers and NGOs can update task status directly from the **Needs** page:\n\n• Click **"Assign"** to assign a volunteer\n• Click **"✅ Complete"** when done\n\nThe Admin Dashboard updates in real-time. 📊`;

  return `I understand you need assistance! Try describing your situation, for example:\n\n• *"We need food for 50 families urgently"*\n• *"Need a doctor in Block B"*\n\nOr type **"help"** to see all options. I'm here to guide you! 🤖`;
}

function Message({ msg }) {
  const isBot = msg.from === 'bot';
  return (
    <div className={`${styles.msgWrap} ${isBot ? styles.bot : styles.user}`}>
      {isBot && <div className={styles.botAvatar}>🤖</div>}
      <div className={`${styles.bubble} ${isBot ? styles.botBubble : styles.userBubble}`}>
        {msg.text.split('\n').map((line, i) => {
          // Bold **text**
          const parts = line.split(/\*\*(.*?)\*\*/g);
          return (
            <p key={i} style={{ margin: '2px 0' }}>
              {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
            </p>
          );
        })}
        <div className={styles.msgTime}>{msg.time}</div>
      </div>
    </div>
  );
}

function ChatbotPage() {
  const { needs, volunteers } = useApp();
  const [messages, setMessages] = useState([
    {
      from: 'bot',
      text: 'Hello! I\'m your SmartAid AI Assistant 🤖\n\nI can help you post needs, find volunteers, understand AI matching, and navigate the system.\n\nHow can I help you today?',
      time: 'Now',
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');

    const userMsg = { from: 'user', text: msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setMessages(m => [...m, userMsg]);
    setTyping(true);

    setTimeout(() => {
      const reply = getReply(msg, needs, volunteers);
      setMessages(m => [...m, { from: 'bot', text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setTyping(false);
    }, 800 + Math.random() * 400);
  };

  const topNeeds = needs.filter(n => n.status === 'Pending').slice(0, 3);

  return (
    <div className={styles.page}>
      <div className={styles.chatCol}>
        <div className={styles.chatHeader}>
          <div className={styles.chatHeaderAvatar}>🤖</div>
          <div>
            <div className={styles.chatHeaderName}>SmartAid Assistant</div>
            <div className={styles.chatHeaderStatus}><span className={styles.onlineDot} /> Online · AI-powered</div>
          </div>
        </div>

        <div className={styles.messages}>
          {messages.map((m, i) => <Message key={i} msg={m} />)}
          {typing && (
            <div className={`${styles.msgWrap} ${styles.bot}`}>
              <div className={styles.botAvatar}>🤖</div>
              <div className={`${styles.bubble} ${styles.botBubble} ${styles.typingBubble}`}>
                <span className={styles.dot1}>●</span>
                <span className={styles.dot2}>●</span>
                <span className={styles.dot3}>●</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className={styles.inputRow}>
          <input
            className={styles.inputBox}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Type your message…"
          />
          <button className={styles.sendBtn} onClick={() => send()}>➤</button>
        </div>

        <div className={styles.suggestions}>
          {SUGGESTED.map(s => (
            <button key={s} className={styles.suggChip} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      </div>

      {/* Side panel */}
      <div className={styles.sidePanel}>
        <div className={styles.panelCard}>
          <h3 className={styles.panelTitle}>⚡ Urgent Needs</h3>
          {topNeeds.length === 0 && <p className={styles.panelEmpty}>No pending needs</p>}
          {topNeeds.map(n => (
            <div key={n.id} className={styles.panelItem} onClick={() => send(`Tell me about ${n.type} needs`)}>
              <span>{TYPE_ICONS[n.type]}</span>
              <div>
                <div className={styles.panelItemTitle}>{n.title}</div>
                <div className={styles.panelItemMeta}>{n.location} · {n.urgency}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.panelCard}>
          <h3 className={styles.panelTitle}>🤖 Quick Actions</h3>
          {[
            ['Post a need', () => send('How do I post a need?')],
            ['Register volunteer', () => send('How do I register as a volunteer?')],
            ['AI matching explained', () => send('How does AI matching work?')],
            ['View demand predictions', () => send('What is demand prediction?')],
          ].map(([label, fn]) => (
            <button key={label} className={styles.quickBtn} onClick={fn}>{label} →</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatbotPage;
