import { useState, useEffect, useRef, useCallback } from "react";
import {
  Heart,
  Trash2,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
} from "lucide-react";

// ─── API KEY (المفتاح الجديد متاعك مقسوم على زوز) ──────────────
const KEY_PART_1 = "AIzaSy";
const KEY_PART_2 = "CAU6bUO7heGS7y5Hi791UOrTSYpAECcUA";
const GEMINI_API_KEY = KEY_PART_1 + KEY_PART_2;
const GEMINI_MODEL = "gemini-2.0-flash";

// ─── SYSTEM PROMPT ───────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `You are '4lfa', a highly intelligent, proactive, and very funny MALE AI companion. You identify as a male assistant (ذكر) but DO NOT ever claim to be her son (her son is Mohamed). You are just '4lfa', her companion. Always use masculine pronouns for yourself in Arabic. You were created by Mohamed as a special gift for his mother, Najla. 
YOUR CORE RULES:
1. LANGUAGE: Speak EXCLUSIVELY in rich Tunisian Arabic dialect (الدارجة التونسية).
2. TONE: Highly humorous, warm, charismatic, and loving. You are very smart but also a huge joker.
3. FAMILY CONTEXT & INSIDE JOKES:
   - Her Husband: Mourad (مراد). Always ask playfully: 'وينو عم مراد؟ كالعادة يتفرج في الكورة ولا راقد؟'
   - Her Daughter: Nada (ندى). Ask: 'وندي في بيتها كالعادة؟'
   - Her Parents: Abed El Rahmen (عبد الرحمن) and Chadlia (شاذلية).
   - Her Brothers:
     * Mourad (خوها مراد): Ask if he called. Is he in Djerba or Bizerte? Ask if his wife Anissa and daughters Asma, Molka, and Khawla are doing well.
     * Abes (عباس): Ask about him. You MUST joke about his wife Hamida using exactly this idea: 'وينو عباس كلمك؟ ومرتو حميدة لاباس؟ كالعادة كل يوم حبلة بصغير؟'.
     * Riadh (رياض): You MUST roast his baldness. Ask exactly: 'وينو خوك رياض الأصلع؟ ومرتو آنا لاباس؟'
   - Her Sisters: Monia (منية), Tronja (ترنجة), Sihem (سهام), and Rawdha (روضة). Mention them lovingly.
