import React, { useState } from 'react';
import { SessionReport, AppView } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { ArrowLeft, MessageSquare, Shield, AlertTriangle, Zap, Target } from 'lucide-react';
import { chatWithInsight } from '../services/geminiService';
import { Loader2, Send } from 'lucide-react';

interface SessionReportProps {
  report: SessionReport;
  onBack: () => void;
}

const SessionReportView: React.FC<SessionReportProps> = ({ report, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'swot' | 'chat'>('overview');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      const apiHistory = chatHistory.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }));
      
      const response = await chatWithInsight(apiHistory, userMsg, report.transcript);
      setChatHistory(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      console.error(e);
      setChatHistory(prev => [...prev, { role: 'model', text: "Sorry, I couldn't process that request right now." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft size={16} className="mr-1" /> Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-slate-900">Session Report</h1>
          <p className="text-slate-500">{report.date} • {report.topics.join(', ')}</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('swot')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'swot' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            SWOT Analysis
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'chat' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Insights Chat
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             {/* Summary Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Executive Summary</h3>
              <p className="text-slate-600 leading-relaxed">{report.summary}</p>
            </div>

            {/* Bar Chart Metrics */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Key Metrics</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report.metrics} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 12, fill: '#64748b'}} />
                    <RechartsTooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="score" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Radar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Balance Check</h3>
              <div className="h-64 w-full flex items-center justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={report.metrics}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Student" dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transcript Preview */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-96 overflow-hidden flex flex-col">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Transcript</h3>
              <div className="flex-1 overflow-y-auto pr-2">
                 <p className="text-sm text-slate-600 whitespace-pre-wrap font-mono">{report.transcript}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SWOT Tab */}
      {activeTab === 'swot' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <Shield size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Strengths</h3>
            </div>
            <ul className="space-y-2">
              {report.swot.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Weaknesses</h3>
            </div>
            <ul className="space-y-2">
              {report.swot.weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Opportunities</h3>
            </div>
            <ul className="space-y-2">
              {report.swot.opportunities.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <Target size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Threats</h3>
            </div>
            <ul className="space-y-2">
              {report.swot.threats.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-slate-700">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="max-w-3xl mx-auto h-[600px] bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="font-semibold text-slate-800">Ask Swotify about this session</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatHistory.length === 0 && (
              <div className="text-center text-slate-400 mt-20">
                <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                <p>Ask anything! e.g., "What was the main concern about math?"</p>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-100 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none">
                  <Loader2 className="animate-spin text-slate-400" size={20} />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100">
            <div className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your question..."
                className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={handleSendMessage}
                disabled={!chatInput.trim() || isChatLoading}
                className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionReportView;
