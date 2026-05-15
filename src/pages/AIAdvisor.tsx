import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Compass } from "lucide-react";
import { askAIAdvisor } from "@/lib/aiAdvisor";

const quickPrompts = [
  "推荐一家上海粤菜餐厅",
  "北京有哪些三星餐厅",
  "附近的必比登推介",
  "成都最好吃的川菜",
  "适合约会的米其林餐厅",
  "素食餐厅推荐",
];

export default function AIAdvisor() {
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

  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col" style={{ backgroundColor: "var(--bg-primary)" }}>
      {/* Header */}
      <div className="px-4 py-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>米其林AI顾问</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>智能美食推荐助手</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-[var(--bg-elevated)]" : ""}`}
                style={msg.role === "assistant" ? { background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" } : {}}>
                {msg.role === "user" ? <Compass size={14} style={{ color: "var(--text-secondary)" }} /> : <Bot size={14} color="#fff" />}
              </div>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                style={msg.role === "user" ? { backgroundColor: "var(--accent-gold)", color: "#0A0A0F" } : { backgroundColor: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--accent-gold), var(--accent-gold-dark))" }}>
                <Bot size={14} color="#fff" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "0ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "150ms" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: "var(--accent-gold)", animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-3">
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2">
            {quickPrompts.map((prompt) => (
              <button key={prompt} onClick={() => handleSend(prompt)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all hover:scale-105"
                style={{ backgroundColor: "var(--bg-elevated)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                <Sparkles size={10} style={{ color: "var(--accent-gold)" }} />{prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border-subtle)" }}>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="输入您的问题，如：推荐一家上海粤菜餐厅..." className="flex-1 bg-transparent text-sm outline-none" style={{ color: "var(--text-primary)" }} />
            <button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
              className="p-2 rounded-xl transition-all disabled:opacity-30 hover:scale-105"
              style={{ backgroundColor: input.trim() ? "var(--accent-gold)" : "transparent" }}>
              <Send size={18} color={input.trim() ? "#0A0A0F" : "var(--text-muted)"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
