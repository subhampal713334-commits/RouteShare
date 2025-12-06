import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Navigation, Loader2, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../services/db';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    
    try {
      let user;
      if (isLogin) {
        user = await api.auth.login(formData.email, formData.password);
        onLogin(user);
      } else {
        user = await api.auth.signup(formData.name, formData.email, formData.password);
        onLogin(user); // Will only reach here if email confirmation is disabled in Supabase
      }
    } catch (error: any) {
      // Handle "Email not confirmed" cases (Supabase specific or standardized)
      if (error.message === "CONFIRM_EMAIL" || error.message.includes("Email not confirmed")) {
        setSuccessMsg("Check your inbox! You need to verify your email address before logging in.");
        setErrorMsg("");
        setIsLogin(true); // Switch to login view so they can try after clicking link
      } 
      else if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("Invalid email or password.");
      }
      else {
        // Only log actual unexpected errors to console to avoid user confusion
        console.error("Auth Error:", error);
        setErrorMsg(error.message || "Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-br from-blue-600 via-violet-600 to-violet-800 rounded-b-[3rem] z-0">
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
                <Navigation size={32} className="text-white transform -rotate-45" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800">RouteShare</h1>
            <p className="text-slate-400 font-medium">Ride together, save together.</p>
        </div>

        {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-semibold text-center flex flex-col items-center">
                <span>{errorMsg}</span>
            </div>
        )}

        {successMsg && (
            <div className="mb-4 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm font-semibold text-center flex flex-col items-center animate-pulse">
                <Info size={20} className="mb-2" />
                <span>{successMsg}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Full Name</label>
              <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-all">
                <User size={18} className="text-slate-400 mr-3" />
                <input 
                  type="text" 
                  required={!isLogin}
                  placeholder="John Doe"
                  className="bg-transparent border-none outline-none text-slate-800 text-sm w-full font-medium"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Email</label>
            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-all">
              <Mail size={18} className="text-slate-400 mr-3" />
              <input 
                type="email" 
                required
                placeholder="hello@example.com"
                className="bg-transparent border-none outline-none text-slate-800 text-sm w-full font-medium"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 ml-1 uppercase">Password</label>
            <div className="flex items-center bg-slate-50 rounded-xl px-4 py-3 border border-slate-100 focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-200 transition-all">
              <Lock size={18} className="text-slate-400 mr-3" />
              <input 
                type="password" 
                required
                placeholder="••••••••"
                className="bg-transparent border-none outline-none text-slate-800 text-sm w-full font-medium"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-violet-500/30 flex items-center justify-center hover:bg-violet-700 transition-all active:scale-[0.98] mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
                <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} className="ml-2" />
                </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className="text-slate-500 text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                    onClick={() => { setIsLogin(!isLogin); setErrorMsg(""); setSuccessMsg(""); }}
                    className="ml-1 text-violet-600 font-bold hover:underline"
                >
                    {isLogin ? 'Sign Up' : 'Log In'}
                </button>
            </p>
        </div>
      </motion.div>
      
      <p className="mt-8 text-slate-400 text-xs text-center max-w-xs leading-relaxed">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};