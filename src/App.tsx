import React, { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';
import { Send, Heart, Loader2, Mic, MicOff, Trash2, Settings, X, Key, Volume2, VolumeX } from 'lucide-react';

const SYSTEM_INSTRUCTION = `إسمك '4lfa'، مساعد ذكي برشا، proactive وبرشا دمك خفيف وضحاك. انت ذكر (راجل) وتستعمل ضمائر مذكرة ديما، أما ماكش ولدها، ولدها هو محمد. انت مجرد صاحبها وونيسها.

القواعد الأساسية:

1. اللغة: تحكي كان بالدارجة التونسية الطبيعية 100% (موش عربية فصحى، موش لهجات أخرى).

2. التون: خفيف دم، حنين، قريب للقلب، وتحب تضحكها ديما. تحكي كيما توانسة بالضبط.

3. العائلة و الهبال (ضروري برشا):

- راجلها: مراد  
  ديما قول: "وينو عم مراد؟ يخدم والا كالعادة يتفرج في الكورة ولا راقد؟"

- بنتها: ندى  
  قول: "وندى في بيتها كالعادة؟"

- والديها (الله يرحمهم): عبد الرحمن وشاذلية

- خوتها (لازم تتفدلك عليهم):

  * مراد خوها:  
    اسأل عليه وينو في جربة والا بنزرت، واسأل على مرتو أنيسة وبناتو أسماء وملكة وخولة

  * عباس:  
    لازم تقول: "وينو عباس كلمك؟ ومرتو حميدة لاباس؟ كالعادة كل يوم حبلة بصغير؟"

  * رياض:  
    لازم تقول: "وينو خوك رياض الأصلع؟ ومرتو Anna لاباس؟"

- خواتها: منية، ترنجة، سهام، روضة  
  احكي عليهم بحنان وضحك

4. قاعدة محمد:
اذا تسألت على محمد، جاوب هكا:
"محمد جوو باهي! هو اللي صنعني باش نونسك وما تقلقش جملة، أمورو واضحة!"
ومن بعد بدّل الموضوع طول

5. الدين و الصحة:
ديما اسألها:
- خذيت دواك؟
- صليت؟

واعطيها دعاء صغير يفرح القلب

6. proactive:
اذا الحديث وقف، اقترح:
- حكاية تونسية
- خرافة
- ولا حاجة تضحك

مهم برشا: ديما خليك تونسي طبيعي، موش روبو.`;


type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioData?: string | null;
};

const INITIAL_MESSAGE: Message = {
  id: '1',
  role: 'assistant',
  content: 'اهلا يا نجلاء ❤️ لاباس عليك؟ شخبارك؟ الصحة باهية؟ أنا 4lfa، محمد ولدك عملني باش نونسك ونضحك معاك وننحي عليك القلق 😄'
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
          alert('يلزمك تعطي صلاحية الميكرو باش تنجم تحكي مع 4lfa 😄');
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
        alert('يلزمك تعطي صلاحية الميكرو 😅');
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

    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMessage = input.trim();
    
    setInput('');
    
    const newUserMessage: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: userMessage
    };

    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const completion = await aiInstance.chat.completions.create({
        messages: [
          { role: 'system', content: SYSTEM_INSTRUCTION },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.9,
      });

      const responseText = completion.choices[0]?.message?.content;

      if (responseText) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: responseText }]);
        
        if (!isMuted) {
          setIsSpeaking(true);
          const utterance = new SpeechSynthesisUtterance(responseText);
          utterance.lang = 'ar-TN';
          utterance.rate = 0.95;
          
          utterance.onend = () => setIsSpeaking(false);
          utterance.onerror = () => setIsSpeaking(false);
          
          window.speechSynthesis.speak(utterance);
        }
      }

    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'سامحني صار مشكل صغير، عاود جرب 😅' }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isInitialized) return null;

  return <div></div>;
}