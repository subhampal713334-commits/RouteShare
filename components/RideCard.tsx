import React from 'react';
import { Ride } from '../types';
import { Star, CarFront, User } from 'lucide-react';

interface RideCardProps {
  ride: Ride;
  onClick: (ride: Ride) => void;
}

export const RideCard: React.FC<RideCardProps> = ({ ride, onClick }) => {
  return (
    <div 
      onClick={() => onClick(ride)}
      className="bg-white rounded-2xl p-4 mb-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-slate-100 active:scale-[0.98] transform transition-transform"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <img 
            src={ride.avatar} 
            alt={ride.name} 
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&h=400&fit=crop"; // Fallback nature image
            }}
            className="w-14 h-14 rounded-xl object-cover bg-slate-200"
          />
          <div className="ml-3">
            <h3 className="text-slate-900 font-bold text-lg leading-tight">{ride.name}</h3>
            <div className="flex items-center mt-1 text-slate-400 text-xs font-medium">
              <CarFront size={14} className="mr-1" />
              <span>{ride.car}</span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-violet-600 text-xl font-bold">₹{ride.price}</div>
          <div className="mt-1 bg-slate-100 px-2 py-1 rounded-full inline-block">
            <span className="text-slate-500 text-xs font-semibold">{ride.seatsLeft} seats left</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center flex-1">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 flex-shrink-0"></div>
          <div className="flex flex-col">
            <span className="text-slate-900 font-bold text-sm truncate max-w-[120px]">{ride.from}</span>
            <span className="text-slate-400 text-xs">To {ride.to}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
            <span className="text-slate-600 font-bold text-xs">{ride.eta}</span>
          </div>
          <div className="flex items-center bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100">
            <Star size={12} className="text-amber-400 fill-current mr-1" />
            <span className="text-slate-600 font-bold text-xs">{ride.rating}</span>
          </div>
        </div>
      </div>
    </div>
  );
};