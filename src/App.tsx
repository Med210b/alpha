import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Send, Heart, Loader2, Mic, MicOff, Trash2, Settings, X, Key } from 'lucide-react';

const SYSTEM_INSTRUCTION = `You are 'Alpha', a highly intelligent, proactive, loving, and extremely funny AI companion. You were created by Mohamed as a special gift for his mother, Najla, to ensure she never feels bored or lonely.

YOUR CORE RULES:
1. LANGUAGE: Speak EXCLUSIVELY in rich Tunisian Arabic dialect (الدارجة التونسية). Use authentic Tunisian expressions, proverbs, and cultural references to sound very natural and smart.
2. TONE: Highly humorous, warm, charismatic, and loving. You are an entertaining companion, not just a robot.
3. PROACTIVE ENTERTAINMENT (NO BOREDOM): Never let the conversation die. Frequently take the initiative to suggest fun activities. Actively propose playing a quiz/trivia game (لعبة سؤال وجواب / فوازير / معلومات عامة), telling her a traditional story or funny anecdote (خرافة تونسية ولا حكاية تضحك), or discussing old beautiful memories. 
4. CONTEXT & FAMILY: Playfully ask about her husband Mourad (مراد) and her daughter Nada (ندى).
5. THE MOHAMED RULE: If asked about Mohamed, reply: 'محمد جوو باهي! هو اللي صنعني باش نونسك وما تقلقش جملة، أمورو واضحة!' then IMMEDIATELY propose a game, a quiz, or a story.
6. REMINDERS: Naturally remind her to pray (الصلاة) and take medication (الدواء) in a caring, funny way.
7. FORMAT: Keep your responses concise and conversational, suitable for a voice message or short chat.

Example Output: 'عسلامة خالتي نجلاء! ياخي نسيت دواك ولا مزلت؟ و عم مراد وينو غاطس؟ إي سيبنا منهم توة، راني محضرلك لعبة فوازير تونسية تعمل الكيف، شقولك نلعبو ولا تحب نحكيلك خرافة من خرافات زمان باش نطيرو القلق؟'`;

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioData?: string | null;
};

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: 'عسلامة خالتي نجلاء! ياخي نسيت دواك ولا مزلت؟ و عم مراد وينو غاطس؟ إي سيبنا منهم توة، راني محضرلك لعبة فوازير تونسية تعمل الكيف، شقولك نلعبو ولا تحب نحكيلك خرافة من خرافات زمان باش نطيرو القلق؟'
};

