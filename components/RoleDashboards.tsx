import React, { useState } from 'react';
import { User, Achievement } from '../types';
import { DataService } from '../services/dataService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Plus, Users, BookOpen, TrendingUp, AlertOctagon, Terminal, Play, Save } from 'lucide-react';

interface DashboardProps {
  user: User;
  onStartSession: (studentId?: string) => void;
}

// --- STUDENT DASHBOARD ---
export const StudentDashboard: React.FC<DashboardProps> = ({ user }) => {
  const achievements = DataService.getAchievements(user.id);

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {user.name} 👋</h1>
      <p className="text-slate-500 mb-8">Here is your academic performance overview.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <span className="text-slate-600 font-medium">Total Activities</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">{achievements.length}</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
             <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-slate-600 font-medium">Average Score</span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {achievements.length > 0 
              ? Math.round(achievements.reduce((acc, curr) => acc + curr.score, 0) / achievements.length) 
              : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={achievements}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="title" hide />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Recent Achievements</h3>
          <div className="space-y-4">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="font-semibold text-slate-800">{ach.title}</h4>
                  <p className="text-sm text-slate-500">{ach.type} • {ach.date}</p>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`font-bold ${ach.score >= 80 ? 'text-green-600' : ach.score >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {ach.score}/{ach.maxScore}
                   </span>
                </div>
              </div>
            ))}
            {achievements.length === 0 && <p className="text-slate-400">No records found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- TEACHER DASHBOARD ---
export const TeacherDashboard: React.FC<DashboardProps> = ({ user, onStartSession }) => {
  const students = DataService.getStudentsByTeacher(user.id);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAchievement, setNewAchievement] = useState({ title: '', score: '', maxScore: '100', type: 'Academic', description: '' });

  const handleAddAchievement = () => {
    if (!selectedStudent || !newAchievement.title || !newAchievement.score) return;
    DataService.addAchievement({
      studentId: selectedStudent,
      title: newAchievement.title,
      score: Number(newAchievement.score),
      maxScore: Number(newAchievement.maxScore),
      type: newAchievement.type as any,
      description: newAchievement.description,
      date: new Date().toLocaleDateString()
    });
    setShowAddForm(false);
    setNewAchievement({ title: '', score: '', maxScore: '100', type: 'Academic', description: '' });
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Class Dashboard</h1>
          <p className="text-slate-500">Manage Grade 4-A Students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-semibold text-lg">Student Roster</h3>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Avg Score</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(student => {
                  const studentAch = DataService.getAchievements(student.id);
                  const avg = studentAch.length > 0 
                    ? Math.round(studentAch.reduce((a, b) => a + b.score, 0) / studentAch.length) 
                    : 0;
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{student.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-sm font-semibold ${avg >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                          {avg}%
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => { setSelectedStudent(student.id); setShowAddForm(true); }}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          Add Grade
                        </button>
                        <button 
                          onClick={() => onStartSession(student.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Play size={12} /> Meeting
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit">
           <h3 className="font-semibold text-lg mb-4">Quick Stats</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
               <span className="text-slate-600">Total Students</span>
               <span className="font-bold text-slate-900">{students.length}</span>
             </div>
             <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
               <span className="text-slate-600">Class Average</span>
               <span className="font-bold text-indigo-600">85%</span>
             </div>
           </div>
        </div>
      </div>

      {showAddForm && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4">Add Achievement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input 
                  type="text" 
                  value={newAchievement.title}
                  onChange={e => setNewAchievement({...newAchievement, title: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg" 
                  placeholder="e.g. Math Quiz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Score</label>
                   <input 
                    type="number" 
                    value={newAchievement.score}
                    onChange={e => setNewAchievement({...newAchievement, score: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg" 
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Max Score</label>
                   <input 
                    type="number" 
                    value={newAchievement.maxScore}
                    onChange={e => setNewAchievement({...newAchievement, maxScore: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg" 
                   />
                </div>
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea 
                  value={newAchievement.description}
                  onChange={e => setNewAchievement({...newAchievement, description: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg h-24" 
                />
              </div>
              <div className="flex gap-2 justify-end mt-4">
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button onClick={handleAddAchievement} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- ADMIN DASHBOARD ---
export const AdminDashboard: React.FC<DashboardProps> = () => {
  const allStudents = DataService.getAllStudents();
  const classes = DataService.getClasses();

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">School Administration</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <span className="text-slate-500 text-sm">Total Students</span>
           <p className="text-3xl font-bold text-slate-900 mt-2">{allStudents.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <span className="text-slate-500 text-sm">Active Classes</span>
           <p className="text-3xl font-bold text-slate-900 mt-2">{classes.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
           <span className="text-slate-500 text-sm">Average Attendance</span>
           <p className="text-3xl font-bold text-emerald-600 mt-2">94%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-semibold text-lg mb-6">Class Performance Overview</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classes.map(c => ({ name: c.name, score: 85 }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// --- SUPER ADMIN DASHBOARD ---
export const SuperAdminDashboard: React.FC<DashboardProps> = () => {
  const logs = DataService.getLogs();

  return (
    <div className="max-w-7xl mx-auto p-8 bg-slate-900 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <Terminal className="text-emerald-400" size={32} />
        <h1 className="text-3xl font-bold text-white">System Developer Console</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-4 bg-slate-950 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-slate-300 font-mono text-sm">System Logs</h3>
            <span className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="p-4 font-mono text-xs overflow-y-auto h-96 space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex gap-2">
                <span className="text-slate-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                <span className={`${log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-amber-400' : 'text-blue-400'}`}>
                  {log.level}
                </span>
                <span className="text-slate-300">{log.source}:</span>
                <span className="text-slate-100">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
             <h3 className="text-white font-semibold mb-4">System Controls</h3>
             <div className="space-y-4">
               <button onClick={() => alert('Data reset simulation')} className="w-full p-3 bg-red-500/10 text-red-400 border border-red-500/50 rounded-lg hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                 <AlertOctagon size={18} /> Reset All Data
               </button>
               <button onClick={() => DataService.log('INFO', 'Manual debug triggered', 'DevUser')} className="w-full p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/50 rounded-lg hover:bg-indigo-500/20 transition-colors flex items-center justify-center gap-2">
                 <Terminal size={18} /> Trigger Debug Log
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
