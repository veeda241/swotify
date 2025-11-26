import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, StopCircle, PlayCircle, Loader2 } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import { SYSTEM_INSTRUCTION_LIVE } from '../constants';

interface LiveSessionProps {
  onSessionEnd: (transcript: string) => void;
}

// Audio helpers
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const LiveSession: React.FC<LiveSessionProps> = ({ onSessionEnd }) => {
  const [isActive, setIsActive] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');

  // Refs for audio context and processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Accumulate transcriptions
  const currentInputTranscription = useRef('');
  const currentOutputTranscription = useRef('');

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(session => {
        session.close();
      }).catch(e => console.error("Error closing session", e));
      sessionPromiseRef.current = null;
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop all playing audio sources
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();

    setIsActive(false);
    setStatus('idle');
    
    // Trigger end callback with accumulated transcript
    onSessionEnd(transcript);
  }, [onSessionEnd, stream, transcript]);

  const startSession = async () => {
    try {
      setStatus('connecting');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setStream(mediaStream);

      // Initialize Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      // Connect to Gemini Live
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connection Opened');
            setStatus('connected');
            setIsActive(true);

            // Start Audio Stream
            const source = inputCtx.createMediaStreamSource(mediaStream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
            
            sourceRef.current = source;
            scriptProcessorRef.current = scriptProcessor;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
             if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                currentOutputTranscription.current += text;
              } else if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                currentInputTranscription.current += text;
              }
              
              if (message.serverContent?.turnComplete) {
                const turnText = `\nParent/Teacher: ${currentInputTranscription.current}\nAI: ${currentOutputTranscription.current}`;
                setTranscript(prev => prev + turnText);
                
                currentInputTranscription.current = '';
                currentOutputTranscription.current = '';
              }

            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              const ctx = audioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }
          },
          onclose: () => {
            console.log("Gemini Live Disconnected");
            setStatus('idle');
          },
          onerror: (err) => {
            console.error("Gemini Live Error", err);
            setStatus('error');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: SYSTEM_INSTRUCTION_LIVE,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error("Failed to start session", e);
      setStatus('error');
      setIsActive(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">
          {status === 'connected' ? 'Listening & Analyzing...' : 'Start Session'}
        </h2>
        <p className="text-slate-500">
          {status === 'connected' 
            ? 'Swotify is actively recording and analyzing the conversation.' 
            : 'Start the meeting to begin real-time analysis.'}
        </p>
      </div>

      <div className="relative w-full max-w-lg h-32 bg-slate-50 rounded-2xl flex items-center justify-center overflow-hidden mb-8 border border-slate-200">
        {status === 'connected' ? (
          <AudioVisualizer stream={stream} isActive={isActive} />
        ) : (
           <div className="flex items-center gap-2 text-slate-400">
             <div className="w-16 h-1 bg-slate-300 rounded-full"></div>
             <div className="w-8 h-1 bg-slate-300 rounded-full"></div>
             <div className="w-24 h-1 bg-slate-300 rounded-full"></div>
           </div>
        )}
      </div>

      <div className="flex gap-4">
        {status === 'idle' || status === 'error' ? (
          <button
            onClick={startSession}
            className="flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-semibold transition-all shadow-lg shadow-indigo-200"
          >
            <PlayCircle size={24} />
            Start Meeting
          </button>
        ) : status === 'connecting' ? (
           <button disabled className="flex items-center gap-3 px-8 py-4 bg-slate-200 text-slate-500 rounded-full font-semibold">
            <Loader2 className="animate-spin" size={24} />
            Connecting...
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-all shadow-lg shadow-red-200"
          >
            <StopCircle size={24} />
            End Session
          </button>
        )}
      </div>
      
      {transcript && (
          <div className="mt-8 w-full max-w-2xl bg-slate-50 p-4 rounded-xl max-h-40 overflow-y-auto text-sm text-slate-600 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2 text-xs uppercase tracking-wider">Live Transcript</h3>
              <pre className="whitespace-pre-wrap font-sans">{transcript}</pre>
          </div>
      )}
    </div>
  );
};

export default LiveSession;