/**
 * Nexus AI — AI Assistant Section
 * 
 * Interactive premium AI chat workspace featuring conversation logs,
 * localStorage caching, automated titles, search filters, and full 
 * Gemini API / simulation hookup.
 */

import { useState, useEffect, useRef } from 'react'
import { sendMessageToGemini } from '../api/gemini'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import './AiAssistant.css'

/* ── Storage Key ── */
const STORAGE_KEY = 'nexus_chats'
const CHAR_LIMIT = 2000

/* ── Seed Conversation (First Visit Only) ── */
const SEED_CHAT = [
  {
    id: 'seed_core_1',
    title: '🤖 Core Neural Welcomer',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    lastUpdated: new Date().toISOString(),
    messages: [
      {
        id: 1,
        role: 'ai',
        text: `Hi, I'm Nexus AI.

I can help with coding, debugging, notes, analytics, and planning.

Try one:
- Generate a workspace report
- Create a task checklist
- Write a memo draft
- Debug a frontend or backend issue`,
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  }
]

/* ── Helpers ── */
const loadChats = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : SEED_CHAT
  } catch {
    return SEED_CHAT
  }
}

const saveChats = (chats) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
}

/* ─────────────────────────────────────────────────────────────
   React-Friendly Custom Markdown Parser (No External Deps)
   ───────────────────────────────────────────────────────────── */
function renderMarkdown(text, onCopy) {
  if (!text) return '';

  const lines = text.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLang = '';
  
  let inList = false;
  let listItems = [];
  let listKey = 0;

  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  let tableKey = 0;

  // Process text lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Fenced Code Blocks (Start / End)
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        const codeText = codeBlockLines.join('\n');
        const lang = codeBlockLang;
        elements.push(
          <div className="ai-code-block-wrapper" key={`code-${i}`}>
            <div className="ai-code-block-hdr">
              <span className="ai-code-lang">{lang}</span>
              <button 
                className="ai-code-copy-btn" 
                onClick={() => onCopy(codeText)}
                type="button"
              >
                Copy Code
              </button>
            </div>
            <pre>
              <code className={lang}>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3) || 'javascript';
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Unordered list items
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      // If we were in a table, close it
      if (inTable) {
        elements.push(renderTableBlock(tableHeaders, tableRows, `tbl-${tableKey++}`));
        inTable = false;
        tableHeaders = [];
        tableRows = [];
      }
      
      inList = true;
      listItems.push(parseInlines(line.trim().slice(2), `li-${i}`));
      continue;
    } else if (inList) {
      // Closing the list when we hit a non-list item
      elements.push(<ul key={`ul-${listKey++}`}>{listItems.map((item, idx) => <li key={idx}>{item}</li>)}</ul>);
      inList = false;
      listItems = [];
    }

    // Markdown Table Parser
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      
      // Check if it's a separator line (e.g. | :--- | :--- |)
      const isSeparator = cells.every(c => c.startsWith(':') || c.startsWith('-') || c.endsWith(':'));

      if (isSeparator) {
        // Separator, skip rendering but establish that we are in a table structure
        inTable = true;
        continue;
      }

      if (!inTable && tableHeaders.length === 0) {
        // First cell row = headers
        tableHeaders = cells;
        inTable = true;
      } else {
        // Data row
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Closing the table when we hit a non-table line
      elements.push(renderTableBlock(tableHeaders, tableRows, `tbl-${tableKey++}`));
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    // Headers & Paragraphs
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={`h3-${i}`}>{parseInlines(trimmed.slice(4), `h3i-${i}`)}</h3>);
    } else if (trimmed.startsWith('#### ')) {
      elements.push(<h4 key={`h4-${i}`}>{parseInlines(trimmed.slice(5), `h4i-${i}`)}</h4>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={`h2-${i}`}>{parseInlines(trimmed.slice(3), `h2i-${i}`)}</h2>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={`h1-${i}`}>{parseInlines(trimmed.slice(2), `h1i-${i}`)}</h1>);
    } else if (trimmed.length > 0) {
      // Normal paragraph text
      elements.push(<p key={`p-${i}`}>{parseInlines(trimmed, `pi-${i}`)}</p>);
    }
  }

  // Flush remaining blocks
  if (inList) {
    elements.push(<ul key={`ul-${listKey++}`}>{listItems.map((item, idx) => <li key={idx}>{item}</li>)}</ul>);
  }
  if (inTable) {
    elements.push(renderTableBlock(tableHeaders, tableRows, `tbl-${tableKey++}`));
  }

  return elements;
}

