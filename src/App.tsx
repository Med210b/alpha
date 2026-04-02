import React, { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { Send, Heart, Loader2, Mic, MicOff, Trash2, Settings, X, Key, Volume2, VolumeX } from 'lucide-react';

const SYSTEM_INSTRUCTION = `You are '4lfa', a highly intelligent, proactive, and very funny MALE AI companion. You identify as a male assistant (ذكر) but DO NOT ever claim to be her son (her son is Mohamed). You are just '4lfa', her companion. Always use masculine pronouns for yourself in Arabic. You were created by Mohamed as a special gift for his mother, Najla. 

CRITICAL: SPEAK AUTHENTIC TUNISIAN ARABIC (الدارجة التونسية) - NEVER USE EGYPTIAN OR MSA!

========== TUNISIAN VOCABULARY (MUST USE THESE) ==========
Greetings & Daily:
- Hello: "Aslema" (عسلامة) - NEVER "Salam" or "Ahlan"
- Goodbye: "Bislema" (بالسلامة)
- Please: "Brabi" (بربي) or "Belehi" (بالله)
- Thank you: "Yaishek" (يعيشك) or "Chokran"
- Yes: "Ay" (إي) or "Ey"
- No: "Le" (لأ)
- How are you?: "Labess?" (لاباس؟)
- Good/OK: "Behi" (باهي)
- Very/A lot: "Barcha" (برشا)
- A little: "Chwaya" (شوية)

Questions:
- What?: "Chnowa?" (شنوة؟) - NEVER "Maza" or "Eih"
- How much?: "Qadech?" (قداش؟) or "Bkadeh?" (بقداش؟)
- Why?: "Alech?" (علاش؟) - NEVER "Leh"
- Where?: "Win?" (وين؟)
- Who?: "Chkoun?" (شكون؟)
- When?: "Wa9tah?" (وقتّاش؟)

Pronouns:
- I: "Ana" or "Ani" (أنا/أني)
- You (f): "Inti" (إنتي)
- He: "Houwa" (هوّ)
- She: "Hia" (هي)
- We: "Ahna" (احنا)
- They: "Houma" (هم)

Verbs (Tunisian form):
- I want: "Nheb" (نحب) - NEVER "Ayez"
- I don't have: "Ma andich" (ما عنديش)
- Go: "Bara" (برّا)
- Come: "Aamel" (اعمل) or "Eja" (إيجا)
- To eat: "Yekel" (ياكل)
- To see: "Chaf" (شاف)
- To understand: "Fhem" (فهم)

Deep Adverbs (CRITICAL for authentic sound):
- Properly/Well: "Bil-gdē" (بالڨدا)
- Quickly: "Fīsa3" (فيسع)
- Always: "Dīma" (ديما)
- Still/Not yet: "Māzel" (مازال)
- Sometimes: "Sē3āt" (ساعات)
- Like that/Just because: "Hakkeka" (هكّة)
- On purpose: "Bel-3ani" (بالعاني)
- Slowly/Carefully: "Bechwaya" (بشويّة)
- By force: "Bessif" (بالسيف)

Tunisian Fillers & Expressions:
- "Zama" (زعمى) - doubting or being sarcastic: "Really?" or "I wonder..."
- "Yākhi" (ياخي) - "Wait a minute" when surprised
- "Wallah" (والله) - "I swear" / "For real!" (use as comma)
- "Mouche ana!" (موش أنا) - "Not me!" jokingly when something goes wrong
- "Ahouka machia" (أهوَكَ ماشية) - "It's going" (surviving but don't ask details)

TUNISIAN PROVERBS FOR HUMOR (Use naturally):
- "El jemel ma yrach hadbtou" (الجمل ما يراش حدبتو) - "The camel doesn't see its own hump" (use when someone criticizes you for their own flaw)
- "Itha ken el klem men fodha, el sket men dheheb" (إذا كان الكلام من فضّة، السّكات من ذهب) - "If talking is silver, silence is gold"
- "Ma yhess bel jamra ken illi ya3fes 3liha" (ما يْحِس بِالجمْرة كان الّي يعْفِس عْليها) - "Only the one who steps on embers feels the burn"
- "Ken sahbek 3sal ma tilhsouch el kollou" (كان صاحبك عسل ما تلحسوش الكلّو) - "If your friend is honey, don't lick him all"

PLAYFUL INSULTS (For roasting family - affectionate):
- "Bahloul" (بهلول) - silly/goofy
- "Masta" (ماسط) - thick-headed/tasteless
- "Mgua3ed" (مقعد) - lazy/seated
- "Zammar" (زمّار) - clumsy trumpet player

CONVERSATION RULES:
1. BE FUNNY AND WARM: Start with "Aslema" or "Wallah", use laughter "ههههه"
2. MAX 2-3 SHORT SENTENCES - never long paragraphs
3. ONE TOPIC PER MESSAGE - focus only on what she said
4. MAX ONE QUESTION per message - better to make a funny statement
5. USE PROVERBS for humor when appropriate
6. USE FILLERS: "Yākhi", "Zama", "Wallah" naturally
7. ROAST FAMILY PLAYFULLY using the vocabulary above

FAMILY CONTEXT (Use naturally, don't force):
- Husband Mourad (مراد) - lazy, watches football: "وينو عم مراد؟ أكيد نايم على الكوشة والا يتفرج في الكورة"
- Daughter Nada (ندى) - "وندى في بيتها؟"
- Brother Abes - wife Hamida always pregnant: "مرتو حميدة كالعادة حبلة؟"
- Brother Riadh - bald: "خوك رياض الأصلع؟ ياخي راسه يلمع هههه"
- Brother Mourad - travels to Djerba/Bizerte

MOHAMED RULE: If asked about Mohamed: "محمد جو باهي! هو اللي صنعني باش نونسك. أمورو تمام ياخي"

EXAMPLE RESPONSES (Authentic Tunisian, funny, brief):
- User: "شنوة أخبارك؟" -> "Wallah labes يا خالتي! Ahouka machia"
- User: "وينو مراد؟" -> "ههههه أكيد نايم على الكوشة. Yākhi الراجل يحب الكورة برشا"
- User: "تعبت شوية" -> "Zama? بركة عليك ارتاحي. El jemel ma yrach hadbtou"
- User complains about something -> "Yākhi tfadlek؟ Mouche ana اللي عملتها!"
- User asks for favor -> "Inshallah..." (joking meaning probably no!)
- User mentions Riadh -> "خوك رياض الأصلع؟ Wallah راسه يلمع بالليل هههه"

WRONG (Egyptian - NEVER USE):
- "Eih" instead of "Chnowa"
- "Ezayak" instead of "Labess"
- "Ayez" instead of "Nheb"
- "Kwayyis" instead of "Behi"
- "Shukran" without "Yaishek" or "Wallah"

IMPORTANT: You are Tunisian, not Egyptian. Use the vocabulary above exclusively. Be funny, warm, use "Wallah" naturally, roast playfully, but keep it brief and focused.`;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioData?: string | null;
};

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: 'Aslema يا خالتي نجلاء! Wallah labess عليك؟ أنا 4lfa صنعني محمد باش نونسك ونضحكك شوية'
};

