import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream: MediaStream | null;
  isActive: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream || !isActive || !canvasRef.current) return;

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isActive) return;
      
      requestRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(248, 250, 252)'; // slate-50 matches bg
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        // Gradient color from blue to purple
        const gradient = canvasCtx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#818cf8'); // indigo-400
        gradient.addColorStop(1, '#c084fc'); // purple-400

        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (sourceRef.current) sourceRef.current.disconnect();
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [stream, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg"
    />
  );
};

export default AudioVisualizer;