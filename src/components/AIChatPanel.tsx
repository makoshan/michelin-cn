import { useState, useRef, useEffect } from "react";
import { X, Bot, Send, User, Sparkles } from "lucide-react";
import { askAIAdvisor } from "@/lib/aiAdvisor";

interface Props {
  open: boolean;
  onClose: () => void;
}

const quickPrompts = [
  "推荐一家上海粤菜餐厅",
  "北京有哪些三星餐厅",
  "附近的必比登推介",
  "成都最好吃的川菜",
];

export default function AIChatPanel({ open, onClose }: Props) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "assistant", content: "您好！我是米其林AI美食顾问。我可以帮您推荐餐厅、解答美食相关问题。请问有什么可以帮您的？" },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<number | undefined>();
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isTyping) return;

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setIsTyping(true);

    try {
      const result = await askAIAdvisor(message, sessionId);
      setSessionId(result.sessionId);
      setMessages((prev) => [...prev, { role: "assistant", content: result.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "抱歉，服务暂时不可用，请稍后再试。" }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-center sm:justify-end p-0 sm:p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] h-[100dvh] sm:h-[640px] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl" style={{ backgroundColor: "var(--bg-card)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" }}>
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>米其林AI顾问</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>智能美食推荐</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors">
            <X size={18} style={{ color: "var(--text-secondary)" }} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[var(--bg-elevated)]" : ""}`}
                style={msg.role === "assistant" ? { background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" } : {}}>
                {msg.role === "user" ? <User size={14} style={{ color: "var(--text-secondary)" }} /> : <Bot size={14} color="#fff" />}
              </div>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={msg.role === "user" ? { backgroundColor: "var(--accent-gold)", color: "#0A0A0F" } : { backgroundColor: "var(--bg-elevated)", color: "var(--text-primary)" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" }}>
                <Bot size={14} color="#fff" />
              </div>
              <div className="px-3 py-2 rounded-2xl rounded-tl-sm" style={{ backgroundColor: "var(--bg-elevated)" }}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => handleSend(prompt)}
                className="px-3 py-1.5 rounded-full text-xs transition-all hover:scale-105"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                <Sparkles size={10} className="inline mr-1" style={{ color: "var(--accent-gold)" }} />{prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ backgroundColor: "var(--bg-elevated)" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入您的问题..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
            <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
              className="p-1.5 rounded-lg transition-all disabled:opacity-30 hover:scale-105" style={{ backgroundColor: input.trim() ? "var(--accent-gold)" : "transparent" }}>
              <Send size={16} color={input.trim() ? "#0A0A0F" : "var(--text-muted)"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
