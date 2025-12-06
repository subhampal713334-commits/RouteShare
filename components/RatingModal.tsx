import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  personName: string;
  personAvatar: string;
  onSubmit: (rating: number, comment: string) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({ isOpen, onClose, personName, personAvatar, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = () => {
    onSubmit(rating, comment);
    onClose();
    setRating(0);
    setComment("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
           {/* Backdrop */}
           <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl"
          >
            <button onClick={onClose} className="absolute right-4 top-4 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                <X size={20} />
            </button>

            <div className="text-center mt-2">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 p-1 bg-gradient-to-tr from-violet-500 to-blue-500 shadow-lg">
                    <img src={personAvatar} alt={personName} className="w-full h-full rounded-full object-cover border-2 border-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Rate {personName}</h3>
                <p className="text-slate-500 text-sm mb-6">How was your ride experience?</p>

                <div className="flex justify-center space-x-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                            key={star}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star 
                                size={36} 
                                className={`${rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} transition-colors duration-200`} 
                                strokeWidth={rating >= star ? 0 : 1.5}
                            />
                        </button>
                    ))}
                </div>

                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a compliment (optional)..."
                    className="w-full bg-slate-50 rounded-xl p-3 text-sm border-none outline-none focus:ring-2 focus:ring-violet-500/20 mb-4 h-24 resize-none text-slate-700"
                />

                <button
                    onClick={handleSubmit}
                    disabled={rating === 0}
                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg shadow-violet-500/30 transition-all active:scale-[0.98] ${rating > 0 ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-300 cursor-not-allowed shadow-none'}`}
                >
                    Submit Review
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
