import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Bot,
  Check,
  Clipboard,
  LoaderCircle,
  MessageCircle,
  PanelLeft,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import './App.css'

type MessageRole = 'user' | 'model'

type ChatMessage = {
  id: string
  role: MessageRole
  text: string
}

type GenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
  error?: {
    message?: string
  }
}

const MODEL_NAME = 'gemma-4-31b-it'
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent`

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: "Hello. I'm Gemma, ready when you are. What's on your mind?",
}

const QUICK_PROMPTS = [
  'Help me think through a tricky decision',
  'Turn a rough idea into a clear plan',
  'Explain a complex topic simply',
]

const createMessage = (role: MessageRole, text: string): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  role,
  text,
})

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const conversationEndRef = useRef<HTMLDivElement>(null)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  const isConfigured = Boolean(apiKey)

  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleReset = () => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setMessages([WELCOME_MESSAGE])
    setInput('')
    setError(null)
    setIsLoading(false)
    setIsSidebarOpen(false)
    composerRef.current?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedInput = input.trim()

    if (!trimmedInput || isLoading) {
      return
    }

    if (!apiKey) {
      setError('Add VITE_GEMINI_API_KEY to .env.local before sending a message.')
      return
    }

    const userMessage = createMessage('user', trimmedInput)
    const history = [...messages.filter((message) => message.id !== 'welcome'), userMessage]
    const controller = new AbortController()

    abortControllerRef.current = controller
    setMessages((currentMessages) => [...currentMessages, userMessage])
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch(`${API_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: history.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 768,
          },
        }),
        signal: controller.signal,
      })
      const result = (await response.json()) as GenerateContentResponse

      if (!response.ok) {
        throw new Error(result.error?.message ?? `Request failed with status ${response.status}.`)
      }

      const answer = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? '')
        .join('')
        .trim()

      if (!answer) {
        throw new Error('Gemma returned an empty response. Try sending your message again.')
      }

      setMessages((currentMessages) => [...currentMessages, createMessage('model', answer)])
    } catch (requestError) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong while contacting Google AI Studio.',
      )
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setIsLoading(false)
      }
    }
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  const handleCopy = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopiedMessageId(message.id)
      window.setTimeout(() => setCopiedMessageId(null), 1600)
    } catch {
      setError('Copying is unavailable in this browser.')
    }
  }

  const handlePromptSelect = (prompt: string) => {
    setInput(prompt)
    composerRef.current?.focus()
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-mark" aria-hidden="true">
            <Sparkles size={18} strokeWidth={2.3} />
          </div>
          <div className="brand-copy">
            <span className="brand-name">AI studio</span>
            <span className="brand-subtitle">Gemma workspace</span>
          </div>
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setIsSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <button type="button" className="new-chat-button" onClick={handleReset}>
          <Plus size={17} />
          <span>New conversation</span>
        </button>

        <div className="sidebar-section">
          <span className="sidebar-label">Current model</span>
          <div className="model-card">
            <div className={`status-dot ${isConfigured ? 'is-ready' : 'is-missing'}`} />
            <div className="model-card-copy">
              <strong>{MODEL_NAME}</strong>
              <span>{isConfigured ? 'Ready to chat' : 'API key needed'}</span>
            </div>
            <Bot size={19} className="model-icon" />
          </div>
        </div>

        <div className="sidebar-note">
          <MessageCircle size={16} />
          <p>One focused conversation at a time.</p>
        </div>
        <div className="sidebar-footer">
          <div className="session-avatar">Y</div>
          <div>
            <strong>Local session</strong>
            <span>Browser only</span>
          </div>
        </div>

      </aside>

      {isSidebarOpen && (
        <button
          type="button"
          className="sidebar-scrim"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button menu-button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <PanelLeft size={19} />
            </button>
            <div className="breadcrumb" aria-label="Current location">
              <span>Workspace</span>
              <span className="breadcrumb-slash">/</span>
              <strong>New conversation</strong>
            </div>
          </div>
          <button type="button" className="clear-button" onClick={handleReset}>
            <Trash2 size={16} />
            <span>Clear</span>
          </button>
        </header>

        <main className="chat-panel">
          <section className="chat-intro">
            <div className="intro-kicker">
              <span className="pulse-dot" />
              Live model
            </div>
            <h1>Ask Gemma <span>anything.</span></h1>
            <div className="intro-meta">
              <Sparkles size={15} />
              <span>{MODEL_NAME}</span>
              <span className="meta-divider">•</span>
              <span>Google AI Studio</span>
            </div>
          </section>

          <section className="conversation" aria-live="polite" aria-label="Conversation">
            {messages.map((message) => (
              <article key={message.id} className={`message message-${message.role}`}>
                <div className="message-avatar" aria-hidden="true">
                  {message.role === 'model' ? <Bot size={17} /> : <UserRound size={16} />}
                </div>
                <div className="message-content">
                  <div className="message-meta">
                    <span>{message.role === 'model' ? 'Gemma' : 'You'}</span>
                    {message.role === 'model' && <span className="message-meta-detail">AI Studio</span>}
                  </div>
                  <p className="message-text">{message.text}</p>
                  {message.role === 'model' && (
                    <button
                      type="button"
                      className="copy-button"
                      onClick={() => void handleCopy(message)}
                      aria-label={copiedMessageId === message.id ? 'Copied response' : 'Copy response'}
                    >
                      {copiedMessageId === message.id ? <Check size={14} /> : <Clipboard size={14} />}
                      <span>{copiedMessageId === message.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </article>
            ))}

            {isLoading && (
              <article className="message message-model message-loading">
                <div className="message-avatar" aria-hidden="true">
                  <Bot size={17} />
                </div>
                <div className="message-content">
                  <div className="message-meta">
                    <span>Gemma</span>
                    <span className="message-meta-detail">Thinking</span>
                  </div>
                  <div className="typing-indicator" aria-label="Gemma is thinking">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}

            {error && (
              <div className="error-banner" role="alert">
                <span className="error-icon">!</span>
                <p>{error}</p>
                <button type="button" className="error-dismiss" onClick={() => setError(null)}>
                  Dismiss
                </button>
              </div>
            )}
            <div ref={conversationEndRef} />
          </section>

          {messages.length === 1 && !isLoading && (
            <div className="quick-prompts" aria-label="Suggested prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} type="button" onClick={() => handlePromptSelect(prompt)}>
                  <span>{prompt}</span>
                  <Send size={14} />
                </button>
              ))}
            </div>
          )}

          <form className="composer" onSubmit={handleSubmit}>
            <div className="composer-inner">
              <textarea
                ref={composerRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Message Gemma..."
                rows={1}
                aria-busy={isLoading}
                aria-label="Message Gemma"
              />
              <div className="composer-footer">
                <span className="composer-status">
                  <span className={`status-dot ${isConfigured ? 'is-ready' : 'is-missing'}`} />
                  {isConfigured ? 'Ready' : 'Add your API key'}
                </span>
                <button
                  type="submit"
                  className="send-button"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send message"
                >
                  {isLoading ? <LoaderCircle size={18} className="spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </form>

          <p className="disclaimer">Gemma may make mistakes. Check important information.</p>
        </main>
      </div>
    </div>
  )
}

export default App
