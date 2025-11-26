import React from 'react';
import { UserRole } from '../types';
import { Shield, GraduationCap, School, Code } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to Swotify</h1>
          <p className="text-slate-500">Select your role to login</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => onLogin('STUDENT')}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
          >
            <GraduationCap className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Student</span>
          </button>

          <button
            onClick={() => onLogin('TEACHER')}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
          >
            <School className="w-8 h-8 text-slate-400 group-hover:text-emerald-600 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-emerald-700">Teacher</span>
          </button>

          <button
            onClick={() => onLogin('ADMIN')}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <Shield className="w-8 h-8 text-slate-400 group-hover:text-purple-600 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-purple-700">Admin</span>
          </button>

          <button
            onClick={() => onLogin('SUPER_ADMIN')}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 transition-all group"
          >
            <Code className="w-8 h-8 text-slate-400 group-hover:text-slate-800 mb-3" />
            <span className="font-semibold text-slate-700 group-hover:text-slate-900">Developer</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