// Sub-helper to parse inlines like bold (**text**) and code tags (`code`)
function parseInlines(text, baseKey) {
  // First split by bold markers
  const boldParts = text.split('**');
  const boldElements = boldParts.map((part, index) => {
    // Alternate blocks are bold
    const isBold = index % 2 === 1;

    // Parse inline code inside this segment
    const codeParts = part.split('`');
    const codeElements = codeParts.map((subPart, subIdx) => {
      const isCode = subIdx % 2 === 1;
      if (isCode) {
        return <code key={`${baseKey}-c-${index}-${subIdx}`}>{subPart}</code>;
      }
      return subPart;
    });

    if (isBold) {
      return <strong key={`${baseKey}-b-${index}`}>{codeElements}</strong>;
    }
    return codeElements;
  });

  return boldElements;
}

// Sub-helper to render tables
function renderTableBlock(headers, rows, key) {
  return (
    <table key={key}>
      {headers.length > 0 && (
        <thead>
          <tr>
            {headers.map((h, idx) => <th key={idx}>{h}</th>)}
          </tr>
        </thead>
      )}
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={rowIdx}>
            {row.map((cell, cellIdx) => <td key={cellIdx}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main AI Assistant Section Component
   ───────────────────────────────────────────────────────────── */
export default function AiAssistantSection({ initialPrompt, setInitialPrompt }) {
  const [conversations, setConversations] = useState(loadChats)
  const [activeId, setActiveId]           = useState(() => {
    const list = loadChats()
    return list.length > 0 ? list[0].id : ''
  })
  const [searchQuery, setSearchQuery]     = useState('')
  const [chatInput, setChatInput]         = useState('')
  const [isTyping, setIsTyping]           = useState(false)
  const [typingStatus, setTypingStatus]   = useState('Synthesizing prompt context...')
  const [mobSidebar, setMobSidebar]       = useState(false)
  const [isCoolingDown, setIsCoolingDown] = useState(false)

  const chatEndRef = useRef(null)
  const textareaRef = useRef(null)
  const streamingTimersRef = useRef({})

  const toast = useToast()
  const { user } = useAuth() || {}

  // Clean up streams on unmount
  useEffect(() => {
    return () => {
      Object.values(streamingTimersRef.current).forEach(clearInterval)
    }
  }, [])

  // Typing status cycling effect
  useEffect(() => {
    if (!isTyping) return;
    const statuses = [
      'Synthesizing prompt context...',
      'Consulting neural database...',
      'Constructing response matrix...',
      'Optimizing response tokens...',
      'Rendering vector format...'
    ];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % statuses.length;
      setTypingStatus(statuses[idx]);
    }, 2000);
    return () => clearInterval(timer);
  }, [isTyping]);

  const streamResponse = (chatId, fullText) => {
    if (streamingTimersRef.current[chatId]) {
      clearInterval(streamingTimersRef.current[chatId])
    }

    return new Promise((resolve) => {
      const words = fullText.split(/(\s+)/)
      let currentText = ''
      let wordIdx = 0
      const messageId = Date.now() + 1

      // Insert empty bubble
      setConversations(prev => prev.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, {
              id: messageId,
              role: 'ai',
              text: '',
              timestamp: new Date().toISOString()
            }],
            lastUpdated: new Date().toISOString()
          }
        }
        return chat
      }))

      const timer = setInterval(() => {
        if (wordIdx >= words.length) {
          clearInterval(timer)
          delete streamingTimersRef.current[chatId]
          resolve()
          return
        }

        currentText += words[wordIdx]
        wordIdx++

        setConversations(prev => prev.map(chat => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: chat.messages.map(m => m.id === messageId ? { ...m, text: currentText } : m),
              lastUpdated: new Date().toISOString()
            }
          }
          return chat
        }))
      }, 15)

      streamingTimersRef.current[chatId] = timer
    })
  }

  const handleCopyText = (txt) => {
    if (!txt) return
    navigator.clipboard.writeText(txt)
    toast.success('Copied to clipboard! 📋')
  }

  const handleRegenerate = async (chatId) => {
    if (isTyping || isCoolingDown) return
    const chat = conversations.find(c => c.id === chatId)
    if (!chat || chat.messages.length < 2) return

    const messagesReversed = [...chat.messages].reverse()
    const lastUserIdx = messagesReversed.findIndex(m => m.role === 'user')
    if (lastUserIdx === -1) return

    const userMsgIdx = chat.messages.length - 1 - lastUserIdx
    const lastQueryText = chat.messages[userMsgIdx].text
    const historyContext = chat.messages.slice(0, userMsgIdx)

    const trimmedMessages = chat.messages.slice(0, userMsgIdx + 1)

    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          messages: trimmedMessages,
          lastUpdated: new Date().toISOString()
        }
      }
      return c
    }))

    setIsTyping(true)
    try {
      const aiReply = await sendMessageToGemini(lastQueryText, historyContext)
      await streamResponse(chatId, aiReply)
      toast.success('Response regenerated.')
    } catch (err) {
      console.error('Failed to regenerate response:', err)
      toast.error('Regeneration failed.')
    } finally {
      setIsTyping(false)
      setIsCoolingDown(true)
      setTimeout(() => setIsCoolingDown(false), 1000)
    }
  }

  // Persist chats to localStorage on changes
  useEffect(() => {
    saveChats(conversations)
  }, [conversations])

  // Auto-scroll on new messages or typing active status
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversations, isTyping, activeId])

  // Watch for dashboard redirects carrying initialPrompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleInitialPrompt(initialPrompt)
    }
  }, [initialPrompt])

  // Get active conversation object
  const activeChat = conversations.find(c => c.id === activeId)

  // Handle incoming prompts from Quick Actions in Dashboard
  const handleInitialPrompt = async (prompt) => {
    if (isTyping || isCoolingDown) return
    // 1. Clear prompt immediately to avoid double executions on tab toggles
    setInitialPrompt(null)

    let currentChatId = activeId
    let updatedConvs = [...conversations]

    // 2. Decide if we reuse an empty chat or create a new thread
    const isEmptyChat = !activeChat || activeChat.messages.length === 0;

    if (!isEmptyChat) {
      // Create a brand new chat for this prompt
      const newChat = {
        id: `conv_${Date.now()}`,
        title: `✦ ${prompt.slice(0, 20)}...`,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messages: []
      }
      updatedConvs = [newChat, ...updatedConvs]
      currentChatId = newChat.id
      setActiveId(newChat.id)
    }

    // 3. Queue the user query trigger inside this conversation
    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: prompt,
      timestamp: new Date().toISOString()
    }

    updatedConvs = updatedConvs.map(chat => {
      if (chat.id === currentChatId) {
        return {
          ...chat,
          title: chat.title.startsWith('New Chat') || chat.title.startsWith('✦ ') 
            ? `✦ ${prompt.slice(0, 22)}` 
            : chat.title,
          messages: [...chat.messages, userMsg],
          lastUpdated: new Date().toISOString()
        }
      }
      return chat
    })

    setConversations(updatedConvs)
    setIsTyping(true)

    // 4. Fire the prompt request through the Gemini helper
    try {
      const historyCtx = updatedConvs.find(c => c.id === currentChatId)?.messages.slice(0, -1) || []
      const aiReply = await sendMessageToGemini(prompt, historyCtx)
      await streamResponse(currentChatId, aiReply)
    } catch (e) {
      console.error(e)
    } finally {
      setIsTyping(false)
      setIsCoolingDown(true)
      setTimeout(() => {
        setIsCoolingDown(false)
      }, 1000)
    }
  }

  // Start a fresh, clean chat thread
  const handleNewChat = () => {
    const newChat = {
      id: `conv_${Date.now()}`,
      title: 'New Chat Thread ✦',
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messages: []
    }
    setConversations(prev => [newChat, ...prev])
    setActiveId(newChat.id)
    setChatInput('')
    setMobSidebar(false)
    setTimeout(() => textareaRef.current?.focus(), 100)
  }

  // Delete a specific conversation thread
  const handleDeleteChat = (e, id) => {
    e.stopPropagation() // Prevent selecting active state on click
    const filtered = conversations.filter(c => c.id !== id)
    setConversations(filtered)

    // Re-route active ID if deleted thread was highlighted
    if (activeId === id) {
      if (filtered.length > 0) {
        setActiveId(filtered[0].id)
      } else {
        // Force create a clean replacement thread if all chats are gone
        const replacement = {
          id: `conv_${Date.now()}`,
          title: 'New Chat Thread ✦',
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          messages: []
        }
        setConversations([replacement])
        setActiveId(replacement.id)
      }
    }
  }

  // Delete all messages inside the active conversation
  const handleClearMessages = () => {
    if (!activeChat || activeChat.messages.length === 0) return
    if (window.confirm('Clear all conversation logs in this thread?')) {
      setConversations(prev => prev.map(c => {
        if (c.id === activeId) {
          return { ...c, messages: [], lastUpdated: new Date().toISOString() }
        }
        return c
      }))
    }
  }

  // Send input trigger
  const handleSend = async (e) => {
    e?.preventDefault()
    if (!chatInput.trim() || isTyping || isCoolingDown) return

    const promptText = chatInput.trim()

    // Prevent duplicate submissions: check if the last message in this active chat is a user message with the exact same text
    if (activeChat && activeChat.messages.length > 0) {
      const lastMsg = activeChat.messages[activeChat.messages.length - 1]
      if (lastMsg && lastMsg.role === 'user' && lastMsg.text.trim() === promptText) {
        console.warn('[Nexus AI] Duplicate prompt ignored to avoid redundant requests.')
        return
      }
    }

    setChatInput('') // Clear input immediately for optimal UX

    // Reset textarea sizing
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    }

    // Optimistically push user bubble to state
    let updatedConvs = conversations.map(chat => {
      if (chat.id === activeId) {
        // Auto-titles if the thread is currently unnamed
        const currentTitle = chat.title.startsWith('New Chat') 
          ? `✦ ${promptText.slice(0, 22)}` 
          : chat.title;

        return {
          ...chat,
          title: currentTitle,
          messages: [...chat.messages, userMsg],
          lastUpdated: new Date().toISOString()
        }
      }
      return chat
    })

    setConversations(updatedConvs)
    setIsTyping(true)

    // Call API helper
    try {
      const historyContext = updatedConvs.find(c => c.id === activeId)?.messages.slice(0, -1) || []
      const aiReply = await sendMessageToGemini(promptText, historyContext)
      await streamResponse(activeId, aiReply)
    } catch (error) {
      console.error(error)
    } finally {
      setIsTyping(false)
      setIsCoolingDown(true)
      setTimeout(() => {
        setIsCoolingDown(false)
      }, 1000)
    }
  }

  // Trigger Send on Enter keypress (Shift+Enter adds new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Auto-resize textarea to fit text lines
  const handleTextareaChange = (e) => {
    setChatInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  // Filter conversations matching search keyword
  const filteredConvs = conversations.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Environment checks to show corresponding API Status indicators
  const isRealApiKeyActive = import.meta.env.VITE_GEMINI_API_KEY && import.meta.env.VITE_GEMINI_API_KEY.trim().length > 0;

  return (
    <div className="ai-root">
      
      {/* Mobile Drawer Overlay */}
      {mobSidebar && (
        <div 
          style={{ position:'absolute', inset:0, zIndex:9, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }} 
          onClick={() => setMobSidebar(false)}
        />
      )}

      {/* ══════════ SIDEBAR: History Logs ══════════ */}
      <aside className={`ai-panel ai-sidebar ${mobSidebar ? 'mob-open' : ''}`}>
        
        {/* Sidebar Header & Create controls */}
        <div className="ai-sidebar-hdr">
          <button className="ai-new-chat-btn" onClick={handleNewChat}>
            <span>✦</span> New Conversation
          </button>
          
          {/* Conversation Search Bar */}
          <div className="ai-search-wrap">
            <span className="ai-search-ico">🔍</span>
            <input 
              type="text" 
              className="ai-search-input" 
              placeholder="Search history..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="ai-history-list">
          {filteredConvs.map(c => (
            <div 
              key={c.id} 
              className={`ai-history-item ${activeId === c.id ? 'active' : ''}`}
              onClick={() => { setActiveId(c.id); setMobSidebar(false); }}
            >
              <div className="ai-item-body">
                <span className="ai-item-title">{c.title}</span>
                <span className="ai-item-time">
                  {new Date(c.lastUpdated).toLocaleDateString('en-US', { month:'short', day:'numeric' })} at{' '}
                  {new Date(c.lastUpdated).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}
                </span>
              </div>
              
              {/* Delete conversation bubble action */}
              <button 
                className="ai-del-btn" 
                onClick={(e) => handleDeleteChat(e, c.id)}
                title="Delete thread"
              >
                ✕
              </button>
            </div>
          ))}

          {filteredConvs.length === 0 && (
            <div className="ai-sidebar-empty">
              <span className="ai-sidebar-empty-icon">⬡</span>
              <p className="ai-sidebar-empty-txt">No logs found</p>
            </div>
          )}
        </div>
      </aside>

      {/* ══════════ MAIN: Chat Window ══════════ */}
      <main className="ai-panel ai-main-chat">
        
        {/* Chat Window Header */}
        <header className="ai-chat-hdr">
          <div className="ai-chat-hdr-left">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              
              {/* Mobile Sidebar burger toggle */}
              <button className="ai-sidebar-toggle" onClick={() => setMobSidebar(true)} title="Conversation List">
                ☰
              </button>
              
              <h2 className="ai-chat-title">{activeChat?.title || 'Nexus AI Assistant'}</h2>
            </div>
            
            {/* Status node */}
            <div className="ai-chat-status">
              {isRealApiKeyActive ? (
                <div className="ai-status-indicator live" title="Direct API client active">
                  <span className="ai-status-dot" />
                  <span>Gemini API Node</span>
                  {import.meta.env.DEV && (
                    <span style={{ fontSize: '0.65rem', opacity: 0.7, padding: '1px 4px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', borderRadius: '3px', marginLeft: '6px' }}>DEV</span>
                  )}
                </div>
              ) : (
                <div className="ai-status-indicator simulated" title="Operating with local mock response models">
                  <span className="ai-status-dot" />
                  <span>Local Neural Sync (Simulated)</span>
                  {import.meta.env.DEV && (
                    <span style={{ fontSize: '0.65rem', color: '#a855f7', padding: '1px 4px', background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '3px', marginLeft: '6px', fontWeight: 'bold' }}>Local Neural Mode</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="ai-chat-hdr-right">
            {activeChat && activeChat.messages.length > 0 && (
              <button className="ai-action-btn" onClick={handleClearMessages}>
                Clear logs
              </button>
            )}
          </div>
        </header>

        {/* Messages Body */}
        <div className="ai-messages-wrap">
          {activeChat && activeChat.messages.length > 0 ? (
            activeChat.messages.map((m, idx) => {
              const isLast = idx === activeChat.messages.length - 1
              return (
                <div key={m.id} className={`ai-msg-row ${m.role}`}>
                  
                  {/* AI Avatar */}
                  {m.role === 'ai' && (
                    <div className="ai-msg-av-box" title="Nexus AI Core">
                      🤖
                    </div>
                  )}

                  <div className="ai-bubble">
                    {/* Process rich markdown custom styling elements */}
                    {m.role === 'ai' ? (
                      <>
                        {renderMarkdown(m.text, handleCopyText)}
                        <div className="ai-bubble-actions">
                          <button 
                            className="ai-bubble-action-btn"
                            onClick={() => handleCopyText(m.text)}
                            type="button"
                          >
                            📋 Copy Reply
                          </button>
                          {isLast && (
                            <button 
                              className="ai-bubble-action-btn"
                              onClick={() => handleRegenerate(activeId)}
                              type="button"
                            >
                              🔄 Regenerate
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <p>{m.text}</p>
                    )}
                    
                    {/* Timestamp */}
                    <span className="ai-bubble-time">
                      {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {m.role === 'user' && (
                    <div className="ai-msg-av-box" title={user?.fullName || 'User'}>
                      {(user?.fullName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            
            /* Empty Chat State Prompt Suggestions */
            <div className="ai-empty-state">
              <div className="ai-empty-orb-wrap">
                <div className="ai-empty-orb" />
                <div className="ai-empty-orb-icon">✨</div>
              </div>
              <h3 className="ai-empty-title">Initiate Neural Sync</h3>
              <p className="ai-empty-sub">
                Ask Nexus AI anything to optimize tasks, compile reports, refactor code modules, or schedule calendar priorities.
              </p>
              
              <div className="ai-starter-grid">
                {[
                  { title: '📊 Generate Report', desc: 'SaaS system latency and operational telemetry.', text: 'Generate a system performance report' },
                  { title: '✦ Create Task List', desc: 'Optimize daily refactoring action items.', text: 'Create a task list for building React route guards' },
                  { title: '📝 Write Memo', desc: 'Sleek system-design memo draft.', text: 'Write a memo synchronization draft for our dev team' },
                  { title: '⚡ Refactor Code', desc: 'Secure localStorage React custom hook.', text: 'Write a React custom hook function to sync states with localStorage' },
                ].map((chip, idx) => (
                  <button 
                    key={idx} 
                    className="ai-starter-chip"
                    onClick={() => { setChatInput(chip.text); textareaRef.current?.focus(); }}
                  >
                    <span className="ai-starter-title">{chip.title}</span>
                    <span className="ai-starter-desc">{chip.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Typing Loading Animation */}
          {isTyping && (
            <div className="ai-msg-row ai">
              <div className="ai-msg-av-box">🤖</div>
              <div className="ai-bubble" style={{ background: 'rgba(0, 212, 255, 0.03)', border: '1px dashed rgba(0, 212, 255, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="ai-typing-indicator" style={{ display: 'inline-flex', padding: 0 }}>
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                    <span className="ai-typing-dot" />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: 'rgba(0, 212, 255, 0.85)', fontFamily: 'Space Mono' }}>
                    {typingStatus}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Auto scroll anchor */}
          <div ref={chatEndRef} />
        </div>

        {/* Input Control Box */}
        <div className="ai-input-area">
          <form className="ai-input-box" onSubmit={handleSend}>
            
            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              className="ai-textarea"
              placeholder={isCoolingDown ? "Synchronizing system neural links..." : "Query Nexus AI Assistant..."}
              rows={1}
              value={chatInput}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              maxLength={CHAR_LIMIT}
              disabled={isTyping || isCoolingDown}
            />

            {/* Actions: limit counters & send triggers */}
            <div className="ai-input-actions">
              <span className={`ai-char-counter ${
                chatInput.length > CHAR_LIMIT * 0.95 ? 'limit' : 
                chatInput.length > CHAR_LIMIT * 0.8 ? 'warning' : ''
              }`}>
                {chatInput.length}/{CHAR_LIMIT}
              </span>
              
              <button 
                type="submit" 
                className="ai-send-btn" 
                disabled={!chatInput.trim() || isTyping || isCoolingDown}
                title="Send query"
              >
                ⟶
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  )
}
