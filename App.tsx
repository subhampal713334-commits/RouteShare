import React, { useState, useMemo, useEffect } from 'react';
import { Ride, Tab, ChatSession, User } from './types';
import { RideCard } from './components/RideCard';
import { BottomNavigation } from './components/BottomNavigation';
import { Modal } from './components/Modal';
import { ChatInterface } from './components/ChatInterface';
import { EditProfileModal } from './components/EditProfileModal';
import { AuthScreen } from './components/AuthScreen';
import { Search, ArrowRight, MapPin, Calendar, Clock, Sparkles, MessageCircle, Star, Car, Loader2, Navigation, LogOut, ChevronDown, User as UserIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/db';
import { parseSearchQuery } from './services/ai';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>("home");
  const [search, setSearch] = useState("");
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Search State
  const [searchFilters, setSearchFilters] = useState<{from?: string, to?: string, vehicleType?: string} | null>(null);
  
  // Selection States
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  
  // AI State
  const [aiProcessing, setAiProcessing] = useState(false);

  // Post Ride Form State
  const [postForm, setPostForm] = useState({
    from: "",
    to: "",
    date: "",
    time: "",
    price: "",
    seats: "1",
    vehicleType: "" as string
  });

  // Check Login Status on Mount
  useEffect(() => {
    const checkUser = async () => {
        try {
            const u = await api.auth.getCurrentUser();
            if (u) setUser(u);
        } catch (e) {
            console.log("No active session");
        }
    };
    checkUser();
  }, []);

  // Load Initial Data when user is logged in
  useEffect(() => {
    if (user) {
        loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const data = await api.rides.list();
    setRides(data);
    setLoading(false);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setTab('home');
    setActiveChat(null);
  };

  const filtered = useMemo(() => {
    // 1. Priority: Structured Filters (from AI or parsed)
    if (searchFilters) {
        return rides.filter(r => {
            let match = true;
            if (searchFilters.from) {
                match = match && r.from.toLowerCase().includes(searchFilters.from.toLowerCase());
            }
            if (searchFilters.to) {
                match = match && r.to.toLowerCase().includes(searchFilters.to.toLowerCase());
            }
            if (searchFilters.vehicleType) {
                match = match && r.vehicleType.toLowerCase().includes(searchFilters.vehicleType.toLowerCase());
            }
            return match;
        });
    }

    // 2. Fallback: Simple text matching
    const q = search.trim().toLowerCase();
    if (!q) return rides;

    // Simple "From X to Y" manual parsing fallback
    if (q.includes(' to ')) {
        const parts = q.split(' to ');
        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
            const f = parts[0].trim();
            const t = parts[1].trim();
            // Try strict "from -> to" match first
            const strictMatches = rides.filter(r => 
                r.from.toLowerCase().includes(f) && 
                r.to.toLowerCase().includes(t)
            );
            if (strictMatches.length > 0) return strictMatches;
        }
    }

    return rides.filter((r) => 
      r.from.toLowerCase().includes(q) || 
      r.to.toLowerCase().includes(q) ||
      r.vehicleType.toLowerCase().includes(q)
    );
  }, [rides, search, searchFilters]);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;

    setAiProcessing(true);
    setSearchFilters(null); // Clear previous structured filters

    try {
        // Use Gemini to extract intent
        const intent = await parseSearchQuery(search);
        
        if (intent && (intent.from || intent.to || intent.vehicleType)) {
             console.log("AI Parsed Intent:", intent);
             setSearchFilters(intent);
        } else {
            // Fallback: If AI fails but we have " to ", try manual strict filter
            if (search.toLowerCase().includes(' to ')) {
                 const parts = search.toLowerCase().split(' to ');
                 if (parts.length === 2) {
                     setSearchFilters({ from: parts[0].trim(), to: parts[1].trim() });
                 }
            }
        }
    } catch (err) {
        console.error("Search processing error", err);
    }

    setAiProcessing(false);
    setTab("find");
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      // If user starts typing, clear the strict filters to allow free search again
      if (searchFilters) setSearchFilters(null);
  };

  const handleRequestRide = async () => {
    if (!selectedRide || !user) return;
    
    // Note: Self-request check removed to enable easy testing of chat functionality
    
    try {
        const chat = await api.chats.initiate(selectedRide);
        setSelectedRide(null);
        setActiveChat(chat);
        setTab("chat"); // Background tab
    } catch (e: any) {
        console.error("Request Error:", e);
        // Safely extract message from different error types
        const msg = e.message || (typeof e === 'string' ? e : JSON.stringify(e));
        alert(`Failed to request ride: ${msg}`);
    }
  };

  const handlePostRide = async () => {
    if (!postForm.from || !postForm.to || !postForm.price || !user || !postForm.vehicleType) {
        alert("Please fill in all required fields, including Vehicle Type.");
        return;
    }

    try {
        const newRide = await api.rides.create({
            name: user.name,
            from: postForm.from,
            to: postForm.to,
            price: Number(postForm.price),
            seatsLeft: Number(postForm.seats),
            car: postForm.vehicleType + " (Verify)",
            vehicleType: postForm.vehicleType,
            date: postForm.date || new Date().toISOString(),
            time: postForm.time || "Now",
        });

        setRides(prev => [newRide, ...prev]);
        setPostModalVisible(false);
        setTab("home");
        // Reset form
        setPostForm({ from: "", to: "", date: "", time: "", price: "", seats: "1", vehicleType: "" });
    } catch (error: any) {
        alert("Error creating ride: " + (error.message || "Unknown error"));
    }
  };

  const handleUpdateProfile = async (newName: string, newAvatar: string) => {
    if (!user) return;
    try {
        const updatedUser = await api.auth.updateProfile(user.id, {
            name: newName,
            avatar: newAvatar
        });
        setUser(updatedUser);
    } catch (e) {
        console.error("Failed to update profile", e);
        alert("Failed to update profile. Please try again.");
    }
  };

  // --- Sub-components for Tabs ---

  const ChatList = () => {
    const [chats, setChats] = useState<ChatSession[]>([]);
    
    useEffect(() => {
        api.chats.list().then(setChats);
    }, [activeChat]); // Refresh when coming back from a chat

    if (chats.length === 0) {
        return (
            <div className="pt-20 text-center">
                 <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle size={32} className="text-slate-400" />
                 </div>
                 <h2 className="text-xl font-bold text-slate-800">No Messages</h2>
                 <p className="text-slate-500 mt-2 px-8">Request a ride to start a conversation with a driver.</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 mt-4">
            {chats.map(chat => {
                const other = chat.participants.find(p => p.id !== user?.id) || chat.participants[0];
                return (
                    <div 
                        key={chat.id}
                        onClick={() => setActiveChat(chat)}
                        className="bg-white p-4 rounded-xl flex items-center shadow-sm border border-slate-100 active:bg-slate-50 hover:bg-slate-50/80 transition-colors"
                    >
                        <img 
                            src={other.avatar} 
                            className="w-12 h-12 rounded-full object-cover" 
                            alt="User"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&h=400&fit=crop";
                            }}
                        />
                        <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-slate-800">{other.name}</h3>
                                <span className="text-[10px] text-slate-400">
                                    {new Date(chat.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderContent = () => {
    switch(tab) {
      case "home":
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="pb-32"
          >
            {/* Promo Card */}
            <div className="bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-blue-500/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
               <div className="relative z-10">
                 <div className="flex items-center space-x-2 mb-2">
                   <Sparkles size={18} className="text-yellow-300" />
                   <h3 className="font-bold text-lg">AI Smart Match</h3>
                 </div>
                 <p className="text-blue-100 text-sm mb-4">Type "Bike to Cyber Hub" and let AI find your ride.</p>
                 <button 
                   onClick={() => { setTab('find'); setTimeout(() => document.getElementById('search-input')?.focus(), 100); }}
                   className="bg-white text-violet-700 px-4 py-2 rounded-full text-xs font-bold hover:bg-blue-50 transition-colors"
                 >
                   Try Smart Search
                 </button>
               </div>
            </div>

            {/* Nearby Header */}
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-slate-800 font-bold text-xl">Recent Rides</h2>
              <button 
                onClick={() => setTab('find')}
                className="text-slate-500 text-sm font-semibold hover:text-blue-600 transition-colors"
              >
                See all
              </button>
            </div>

            {/* Rides List */}
            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-600" /></div>
            ) : (
                <div>
                {/* Show more items (6) on the home screen */}
                {rides.slice(0, 6).map(ride => (
                    <RideCard key={ride.id} ride={ride} onClick={setSelectedRide} />
                ))}
                </div>
            )}
          </motion.div>
        );

      case "find":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
             <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 min-h-[60vh] border border-slate-100">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Find Rides</h2>
                
                {searchFilters ? (
                    <div className="flex flex-wrap gap-2 mb-6 animate-in fade-in zoom-in duration-300">
                        {searchFilters.from && (
                            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-blue-200">
                                From: {searchFilters.from}
                            </span>
                        )}
                        {searchFilters.to && (
                            <span className="bg-violet-100 text-violet-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-violet-200">
                                To: {searchFilters.to}
                            </span>
                        )}
                        {searchFilters.vehicleType && (
                            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center border border-slate-200">
                                Vehicle: {searchFilters.vehicleType}
                            </span>
                        )}
                        <button 
                            onClick={() => { setSearchFilters(null); setSearch(""); }} 
                            className="bg-slate-50 hover:bg-slate-100 text-slate-400 p-1 rounded-full transition-colors ml-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ) : (
                    <p className="text-slate-500 mb-6">Showing results for "{search || 'all'}"</p>
                )}

                {aiProcessing && <div className="text-sm text-violet-600 mb-4 flex items-center animate-pulse"><Sparkles size={14} className="mr-2"/> AI is optimizing your search...</div>}
                
                {filtered.length > 0 ? (
                  filtered.map(ride => (
                    <RideCard key={ride.id} ride={ride} onClick={setSelectedRide} />
                  ))
                ) : (
                  <div className="text-center py-20">
                     <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} className="text-slate-300" />
                     </div>
                     <p className="text-slate-500 font-medium">No rides found matching your criteria.</p>
                     <button onClick={() => { setSearch(''); setSearchFilters(null); }} className="mt-4 text-violet-600 text-sm font-bold hover:underline">Clear Filters</button>
                  </div>
                )}
            </div>
          </motion.div>
        );

      case "chat":
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
            <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 min-h-[60vh] border border-slate-100">
                <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Messages</h2>
                <ChatList />
            </div>
          </motion.div>
        );

      case "profile":
        if (!user) return null;
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
             <div className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 mb-6 border border-slate-100">
                 <div className="flex flex-col items-center">
                   <div className="w-24 h-24 rounded-full border-4 border-slate-50 shadow-lg overflow-hidden mb-4 relative">
                     <img 
                        src={user.avatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&h=400&fit=crop";
                        }}
                     />
                     {user.rating && (
                         <div className="absolute -bottom-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full border-4 border-white shadow-sm">
                             <Star size={12} className="fill-current" />
                         </div>
                     )}
                   </div>
                   <h2 className="text-2xl font-extrabold text-slate-800">{user.name}</h2>
                   <p className="text-slate-500 font-medium mb-4">Verified Yatri 🇮🇳</p>
                   
                   {user.rating && (
                       <div className="flex items-center bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 w-full justify-center space-x-8">
                           <div className="text-center">
                               <div className="flex items-center justify-center text-slate-800 font-bold text-lg">
                                   <Star size={18} className="text-amber-400 fill-current mr-1.5" />
                                   {user.rating}
                               </div>
                               <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Rating</p>
                           </div>
                           <div className="w-px h-8 bg-slate-200"></div>
                           <div className="text-center">
                               <div className="text-slate-800 font-bold text-lg">
                                   {user.tripsCount || 0}
                               </div>
                               <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Trips</p>
                           </div>
                       </div>
                   )}
                 </div>
             </div>
             
             <div className="space-y-3">
               <button 
                 onClick={() => setEditProfileModalVisible(true)}
                 className="w-full bg-white p-4 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-all text-slate-700 font-medium border border-slate-100"
               >
                 <span>Edit Profile</span>
                 <ArrowRight size={16} className="text-slate-400" />
               </button>

               {['Payment Methods', 'Ride History', 'Settings'].map((item, i) => (
                 <button key={i} className="w-full bg-white p-4 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-all text-slate-700 font-medium border border-slate-100">
                   <span>{item}</span>
                   <ArrowRight size={16} className="text-slate-400" />
                 </button>
               ))}
               
               <button 
                 onClick={handleLogout}
                 className="w-full bg-red-50 p-4 rounded-xl flex justify-between items-center shadow-sm hover:shadow-md transition-all text-red-600 font-medium border border-red-100 mt-4"
               >
                 <span>Log Out</span>
                 <LogOut size={16} />
               </button>
             </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // If no user, show auth screen
  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  const isOwnRide = selectedRide?.hostId === user?.id;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center">
      {/* Full Screen Chat Overlay */}
      {activeChat && (
          <ChatInterface session={activeChat} currentUser={user} onBack={() => setActiveChat(null)} />
      )}

      {/* Edit Profile Modal */}
      {user && (
          <EditProfileModal 
            isOpen={editProfileModalVisible} 
            onClose={() => setEditProfileModalVisible(false)} 
            currentUser={user}
            onSave={handleUpdateProfile}
          />
      )}

      <div className="w-full max-w-md bg-slate-50 relative min-h-screen shadow-2xl overflow-hidden">
        
        {/* Top Header Gradient Area */}
        <div className="bg-gradient-to-br from-blue-600 via-violet-600 to-violet-800 text-white rounded-b-[2.5rem] relative z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="px-6 pt-12 pb-24 relative z-10">
            {/* Nav Row */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-tr from-white/30 to-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
                  <Navigation size={22} className="text-white fill-white/20 transform -rotate-45" />
                </div>
                <span className="font-bold text-xl tracking-tight">RouteShare</span>
              </div>
              <img 
                src={user.avatar} 
                alt="User" 
                className="w-10 h-10 rounded-full border-2 border-white/30" 
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&h=400&fit=crop";
                }}
              />
            </div>

            {/* Heading */}
            <div className="mb-8">
              <h1 className="text-4xl font-extrabold leading-tight mb-2">
                Hey there! 👋 <br/>
                <span className="text-blue-200">Where to?</span>
              </h1>
            </div>
            
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white/95 backdrop-blur-xl p-2 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center transform translate-y-6">
              <div className="flex-1 flex items-center px-3">
                <Search size={20} className="text-slate-400 mr-3" />
                <input 
                  id="search-input"
                  type="text" 
                  placeholder="Try 'Bike to Cyber Hub'..." 
                  className="bg-transparent border-none outline-none text-slate-800 placeholder-slate-400 w-full h-10 text-base"
                  value={search}
                  onChange={handleSearchInputChange}
                />
              </div>
              <button 
                type="submit"
                className="bg-violet-600 text-white p-3 rounded-xl hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/30"
              >
                {aiProcessing ? <Loader2 size={20} className="animate-spin"/> : <ArrowRight size={20} />}
              </button>
            </form>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="px-6 -mt-10 relative z-10 min-h-[50vh]">
          <AnimatePresence mode='wait'>
            {renderContent()}
          </AnimatePresence>
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation 
          activeTab={tab} 
          onTabChange={setTab} 
          onPostClick={() => setPostModalVisible(true)} 
        />

        {/* Ride Detail Modal */}
        <Modal 
          isOpen={!!selectedRide} 
          onClose={() => setSelectedRide(null)} 
          title="Trip Details"
        >
          {selectedRide && (
            <div className="space-y-6">
              {/* Driver Card */}
              <div className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <img 
                    src={selectedRide.avatar} 
                    className="w-14 h-14 rounded-xl object-cover bg-white shadow-sm" 
                    alt="Driver" 
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1533038590840-1cde6e668a91?w=400&h=400&fit=crop";
                    }}
                />
                <div className="ml-3 flex-1">
                  <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-slate-800">{selectedRide.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{selectedRide.car}</p>
                      </div>
                      <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                        <Star size={12} className="text-amber-400 fill-current mr-1" />
                        <span className="font-bold text-xs text-slate-700">{selectedRide.rating}</span>
                      </div>
                  </div>
                  {selectedRide.badge && (
                      <div className="mt-1.5 flex">
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium flex items-center">
                            {selectedRide.badge}
                        </span>
                      </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="relative pl-4 py-2 space-y-8">
                {/* Connecting Line */}
                <div className="absolute left-[23px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-500 to-violet-500 opacity-30"></div>
                
                <div className="relative flex items-start">
                  <div className="w-5 h-5 rounded-full border-[3px] border-white bg-blue-500 shadow-md z-10 mr-4 mt-0.5 shrink-0"></div>
                  <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Pick Up</p>
                      <p className="text-slate-800 font-semibold text-base leading-tight">{selectedRide.from}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <Clock size={10} className="mr-1" /> {selectedRide.time}
                      </p>
                  </div>
                </div>

                <div className="relative flex items-start">
                  <div className="w-5 h-5 rounded-full border-[3px] border-white bg-violet-500 shadow-md z-10 mr-4 mt-0.5 shrink-0"></div>
                  <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Drop Off</p>
                      <p className="text-slate-800 font-semibold text-base leading-tight">{selectedRide.to}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center">
                          <span className="bg-slate-100 text-slate-600 px-1.5 rounded text-[10px] font-bold">~{selectedRide.eta}</span>
                      </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1">Date</p>
                    <p className="text-slate-800 font-bold text-sm flex items-center">
                        <Calendar size={14} className="mr-1.5 text-violet-500" />
                        {new Date(selectedRide.date).toLocaleDateString(undefined, {month: 'short', day:'numeric'})}
                    </p>
                 </div>
                 <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-400 font-medium mb-1">Seats</p>
                    <p className="text-slate-800 font-bold text-sm flex items-center">
                        <UserIcon size={14} className="mr-1.5 text-blue-500" />
                        {selectedRide.seatsLeft} Available
                    </p>
                 </div>
              </div>
              
              {/* Price Footer */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 rounded-xl text-white shadow-lg flex justify-between items-center">
                  <div>
                      <p className="text-xs text-slate-300 mb-0.5">Total for 1 Seat</p>
                      <p className="text-2xl font-bold">₹{selectedRide.price}</p>
                  </div>
                  <button 
                    onClick={handleRequestRide}
                    className="bg-white text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors flex items-center"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Request
                  </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Post Modal - Now with Vehicle Type */}
        <Modal 
          isOpen={postModalVisible} 
          onClose={() => setPostModalVisible(false)} 
          title="Post a Ride"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <MapPin size={16} className="mr-2 text-blue-500" /> From
              </label>
              <input 
                type="text" 
                value={postForm.from}
                onChange={e => setPostForm({...postForm, from: e.target.value})}
                placeholder="Current Location" 
                className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-slate-800" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center">
                <MapPin size={16} className="mr-2 text-violet-500" /> To
              </label>
              <input 
                type="text" 
                value={postForm.to}
                onChange={e => setPostForm({...postForm, to: e.target.value})}
                placeholder="Destination" 
                className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-medium text-slate-800" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Calendar size={16} className="mr-2 text-slate-400" /> Date
                </label>
                <input 
                    type="date" 
                    value={postForm.date}
                    onChange={e => setPostForm({...postForm, date: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-slate-600 text-sm font-medium" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Clock size={16} className="mr-2 text-slate-400" /> Time
                </label>
                <input 
                    type="time" 
                    value={postForm.time}
                    onChange={e => setPostForm({...postForm, time: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-slate-600 text-sm font-medium" 
                />
              </div>
            </div>

            {/* Vehicle Selection - CHANGED TO DATALIST */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center">
                  <Car size={16} className="mr-2 text-slate-400" /> Vehicle Type
                </label>
                <div className="relative">
                    <input
                        list="vehicle-types"
                        value={postForm.vehicleType}
                        onChange={(e) => setPostForm({...postForm, vehicleType: e.target.value})}
                        placeholder="Select or Type (e.g., EV Scooty)"
                        className="w-full p-4 bg-slate-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-violet-500/20 transition-all font-medium text-slate-800"
                    />
                    <datalist id="vehicle-types">
                        <option value="Sedan" />
                        <option value="SUV" />
                        <option value="Hatchback" />
                        <option value="Bike" />
                        <option value="EV Scooty" />
                        <option value="Luxury" />
                        <option value="Scooty" />
                    </datalist>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-400">
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Price (₹)</label>
                <input 
                    type="number" 
                    value={postForm.price}
                    onChange={e => setPostForm({...postForm, price: e.target.value})}
                    placeholder="25" 
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-slate-800 font-bold" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Seats</label>
                <select 
                    value={postForm.seats}
                    onChange={e => setPostForm({...postForm, seats: e.target.value})}
                    className="w-full p-3 bg-slate-50 rounded-xl border-none outline-none text-slate-800 font-bold"
                >
                    {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <button 
              className="w-full bg-violet-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-violet-700 transition-all shadow-xl shadow-violet-500/30 mt-4"
              onClick={handlePostRide}
            >
              Publish Ride
            </button>
          </div>
        </Modal>

      </div>
    </div>
  );
}