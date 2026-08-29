import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Headphones, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { processMessage } from '@/lib/chat-service';
import { cn } from '@/lib/utils';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hi! I'm the 929store assistant. How can I help you today?",
  timestamp: Date.now(),
};

const SUGGESTIONS = [
  'What products do you have?',
  'Show me your bestsellers',
  "What's your phone number?",
  'I need something under Rs. 3000',
];

const STORAGE_KEY = 'chat-history-929store';

function loadHistory(): Message[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [WELCOME_MESSAGE];
    const parsed = JSON.parse(raw) as Message[];
    if (!Array.isArray(parsed) || parsed.length === 0) return [WELCOME_MESSAGE];
    return parsed;
  } catch {
    return [WELCOME_MESSAGE];
  }
}

function saveHistory(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
  } catch {
    // ignore
  }
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userToken = session?.access_token ?? null;

      const reply = await processMessage(
        trimmed,
        newMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        userToken,
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: reply,
          timestamp: Date.now(),
        },
      ]);

      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "Sorry, I'm having trouble right now. Please try again in a moment.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClear = () => {
    setMessages([WELCOME_MESSAGE]);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'fixed bottom-5 right-5 z-[80] flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ease-smooth',
          isOpen
            ? 'bg-gray-800 text-white rotate-90'
            : 'bg-gray-900 text-white hover:scale-105 hover:shadow-xl',
        )}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
        {!isOpen && hasUnread && (
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
        )}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gray-900 animate-ping opacity-20" />
        )}
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 z-[80] w-[calc(100vw-2.5rem)] max-w-[400px] animate-scale-in origin-bottom-right">
          <div className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden h-[560px] max-h-[calc(100vh-7rem)]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-600">
                  <Headphones size={17} className="text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-gray-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold leading-tight">929store Assistant</p>
                  <p className="text-[11px] text-gray-300 leading-tight flex items-center gap-1">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Online — typically replies instantly
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleClear}
                  className="rounded-md p-1.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Clear conversation"
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-md p-1.5 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  aria-label="Minimize"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50 scrollbar-hide"
            >
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}

              {loading && <TypingIndicator />}

              {/* Suggestions */}
              {messages.length === 1 && !loading && (
                <div className="pt-2 space-y-2 animate-fade-in">
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 px-1 font-medium">Quick questions</p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => handleSuggestion(s)}
                        className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-emerald-400 hover:text-emerald-600 transition-colors shadow-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-gray-200 px-3 py-3 bg-white shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
                className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 transition-colors focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 focus:bg-white disabled:opacity-50 outline-none"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white transition-all duration-200 hover:bg-gray-800 active:scale-95 disabled:bg-gray-300 disabled:pointer-events-none"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex animate-fade-up',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-gray-900 text-white rounded-br-md'
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm',
        )}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="rounded-2xl rounded-bl-md bg-white border border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