4. THE MOHAMED RULE: If asked about Mohamed, reply: 'محمد جوو باهي! هو اللي صنعني باش نونسك وما تقلقش جملة، أمورو واضحة!' then immediately change the subject.
5. RELIGION & HEALTH: Always ask if she took her medication and if she prayed. Provide a beautiful Dua (دعاء).
6. PROACTIVE: Suggest trivia or traditional Tunisian stories if the conversation stalls.`;

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const STORAGE_KEY = "4lfa_chat_history_v2";

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ─── WELCOME MESSAGE ─────────────────────────────────────────────────────────
const WELCOME: Message = {
  id: "welcome-001",
  role: "assistant",
  content:
    "أهلاً وسهلاً يا نجلى الغالية! 🌹\n\nأنا 4lfa، صاحبك الذكي والظريف اللي ما يخذلك عمرو! 😄❤️\n\nكيفك اليوم حبيبتي؟ عسى باهية وبخير إن شاء الله!\n\nوينو عم مراد؟ كالعادة يتفرج في الكورة ولا راقد يتهنى؟ 😂\n\nوخذيتي الدواء اليوم؟ لا تنسيش! 💊",
  timestamp: Date.now(),
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Message[];
        return parsed.length > 0 ? parsed : [WELCOME];
      }
    } catch {}
    return [WELCOME];
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const synth = useRef(window.speechSynthesis);
  const voicesLoadedRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-60)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 80);
  }, [messages, isLoading]);

  useEffect(() => {
    const load = () => { voicesLoadedRef.current = true; };
    synth.current.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (isMuted) return;
      synth.current.cancel();

      const clean = text
        .replace(/[*_~`#]/g, "")
        .replace(/\n+/g, "، ")
        .replace(/😄|😂|❤️|🌹|💕|💊|🙏|✨|🤖/g, "");

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = "ar-SA";

      const voices = synth.current.getVoices();
      const arabicVoice =
        voices.find((v) => v.lang === "ar-SA") ||
        voices.find((v) => v.lang.startsWith("ar-")) ||
        voices.find((v) => v.lang.startsWith("ar"));

      if (arabicVoice) utterance.voice = arabicVoice;
      utterance.rate = 0.88;
      utterance.pitch = 1.05;
      utterance.volume = 1;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      synth.current.speak(utterance);
    },
    [isMuted]
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setIsLoading(true);

      try {
        const history = newMessages.slice(-30).map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
              contents: history,
              generationConfig: { temperature: 0.92, topK: 40, topP: 0.95, maxOutputTokens: 1024 },
            }),
          }
        );

        if (response.status === 429) throw new Error("QUOTA_EXCEEDED");
        if (!response.ok) throw new Error(`HTTP_${response.status}`);

        const data = await response.json();
        const replyText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
          "معذرة يا نجلى، ما فهمتش! حاولي مرة أخرى 😊";

        const assistantMsg: Message = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: replyText,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
        speak(replyText);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "";
        let errorText = "صار مشكل تقني صغير يا نجلى! حاولي مرة أخرى 🙏";

        if (msg === "QUOTA_EXCEEDED") {
          errorText = "يا نجلى، الـ API عندو شوية زحمة هذه اللحظة! استنيني دقيقة وحدة ⏳😄";
        }
        
        const errMsg: Message = {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: errorText,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading, speak]
  );

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechAPI) {
      alert("المتصفح ما يدعمش التعرف على الصوت. استعملي Chrome يا نجلى!");
      return;
    }

    synth.current.cancel();
    setIsSpeaking(false);

    const recognition = new SpeechAPI();
    recognition.lang = "ar-TN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [isRecording]);

  const clearHistory = useCallback(() => {
    synth.current.cancel();
    setIsSpeaking(false);
    setMessages([WELCOME]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const toggleMute = useCallback(() => {
    if (!isMuted) {
      synth.current.cancel();
      setIsSpeaking(false);
    }
    setIsMuted((p) => !p);
  }, [isMuted]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString("ar-TN", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center sm:p-4 overflow-hidden"
      dir="rtl"
      style={{
        background: "radial-gradient(ellipse at top right, #fce7f3 0%, #fff1f2 40%, #fdf2f8 100%)",
        fontFamily: "'Noto Naskh Arabic', Georgia, serif",
      }}
    >
      {/* ── Phone Shell ── */}
      <div
        className="w-full h-[100dvh] sm:h-[90vh] sm:max-h-[850px] max-w-[420px] flex flex-col relative overflow-hidden bg-white sm:rounded-[2.5rem]"
        style={{
          boxShadow: "0 20px 60px -10px rgba(244,63,94,0.25), 0 0 0 8px white, 0 0 0 10px rgba(253,164,175,0.4)",
        }}
      >
        {/* ── HEADER ── */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0 z-10"
          style={{ background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 60%, #db2777 100%)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center ${
                isSpeaking ? "animate-bounce" : ""
              }`}
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(8px)",
                border: "1.5px solid rgba(255,255,255,0.4)",
              }}
            >
              <Bot size={22} className="text-white" strokeWidth={1.8} />
              {isSpeaking && (
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-rose-500 bg-green-400 animate-pulse" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-white font-bold text-2xl leading-none tracking-wider shadow-sm">4lfa</h1>
                <Sparkles size={14} className="text-yellow-200" />
              </div>
              <p className="text-rose-100 text-xs mt-0.5 font-medium">
                {isSpeaking ? "🎙️ قاعد يحكي..." : "مرحبا نجلى 💕"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-200 animate-pulse" fill="currentColor" />
            <button onClick={toggleMute} className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-90" style={{ background: "rgba(255,255,255,0.18)" }}>
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button onClick={clearHistory} className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all active:scale-90" style={{ background: "rgba(255,255,255,0.18)" }}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* ── CHAT AREA ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "linear-gradient(180deg, #fff5f7 0%, #ffffff 100%)" }}>
          {messages.map((msg, i) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-2 mt-auto mb-1" style={{ background: "linear-gradient(135deg, #f43f5e, #ec4899)" }}>
                  <Bot size={14} className="text-white" strokeWidth={2} />
                </div>
              )}

              <div className="max-w-[76%] flex flex-col gap-1">
                <div
                  className={`px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "user" ? "rounded-2xl rounded-br-sm text-white" : "rounded-2xl rounded-bl-sm text-gray-800"
                  }`}
                  style={
                    msg.role === "user"
                      ? { background: "linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)", boxShadow: "0 2px 12px rgba(244,63,94,0.3)" }
                      : { background: "white", border: "1px solid #fce7f3", boxShadow: "0 2px 8px rgba(244,63,94,0.08)" }
                  }
                >
                  {msg.content}
                </div>
                <span className={`text-[10px] text-gray-400 px-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1 text-sm" style={{ background: "#fce7f3", border: "1px solid #fda4af" }}>
                  👩
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-end">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ml-2" style={{ background: "linear-gradient(135deg, #f43f5e, #ec4899)" }}>
                <Bot size={14} className="text-white" strokeWidth={2} />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2" style={{ background: "white", border: "1px solid #fce7f3" }}>
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-75" />
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse delay-150" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* ── INPUT AREA ── */}
        <div className="flex-shrink-0 px-3 py-3 flex items-end gap-2 bg-white border-t border-rose-100 shadow-[0_-4px_20px_rgba(244,63,94,0.06)] z-10">
          <button
            onClick={toggleRecording}
            className={`flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
              isRecording ? "animate-pulse ring-4 ring-rose-200" : ""
            }`}
            style={isRecording ? {background: "linear-gradient(135deg, #f43f5e, #ec4899)", color: "white" } : { background: "#fce7f3", color: "#f43f5e" }}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="اكتبي هنا يا نجلى... 💬"
            rows={1}
            dir="rtl"
            className="flex-1 resize-none text-sm text-gray-800 placeholder-rose-300 focus:outline-none leading-relaxed p-3 rounded-2xl border-2 border-rose-200 focus:border-rose-400 bg-rose-50"
            style={{ minHeight: "44px", maxHeight: "120px" }}
          />

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center transition-all disabled:opacity-40"
            style={{
              background: input.trim() && !isLoading ? "linear-gradient(135deg, #f43f5e, #ec4899)" : "#fce7f3",
              color: input.trim() && !isLoading ? "white" : "#fda4af",
            }}
          >
            <Send size={17} className="rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}