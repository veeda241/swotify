import React, { useState } from 'react';
import { AppView, SessionReport, UserRole, User } from './types';
import { MOCK_REPORT } from './constants';
import { generateReportFromTranscript } from './services/geminiService';
import { DataService } from './services/dataService';
import LiveSession from './components/LiveSession';
import SessionReportView from './components/SessionReport';
import Login from './components/Login';
import AIChatBot from './components/AIChatBot';
import { StudentDashboard, TeacherDashboard, AdminDashboard, SuperAdminDashboard } from './components/RoleDashboards';
import { Mic, BarChart2, FileText, MessageSquare, Loader2, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.LOGIN);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentReport, setCurrentReport] = useState<SessionReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Authentication Handler
  const handleLogin = (role: UserRole) => {
    const user = DataService.login(role);
    setCurrentUser(user);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(AppView.LOGIN);
  };

  // Session Management
  const handleSessionEnd = async (transcript: string) => {
    setIsGenerating(true);
    try {
      const effectiveTranscript = transcript.length < 50 
        ? transcript + "\n(System note: Audio too short, using demo context)\n" + MOCK_REPORT.transcript
        : transcript;

      const analysis = await generateReportFromTranscript(effectiveTranscript);
      
      const newReport: SessionReport = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString(),
        transcript: transcript || "No audio detected.",
        summary: analysis.summary || "No summary generated.",
        metrics: analysis.metrics || [],
        swot: analysis.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] },
        topics: analysis.topics || []
      };

      setCurrentReport(newReport);
      setCurrentView(AppView.SESSION_REPORT);
    } catch (error) {
      console.error("Failed to generate report", error);
      alert("Analysis failed. Please check configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  // View Routing
  const renderView = () => {
    if (isGenerating) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Analyzing Conversation...</h2>
          <p className="text-slate-500 mt-2">Swotify AI is generating the SWOT analysis.</p>
        </div>
      );
    }

    switch (currentView) {
      case AppView.LOGIN:
        return <Login onLogin={handleLogin} />;
      
      case AppView.LIVE_SESSION:
        return (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="flex items-center text-slate-500 hover:text-indigo-600 mb-6 transition-colors">
              ← Back to Dashboard
            </button>
            <LiveSession onSessionEnd={handleSessionEnd} />
          </div>
        );

      case AppView.SESSION_REPORT:
        return currentReport ? (
          <SessionReportView report={currentReport} onBack={() => setCurrentView(AppView.DASHBOARD)} />
        ) : null;

      case AppView.DASHBOARD:
        if (!currentUser) return <Login onLogin={handleLogin} />;
        
        // Render Role-Based Dashboard
        switch (currentUser.role) {
          case 'STUDENT':
            return <StudentDashboard user={currentUser} onStartSession={() => {}} />;
          case 'TEACHER':
            return <TeacherDashboard user={currentUser} onStartSession={() => setCurrentView(AppView.LIVE_SESSION)} />;
          case 'ADMIN':
            return <AdminDashboard user={currentUser} onStartSession={() => {}} />;
          case 'SUPER_ADMIN':
            return <SuperAdminDashboard user={currentUser} onStartSession={() => {}} />;
          default:
            return <div>Unknown Role</div>;
        }

      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navigation - Only show if logged in */}
      {currentUser && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center cursor-pointer" onClick={() => setCurrentView(AppView.DASHBOARD)}>
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-xl">S</span>
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Swotify</span>
                <span className="ml-3 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                  {currentUser.role}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-500 hidden sm:block">Welcome, {currentUser.name}</span>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">
        {renderView()}
      </main>

      {/* Global AI Chatbot - Always available when logged in */}
      {currentUser && <AIChatBot currentUser={currentUser} />}
    </div>
  );
};

export default App;