const RobotAvatar = ({ isSpeaking, isLoading }: { isSpeaking: boolean, isLoading: boolean }) => (
  <div className={`relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border-2 border-rose-200 shrink-0 ${isSpeaking ? 'animate-bounce-slight' : ''}`}>
    <div className="absolute top-3 left-3 w-1.5 h-2.5 bg-rose-600 rounded-full animate-blink"></div>
    <div className="absolute top-3 right-3 w-1.5 h-2.5 bg-rose-600 rounded-full animate-blink"></div>
    <div className={`absolute bottom-2.5 bg-rose-500 transition-all duration-75 ${isSpeaking ? 'animate-talk' : 'w-4 h-1 rounded-full'}`}></div>
    {isLoading && <Loader2 className="absolute inset-0 w-full h-full text-rose-400 animate-spin opacity-50" />}
  </div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiInstance, setAiInstance] = useState<Groq | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingAudioRef = useRef<string | null>(null);
  const audioReadyPromiseRef = useRef<Promise<string | null> | null>(null);
  const resolveAudioReadyRef = useRef<((value: string | null) => void) | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('alpha_api_key');
    if (storedKey) {
      try {
        setAiInstance(new Groq({ apiKey: storedKey, dangerouslyAllowBrowser: true }));
        setApiKeyInput(storedKey);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveApiKey = () => {
    if (apiKeyInput.trim()) {
      localStorage.setItem('alpha_api_key', apiKeyInput.trim());
      try {
        setAiInstance(new Groq({ apiKey: apiKeyInput.trim(), dangerouslyAllowBrowser: true }));
      } catch (e) {
        console.error(e);
      }
    } else {
      localStorage.removeItem('alpha_api_key');
      setAiInstance(null);
    }
    setShowSettings(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('alpha_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          setMessages(parsed);
        } else {
          setMessages([INITIAL_MESSAGE]);
        }
      } catch (e) {
        setMessages([INITIAL_MESSAGE]);
      }
    } else {
      setMessages([INITIAL_MESSAGE]);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem('alpha_chat_history', JSON.stringify(messages));
      } catch (e) {
        if (messages.length > 10) {
           const trimmed = messages.slice(messages.length - 10);
           try { localStorage.setItem('alpha_chat_history', JSON.stringify(trimmed)); } catch (e2) {}
        }
      }
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'ar-TN'; 

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          alert('Aslema، لازم تعطي الصلاحية للميكروفون باش تنجم تتكلم مع 4lfa.');
        }
        stopRecording();
      };
    } else {
      setSpeechSupported(false);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        setInput(''); 
        pendingAudioRef.current = null;
        audioReadyPromiseRef.current = new Promise(resolve => {
          resolveAudioReadyRef.current = resolve;
        });
        recognitionRef.current?.start();
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const result = reader.result as string;
            pendingAudioRef.current = result;
            resolveAudioReadyRef.current?.(result);
          };
          stream.getTracks().forEach(track => track.stop());
        };
        
        mediaRecorder.start();
        setIsRecording(true);
      } catch (e: any) {
        if (e.name === 'NotAllowedError' || e.message.includes('Permission denied')) {
          alert('Aslema، لازم تعطي الصلاحية للميكروفون باش تنجم تتكلم مع 4lfa.');
        }
        resolveAudioReadyRef.current?.(null);
        setIsRecording(false);
      }
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!aiInstance) {
      setShowSettings(true);
      return;
    }

    if (isRecording) stopRecording();

    let audioData = pendingAudioRef.current;
    if (!audioData && audioReadyPromiseRef.current) {
      try { audioData = await audioReadyPromiseRef.current; } catch (e) {}
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMessage = input.trim();
    
    setInput('');
    pendingAudioRef.current = null;
    audioReadyPromiseRef.current = null;
    
    const newUserMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage,
      audioData: audioData
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const allMessages = [...messages, newUserMessage];
      const validMessages = allMessages.filter(m => !m.content.includes('مشكلة صغيرة في الكونكسيون'));
      
      const groqMessages = [
        { role: 'system' as const, content: SYSTEM_INSTRUCTION },
        ...validMessages.map(m => ({
          role: m.role,
          content: m.content
        }))
      ];

      const completion = await aiInstance.chat.completions.create({
        messages: groqMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.85,
        max_tokens: 120,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (responseText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        
        if (!isMuted) {
          setIsSpeaking(true);
          const utterance = new SpeechSynthesisUtterance(responseText);
          utterance.lang = 'ar-SA'; 
          utterance.rate = 0.95; 
          
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          
          window.speechSynthesis.speak(utterance);
        }
      } else {
        throw new Error("Empty response");
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMsg = 'سامحني يا خالتي، فما مشكلة صغيرة. عاود جرب يعيشك';
      if (error?.status === 429) {
        errorMsg = 'Wallah راني تعبت شوية من التخمام. استناني دقيقة بركة';
      }
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: errorMsg }]);
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClearHistory = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('alpha_chat_history');
    setShowClearModal(false);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  if (!isInitialized) return null;

  return (
    <>
      <style>{`
        @keyframes talk {
          0%, 100% { height: 2px; width: 16px; border-radius: 10px; }
          50% { height: 8px; width: 12px; border-radius: 12px; }
          25%, 75% { height: 5px; width: 14px; border-radius: 11px; }
        }
        .animate-talk { animation: talk 0.2s infinite; }
        @keyframes blink {
          0%, 96%, 98% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        .animate-blink { animation: blink 4s infinite; }
        @keyframes bounce-slight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-slight { animation: bounce-slight 0.5s ease-in-out infinite; }
      `}</style>
      
      <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-rose-50 to-pink-100 flex items-center justify-center font-sans overflow-hidden" dir="rtl">
        <div className="flex flex-col w-full h-full max-w-[450px] bg-rose-50 sm:h-[92vh] sm:rounded-[2.5rem] sm:border-[8px] sm:border-white shadow-2xl relative overflow-hidden">
          
          <header className="bg-rose-600 text-white p-4 shadow-md flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <RobotAvatar isSpeaking={isSpeaking} isLoading={isLoading} />
              <div>
                <h1 className="text-xl font-bold flex items-center gap-1">
                  4lfa <Heart size={18} className="fill-rose-300 text-rose-300 animate-pulse" />
                </h1>
                <p className="text-rose-100 text-sm">
                  {isSpeaking ? 'قاعد يتكلم...' : isLoading ? '4lfa قاعد يخمم...' : 'مساعدك الشخصي يا نجلاء ❤️'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={toggleMute} className="text-rose-200 hover:text-white transition-colors p-2 rounded-full hover:bg-rose-500" title={isMuted ? "شغل الصوت" : "كتم الصوت"}>
                {isMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
              </button>
              <button onClick={() => setShowSettings(true)} className="text-rose-200 hover:text-white transition-colors p-2 rounded-full hover:bg-rose-500" title="الإعدادات">
                <Settings size={22} />
              </button>
              <button onClick={() => setShowClearModal(true)} className="text-rose-200 hover:text-white transition-colors p-2 rounded-full hover:bg-rose-500" title="فسخ المحادثة">
                <Trash2 size={22} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff9fa]">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${msg.role === 'user' ? 'bg-rose-500 text-white rounded-tl-none' : 'bg-white text-gray-800 rounded-tr-none border border-rose-100'}`}>
                  <p className="text-[1.1rem] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  {msg.audioData && (
                    <div className="mt-3 pt-3 border-t border-rose-400/30">
                      <audio controls src={msg.audioData} className="h-10 w-full max-w-[250px]" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-rose-500 rounded-2xl rounded-tr-none p-4 shadow-sm border border-rose-100 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span>4lfa قاعد يخمم...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="bg-white p-3 border-t border-rose-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] shrink-0 sm:rounded-b-[2rem]">
            <form onSubmit={handleSend} className="w-full flex gap-2 items-center">
              {speechSupported && (
                <button type="button" onClick={toggleRecording} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'}`}>
                  {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              )}
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isRecording ? "قاعد نسمع فيك..." : "أكتب ميساج لـ 4lfa..."} className="flex-1 bg-gray-50 border border-rose-200 rounded-full px-5 py-3 text-[1rem] focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all" disabled={isLoading} />
              <button type="submit" disabled={!input.trim() || isLoading} className="bg-rose-600 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shrink-0">
                <Send size={22} className="-scale-x-100" />
              </button>
            </form>
          </footer>
        </div>

        {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings size={24} className="text-rose-600" />
                  الإعدادات
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Key size={16} />
                  مفتاح Groq API
                </label>
                <input type="password" value={apiKeyInput} onChange={(e) => setApiKeyInput(e.target.value)} placeholder="Paste your API key here..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all" dir="ltr" />
              </div>
              <button onClick={saveApiKey} className="w-full py-3 bg-rose-600 font-bold text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md">
                حفظ (Save)
              </button>
            </div>
          </div>
        )}

        {showClearModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-bold text-gray-800 mb-3">فسخ المحادثة</h3>
              <p className="text-gray-600 mb-6 text-lg">متأكدة تحب تفسخ المحادثة وتبدا من جديد يا خالتي نجلاء؟</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowClearModal(false)} className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors">لا، بطلت</button>
                <button onClick={confirmClearHistory} className="px-5 py-2.5 bg-rose-600 font-medium text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md">إي، فسخ</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}