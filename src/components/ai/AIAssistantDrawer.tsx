import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';

export const AIAssistantDrawer: React.FC = () => {
  const {
    isAIAssistantOpen,
    setIsAIAssistantOpen,
    assistantMessages,
    sendAssistantQuery,
    clearAssistantHistory,
  } = useSecurity();

  const [inputPrompt, setInputPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages]);

  const sampleQuestions = [
    'Why is Alex high risk?',
    'What happened during the latest critical incident?',
    'Show me the highest-risk user.',
    "Summarize today's threats.",
    'Why was this incident created?',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim()) return;
    sendAssistantQuery(inputPrompt.trim());
    setInputPrompt('');
  };

  const handleSampleClick = (q: string) => {
    sendAssistantQuery(q);
  };

  if (!isAIAssistantOpen) {
    return (
      <button
        onClick={() => setIsAIAssistantOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-neutral-900 border border-neutral-700/80 shadow-2xl text-xs font-semibold text-neutral-100 hover:border-cyan-500/70 hover:bg-neutral-800 transition-all hover:scale-105 group"
      >
        <div className="relative">
          <Bot className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform" />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
        </div>
        <span>NEXRA AI Analyst</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[95vw] sm:w-[460px] h-[580px] max-h-[90vh] flex flex-col rounded-xl border border-neutral-800 bg-neutral-950/95 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Drawer Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-cyan-950/70 border border-cyan-800/60">
            <Bot className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              NEXRA Security Assistant
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-neutral-400">
              Grounded exclusively in prototype telemetry & incident state
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={clearAssistantHistory}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsAIAssistantOpen(false)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Questions Carousel */}
      <div className="px-3 py-2 border-b border-neutral-800/70 bg-neutral-950/80 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
        <span className="text-[10px] text-neutral-500 font-semibold shrink-0 uppercase tracking-wider">
          Suggested:
        </span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSampleClick(q)}
            className="px-2 py-1 text-[11px] rounded bg-neutral-900 text-neutral-300 hover:text-cyan-300 hover:bg-neutral-800 border border-neutral-800 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
        {assistantMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-lg p-3 ${
                  isUser
                    ? 'bg-cyan-600 text-neutral-950 font-medium rounded-br-none'
                    : 'bg-neutral-900/90 border border-neutral-800 text-neutral-200 rounded-bl-none'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    <span>NEXRA Reasoning Core</span>
                  </div>
                )}
                <div className="whitespace-pre-line text-xs leading-relaxed">
                  {msg.text}
                </div>

                {/* Recommendations if any */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-neutral-800/80 space-y-1">
                    <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      Recommended Next Actions:
                    </span>
                    <ul className="space-y-0.5 text-[11px] text-neutral-300">
                      {msg.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-cyan-400 font-mono">›</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-neutral-500 font-mono mt-1 px-1">
                {msg.timestamp}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-neutral-800 bg-neutral-900/90 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask anything about active threats, users, or scores..."
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-md px-3 py-1.5 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/70"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim()}
          className="p-2 rounded-md bg-cyan-500 text-neutral-950 font-bold hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Send query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
