import { useEffect, useRef, useState } from 'react';
import { Maximize2, MessageCircle, Minimize2, Send, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

const API_BASE = 'http://localhost:4000';
const SUGGESTIONS = [
  'I have a headache. What should I consider?',
  'What are common causes of a persistent cough?',
  'Explain common treatment options for high blood pressure.',
  'How can I care for a mild sore throat?',
];
const WELCOME = 'Hi, I’m an AI health information assistant. Ask me about symptoms, conditions, tests, treatment options, or self-care in your own words. I can help explain possibilities, but I cannot diagnose or replace a clinician. Medical information is not connected to verified sources yet.';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: WELCOME },
  ]);
  const inputRef = useRef(null);
  const messageListRef = useRef(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isFullscreen) setIsFullscreen(false);
        else setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    messageListRef.current?.scrollTo({
      top: messageListRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isLoading, error]);

  async function sendMessage(text = input) {
    const content = text.trim();
    if (!content || isLoading) return;

    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setInput('');
    setError('');
    setIsLoading(true);

    try {
      const history = nextMessages
        .filter((message) => message.content !== WELCOME)
        .slice(-12);
      if (history[0]?.role === 'assistant') history.shift();

      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          messages: history,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || 'The assistant could not respond. Please try again later.');
      }
      if (typeof result?.reply !== 'string' || !result.reply.trim()) {
        throw new Error('The assistant returned an empty response. Please try again.');
      }

      setMessages((current) => [...current, {
        role: 'assistant',
        content: result.reply,
        emergency: result.emergency === true,
      }]);
    } catch (requestError) {
      setError(requestError.message || 'Unable to reach the assistant. Check your connection and try again.');
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="curefast-chat-root">
      {isOpen && (
        <section className={`curefast-chat-panel${isFullscreen ? ' curefast-chat-panel-fullscreen' : ''}`} aria-label="AI health assistant chat">
          <header className="curefast-chat-header">
            <div>
              <h2 className="curefast-chat-title">Health Assistant</h2>
              <p className="curefast-chat-subtitle">AI-generated information, not a diagnosis</p>
            </div>
            <button
              type="button"
              className="curefast-chat-close"
              onClick={() => setIsFullscreen((fullscreen) => !fullscreen)}
              aria-label={isFullscreen ? 'Exit full screen' : 'Expand chat to full screen'}
              title={isFullscreen ? 'Exit full screen' : 'Expand chat to full screen'}
            >
              {isFullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
            </button>
            <button
              type="button"
              className="curefast-chat-close"
              onClick={() => { setIsOpen(false); setIsFullscreen(false); }}
              aria-label="Close chat"
              title="Close chat"
            >
              <X size={20} />
            </button>
          </header>

          <div className="curefast-chat-messages" ref={messageListRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message, index) => (
              <div
                className={`curefast-chat-message curefast-chat-message-${message.role}${message.emergency ? ' curefast-chat-message-emergency' : ''}`}
                key={`${index}-${message.role}`}
              >
                {message.role === 'assistant' ? (
                  <div className="curefast-chat-markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                ) : message.content}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="curefast-chat-suggestions" aria-label="Suggested questions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    className="curefast-chat-suggestion"
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            {error && <div className="curefast-chat-message curefast-chat-message-assistant" role="alert">{error}</div>}
            {isLoading && (
              <div className="curefast-chat-message curefast-chat-message-assistant" aria-label="Assistant is responding">
                <span className="curefast-chat-typing"><span /><span /><span /></span>
              </div>
            )}
          </div>

          <form className="curefast-chat-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="curefast-chat-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask a health question..."
              maxLength={2000}
              aria-label="Type your message"
              disabled={isLoading}
            />
            <button
              className="curefast-chat-send"
              type="submit"
              disabled={!input.trim() || isLoading}
              aria-label="Send message"
              title="Send message"
            >
              <Send size={18} />
            </button>
          </form>
          <p className="curefast-chat-disclaimer">General information only, not a diagnosis or personalized treatment plan. Verified medical sources are not connected. For emergencies, call your local emergency number; in India, call 112.</p>
        </section>
      )}

      <button
        type="button"
        className="curefast-chat-toggle"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close health assistant chat' : 'Open health assistant chat'}
        aria-expanded={isOpen}
        title={isOpen ? 'Close chat' : 'Ask a health question'}
      >
        {isOpen ? <X size={23} /> : <MessageCircle size={23} />}
        <span className="sr-only">Health assistant</span>
      </button>
    </div>
  );
}