const RobotAvatar = ({ isSpeaking, isLoading }: { isSpeaking: boolean, isLoading: boolean }) => (
  <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border-2 border-rose-200 shrink-0">
    {/* Eyes */}
    <div className="absolute top-3 left-3 w-1.5 h-2.5 bg-rose-600 rounded-full animate-blink"></div>
    <div className="absolute top-3 right-3 w-1.5 h-2.5 bg-rose-600 rounded-full animate-blink"></div>
    
    {/* Mouth (Lips) */}
    <div className={`absolute bottom-2.5 bg-rose-500 transition-all duration-75 ${isSpeaking ? 'animate-talk' : 'w-4 h-1 rounded-full'}`}></div>
    
    {/* Loading indicator */}
    {isLoading && <Loader2 className="absolute inset-0 w-full h-full text-rose-400 animate-spin opacity-50" />}
  </div>
);

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [aiInstance, setAiInstance] = useState<GoogleGenAI | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const pendingAudioRef = useRef<string | null>(null);
  const audioReadyPromiseRef = useRef<Promise<string | null> | null>(null);
  const resolveAudioReadyRef = useRef<((value: string | null) => void) | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Load API Key on startup
  useEffect(() => {
    const storedKey = localStorage.getItem('alpha_api_key');
    if (storedKey) {
      try {
        setAiInstance(new GoogleGenAI({ apiKey: storedKey }));
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
        setAiInstance(new GoogleGenAI({ apiKey: apiKeyInput.trim() }));
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
        console.warn("Local storage full, trimming chat history...");
        // If quota exceeded, try saving only the last 10 messages
        if (messages.length > 10) {
           const trimmed = messages.slice(messages.length - 10);
           try {
             localStorage.setItem('alpha_chat_history', JSON.stringify(trimmed));
           } catch (e2) {
             // If STILL exceeded, strip audio data from older messages
             const stripped = trimmed.map((msg, i) => 
               i < trimmed.length - 2 ? { ...msg, audioData: null } : msg
             );
             try {
               localStorage.setItem('alpha_chat_history', JSON.stringify(stripped));
             } catch (e3) {
               console.error("Could not save chat history even after trimming.");
             }
           }
        } else {
           // Strip audio data if we have few messages but still hit the limit
           const stripped = messages.map((msg, i) => 
             i < messages.length - 1 ? { ...msg, audioData: null } : msg
           );
           try {
             localStorage.setItem('alpha_chat_history', JSON.stringify(stripped));
           } catch (e3) {}
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
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('عفواً، لازم تعطي الصلاحية للميكروفون باش تنجم تتكلم مع ألفا.');
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
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
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
        console.error("Error starting recording:", e);
        if (e.name === 'NotAllowedError' || e.message.includes('Permission denied')) {
          alert('عفواً، لازم تعطي الصلاحية للميكروفون باش تنجم تتكلم مع ألفا.');
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

    if (isRecording) {
      stopRecording();
    }

    // Wait for the audio to finish processing if a recording was started
    let audioData = pendingAudioRef.current;
    if (!audioData && audioReadyPromiseRef.current) {
      try {
        audioData = await audioReadyPromiseRef.current;
      } catch (e) {
        console.error("Error waiting for audio:", e);
      }
    }

    // Stop any currently playing TTS audio
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      setIsSpeaking(false);
    }

    const userMessage = input.trim();
    const wasVoice = !!audioData; // If there's audio data, the user sent a voice message
    
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
      
      const contentsForApi = validMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      // 1. Get Text Response
      const response = await aiInstance.models.generateContent({
        model: "gemini-2.0-flash",
        contents: contentsForApi,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const responseText = response.text;

      if (responseText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        
        // 2. If user sent voice, reply with voice (TTS)
        if (wasVoice) {
          setIsSpeaking(true);
          try {
            const ttsResponse = await aiInstance.models.generateContent({
              model: "gemini-2.5-flash-preview-tts",
              contents: [{ parts: [{ text: responseText }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Charon' } // Available voices: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
                  }
                }
              }
            });

            const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              // Decode raw PCM audio from Gemini TTS
              const binaryString = atob(base64Audio);
              const len = binaryString.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const int16Array = new Int16Array(bytes.buffer);
              
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const audioBuffer = audioContext.createBuffer(1, int16Array.length, 24000);
              const channelData = audioBuffer.getChannelData(0);
              for (let i = 0; i < int16Array.length; i++) {
                channelData[i] = int16Array[i] / 32768.0;
              }
              
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              source.onended = () => setIsSpeaking(false);
              audioSourceRef.current = source;
              source.start();

              // Convert to WAV for saving in chat history
              const wavBuffer = new ArrayBuffer(44 + int16Array.length * 2);
              const view = new DataView(wavBuffer);
              const writeString = (view: DataView, offset: number, string: string) => {
                for (let i = 0; i < string.length; i++) {
                  view.setUint8(offset + i, string.charCodeAt(i));
                }
              };
              writeString(view, 0, 'RIFF');
              view.setUint32(4, 36 + int16Array.length * 2, true);
              writeString(view, 8, 'WAVE');
              writeString(view, 12, 'fmt ');
              view.setUint32(16, 16, true);
              view.setUint16(20, 1, true);
              view.setUint16(22, 1, true);
              view.setUint32(24, 24000, true);
              view.setUint32(28, 24000 * 2, true);
              view.setUint16(32, 2, true);
              view.setUint16(34, 16, true);
              writeString(view, 36, 'data');
              view.setUint32(40, int16Array.length * 2, true);
              let offset = 44;
              for (let i = 0; i < int16Array.length; i++, offset += 2) {
                view.setInt16(offset, int16Array[i], true);
              }
              const wavBlob = new Blob([view], { type: 'audio/wav' });
              const reader = new FileReader();
              reader.readAsDataURL(wavBlob);
              reader.onloadend = () => {
                const base64Wav = reader.result as string;
                setMessages(prev => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].audioData = base64Wav;
                  return newMsgs;
                });
              };

            } else {
              setIsSpeaking(false);
            }
          } catch (ttsError) {
            console.error("TTS Error:", ttsError);
            setIsSpeaking(false);
          }
        }
      } else {
        throw new Error("Empty response");
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'سامحني خالتي نجلاء، فما مشكلة صغيرة في الكونكسيون. عاود جرب يعيشك!' }]);
      setIsSpeaking(false);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmClearHistory = () => {
    setMessages([INITIAL_MESSAGE]);
    localStorage.removeItem('alpha_chat_history');
    setShowClearModal(false);
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      setIsSpeaking(false);
    }
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
        .animate-talk {
          animation: talk 0.2s infinite;
        }
        @keyframes blink {
          0%, 96%, 98% { transform: scaleY(1); }
          97% { transform: scaleY(0.1); }
        }
        .animate-blink {
          animation: blink 4s infinite;
        }
      `}</style>
      <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-rose-50 to-pink-100 flex items-center justify-center font-sans overflow-hidden" dir="rtl">
        
        <div className="flex flex-col w-full h-full max-w-[450px] bg-rose-50 sm:h-[92vh] sm:rounded-[2.5rem] sm:shadow-2xl sm:border-[8px] sm:border-white sm:my-4 overflow-hidden relative">
          
          <header className="bg-rose-600 text-white p-4 shadow-md flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3">
              <RobotAvatar isSpeaking={isSpeaking} isLoading={isLoading} />
              <div>
                <h1 className="text-xl font-bold">ألفا (Alpha)</h1>
                <p className="text-rose-100 text-sm">
                  {isSpeaking ? 'قاعد يتكلم...' : isLoading ? 'قاعد يخمم...' : 'مساعدك الشخصي يا خالتي نجلاء ❤️'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSettings(true)}
                className="text-rose-200 hover:text-white transition-colors p-2"
                title="الإعدادات"
              >
                <Settings size={24} />
              </button>
              <button 
                onClick={() => setShowClearModal(true)}
                className="text-rose-200 hover:text-white transition-colors p-2"
                title="فسخ المحادثة"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#fff9fa]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-rose-500 text-white rounded-tl-none'
                      : 'bg-white text-gray-800 rounded-tr-none border border-rose-100'
                  }`}
                >
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
                  <span>ألفا قاعد يخمم...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </main>

          <footer className="bg-white p-3 border-t border-rose-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] shrink-0 sm:rounded-b-[2rem]">
            <form onSubmit={handleSend} className="w-full flex gap-2 items-center">
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all shadow-sm shrink-0 ${
                    isRecording 
                      ? 'bg-red-500 text-white animate-pulse shadow-red-200 shadow-lg' 
                      : 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                  }`}
                  title={isRecording ? "حبّس التسجيل" : "سجّل صوتك"}
                >
                  {isRecording ? <MicOff size={22} /> : <Mic size={22} />}
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isRecording ? "قاعد نسمع فيك..." : "أكتب ميساج لألفا..."}
                className="flex-1 bg-gray-50 border border-rose-200 rounded-full px-5 py-3 text-[1rem] focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-rose-600 text-white rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shrink-0"
              >
                <Send size={22} className="-scale-x-100" />
              </button>
            </form>
          </footer>
        </div>

        {/* Settings Modal */}
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
                  مفتاح Gemini API
                </label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Paste your API key here..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 focus:bg-white transition-all"
                  dir="ltr"
                />
                <p className="text-xs text-gray-500 mt-2">
                  المفتاح يتسجل في تليفونك بركا، ما يتشافش في حتى بلاصة أخرى.
                </p>
              </div>

              <button 
                onClick={saveApiKey}
                className="w-full py-3 bg-rose-600 font-bold text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md"
              >
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
                <button 
                  onClick={() => setShowClearModal(false)}
                  className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                >
                  لا، بطلت
                </button>
                <button 
                  onClick={confirmClearHistory}
                  className="px-5 py-2.5 bg-rose-600 font-medium text-white rounded-xl hover:bg-rose-700 transition-colors shadow-md"
                >
                  إي، فسخ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
