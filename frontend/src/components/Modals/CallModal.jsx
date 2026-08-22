import React, { useState, useEffect } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';

export const CallModal = ({ isOpen, callType, contactName, contactPic, onClose }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setDuration(0);
      setIsMuted(false);
      setIsVideoOff(false);
      return;
    }
    const timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-devs-bg/95 backdrop-blur-xl flex flex-col items-center justify-between p-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col items-center text-center space-y-2 mt-8">
        <span className="text-xs uppercase font-bold tracking-widest text-devs-cyan animate-pulse">
          Chime Real-Time {callType === 'video' ? 'Video' : 'Audio'} Call
        </span>
        <h2 className="text-2xl font-extrabold text-white">{contactName}</h2>
        <span className="text-sm font-mono text-devs-textMuted">{formatTimer(duration)}</span>
      </div>

      {/* Center Video/Avatar Container */}
      <div className="relative w-full max-w-lg aspect-video rounded-3xl bg-devs-card border border-devs-border shadow-card-dark overflow-hidden flex items-center justify-center">
        {callType === 'video' && !isVideoOff ? (
          <div className="w-full h-full bg-gradient-to-tr from-devs-surface via-devs-card to-devs-active flex items-center justify-center relative">
            {contactPic ? (
              <img src={contactPic} alt={contactName} className="w-full h-full object-cover opacity-80" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-devs-blue/30 border border-devs-blue flex items-center justify-center text-3xl font-bold text-devs-blue">
                {contactName?.charAt(0)}
              </div>
            )}
            <div className="absolute bottom-4 right-4 w-28 h-20 rounded-xl bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-xs text-white">
              Self Camera
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-32 h-32 rounded-full bg-devs-blue/20 border-2 border-devs-blue flex items-center justify-center font-bold text-4xl text-devs-blue shadow-glow-blue animate-pulse">
              {contactPic ? (
                <img src={contactPic} alt={contactName} className="w-full h-full rounded-full object-cover" />
              ) : (
                contactName?.charAt(0)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex items-center gap-6 mb-8">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-2xl border transition-all ${
            isMuted ? 'bg-red-500/20 border-red-500 text-red-400' : 'glass-card border-devs-border text-white hover:bg-devs-hover'
          }`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        {callType === 'video' && (
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-4 rounded-2xl border transition-all ${
              isVideoOff ? 'bg-red-500/20 border-red-500 text-red-400' : 'glass-card border-devs-border text-white hover:bg-devs-hover'
            }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}

        <button
          onClick={onClose}
          className="p-5 rounded-2xl bg-red-600 hover:bg-red-700 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
          title="End Call"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
};
