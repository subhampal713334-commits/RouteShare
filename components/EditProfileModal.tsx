import React, { useState } from 'react';
import { User } from '../types';
import { GARDEN_AVATARS } from '../constants';
import { X, Check, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSave: (name: string, avatar: string) => Promise<void>;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, currentUser, onSave }) => {
  const [name, setName] = useState(currentUser.name);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await onSave(name, selectedAvatar);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h2 className="text-xl font-extrabold text-slate-800">Edit Profile</h2>
                <button 
                  onClick={onClose}
                  className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
            </div>

            <div className="p-6 overflow-y-auto">
                {/* Current Avatar Preview */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-violet-500 to-blue-500 shadow-lg mb-3 relative">
                        <img src={selectedAvatar} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-white" />
                        <div className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-sm border border-slate-100 text-slate-600">
                            <Camera size={14} />
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 font-medium">Tap below to change look</p>
                </div>

                {/* Name Input */}
                <div className="space-y-2 mb-6">
                    <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-medium text-slate-800"
                        placeholder="Your Name"
                    />
                </div>

                {/* Avatar Grid */}
                <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Choose Avatar</label>
                    <div className="grid grid-cols-4 gap-3">
                        {GARDEN_AVATARS.map((avatar, idx) => (
                            <button 
                                key={idx}
                                onClick={() => setSelectedAvatar(avatar)}
                                className={`aspect-square rounded-xl overflow-hidden relative transition-all ${selectedAvatar === avatar ? 'ring-2 ring-violet-600 ring-offset-2 scale-95' : 'hover:opacity-80'}`}
                            >
                                <img src={avatar} className="w-full h-full object-cover" alt="Avatar Option" />
                                {selectedAvatar === avatar && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                        <Check size={20} className="text-white drop-shadow-md" />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0">
                <button 
                    onClick={handleSave}
                    disabled={loading || !name.trim()}
                    className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl shadow-xl shadow-violet-500/30 flex items-center justify-center hover:bg-violet-700 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};