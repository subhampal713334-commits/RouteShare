import { createClient } from '@supabase/supabase-js';
import { Ride, ChatSession, User, Message } from "../types";
import { SAMPLE_RIDES, GARDEN_AVATARS } from "../constants";

// --- SUPABASE CONFIGURATION ---
// IMPORTANT: Replace these with your own project details from the Supabase Dashboard!
// We use environment variables if available, otherwise fallback to the demo keys.
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://ossbzuzqqnmgsnheyhxy.supabase.co';
const SUPABASE_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'sb_publishable_4XD6GYYD1C2TEEf4lo37rA_gTG5KeLQ';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to pick a consistent nature avatar based on the name
const getNatureAvatar = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % GARDEN_AVATARS.length;
    return GARDEN_AVATARS[index];
};

// Helper to generate a valid UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper to transform Supabase Profile to App User
const mapProfileToUser = (profile: any, authId: string): User => {
  const isCurrentUser = profile.id === authId;
  
  // Logic: Use stored avatar if available (from edits), otherwise fallback to generated one
  let avatar = profile.avatar;
  if (!avatar) {
      avatar = getNatureAvatar(profile.name || 'User');
  }

  return {
    id: profile.id,
    name: profile.name || 'Unknown User',
    avatar: avatar,
    rating: profile.rating || 5.0,
    tripsCount: profile.trips_count || 0,
    isCurrentUser
  };
};

export const api = {
  auth: {
    login: async (email: string, pass: string): Promise<User> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (error) {
        // Standardize the error message for the UI
        if (error.message.includes("Email not confirmed")) {
            throw new Error("CONFIRM_EMAIL");
        }
        throw error;
      }
      
      if (!data.user) throw new Error("No user data");

      // Fetch profile details
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      // If profile doesn't exist yet (race condition), fallback to basic data
      return mapProfileToUser(profile || { id: data.user.id, name: email.split('@')[0] }, data.user.id);
    },

    signup: async (name: string, email: string, pass: string): Promise<User> => {
      // Generate a nature/garden avatar for the new user
      const avatarUrl = getNatureAvatar(name);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: name,
            avatar_url: avatarUrl
          }
        }
      });

      if (error) throw error;
      
      // CRITICAL FIX: Check if session is missing. This means Email Confirmation is enabled in Supabase.
      if (data.user && !data.session) {
          throw new Error("CONFIRM_EMAIL");
      }

      if (!data.user) throw new Error("Signup failed");

      return {
        id: data.user.id,
        name: name,
        avatar: avatarUrl,
        isCurrentUser: true,
        rating: 5.0,
        tripsCount: 0
      };
    },

    logout: async () => {
      await supabase.auth.signOut();
    },

    getCurrentUser: async (): Promise<User | null> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      return mapProfileToUser(profile || { id: session.user.id }, session.user.id);
    },

    updateProfile: async (userId: string, updates: { name?: string; avatar?: string }) => {
      // 1. Update Supabase Auth Metadata (optional but good practice)
      if (updates.name || updates.avatar) {
          const data: any = {};
          if (updates.name) data.full_name = updates.name;
          if (updates.avatar) data.avatar_url = updates.avatar;
          await supabase.auth.updateUser({ data });
      }

      // 2. Update Profiles Table
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return mapProfileToUser(data, userId);
    }
  },

  rides: {
    list: async (): Promise<Ride[]> => {
      // 1. Fetch Rides
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching rides:", error);
        return [];
      }

      // 2. Demo Data Seeding: If no rides exist, create sample rides using current user as host
      if ((!data || data.length === 0)) {
        const user = await api.auth.getCurrentUser();
        // Only seed if we have a logged in user to be the 'host'
        if (user) {
            console.log("Database empty. Seeding Indian demo data...");
            
            const seedData = SAMPLE_RIDES.map((r) => ({
                // Use user.id as host_id to avoid Foreign Key violations in 'rides' table
                host_id: user.id, 
                name: r.name,
                avatar: r.avatar,
                rating: r.rating,
                car: r.car,
                vehicle_type: r.vehicleType,
                price: r.price,
                seats_left: r.seatsLeft,
                origin: r.from,
                destination: r.to,
                date: r.date,
                time: r.time,
                eta: r.eta,
                badge: r.badge
            }));
            
            const { error: seedError } = await supabase.from('rides').insert(seedData);
            
            if (!seedError) {
                // Fetch again after seeding to get the generated IDs
                const { data: seededData } = await supabase
                    .from('rides')
                    .select('*')
                    .order('created_at', { ascending: false });
                    
                if (seededData) {
                    return seededData.map((r: any) => ({
                        ...r,
                        from: r.origin,
                        to: r.destination,
                        hostId: r.host_id,
                        seatsLeft: r.seats_left,
                        vehicleType: r.vehicle_type
                    }));
                }
            } else {
                console.error("Seeding failed (Check RLS policies):", seedError);
            }
        }
      }

      return data.map((r: any) => ({
        ...r,
        from: r.origin, // Mapping DB column to TS Interface
        to: r.destination,
        hostId: r.host_id,
        seatsLeft: r.seats_left,
        vehicleType: r.vehicle_type
      }));
    },
    
    create: async (newRide: Omit<Ride, "id" | "hostId" | "avatar" | "rating" | "eta" | "badge">): Promise<Ride> => {
      const user = await api.auth.getCurrentUser();
      if (!user) throw new Error("You must be logged in to post a ride.");

      const dbPayload = {
        host_id: user.id,
        name: user.name,
        avatar: user.avatar,
        rating: user.rating,
        car: newRide.car,
        vehicle_type: newRide.vehicleType,
        price: Number(newRide.price), // Ensure number
        seats_left: Number(newRide.seatsLeft), // Ensure number
        origin: newRide.from,
        destination: newRide.to,
        date: newRide.date, // ISO string or YYYY-MM-DD
        time: newRide.time,
        eta: "10 min",
        badge: "New ✨"
      };

      const { data, error } = await supabase
        .from('rides')
        .insert(dbPayload)
        .select()
        .single();

      if (error) {
          console.error("Supabase Create Error:", error);
          throw new Error(error.message || "Failed to create ride");
      }

      return {
        ...data,
        from: data.origin,
        to: data.destination,
        hostId: data.host_id,
        seatsLeft: data.seats_left,
        vehicleType: data.vehicle_type
      };
    },

    reset: async (): Promise<void> => {
        const user = await api.auth.getCurrentUser();
        if (!user) throw new Error("Must be logged in");
        
        // Delete all rides created by this user (which includes the demo data)
        const { error } = await supabase
            .from('rides')
            .delete()
            .eq('host_id', user.id);
            
        if (error) {
            console.error("Failed to reset:", error);
            throw new Error("Could not reset data");
        }
    }
  },

  chats: {
    list: async (): Promise<ChatSession[]> => {
      const user = await api.auth.getCurrentUser();
      if (!user) return [];

      const { data: chatsData, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('last_message_time', { ascending: false });

      if (error || !chatsData) return [];

      const enrichedChats: ChatSession[] = await Promise.all(chatsData.map(async (chat: any) => {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('*')
          .in('id', chat.participant_ids);

        const participants: User[] = (profiles || []).map((p: any) => mapProfileToUser(p, user.id));
        
        // Fix for "Ghost" Demo Hosts or Broken Self-Chats
        // If the other participant is a demo host (doesn't have a profile row) OR it's a legacy self-chat with dup IDs
        if (participants.length < 2) {
             let otherId = chat.participant_ids.find((id: string) => id !== user.id);
             
             // If legacy chat where ids are identical, create a deterministic ghost ID
             if (!otherId) {
                 otherId = `ghost_${chat.ride_id}`;
             }

             if (otherId) {
                 const { data: ride } = await supabase.from('rides').select('*').eq('id', chat.ride_id).single();
                 if (ride) {
                      // Prevent duplicate push if logic somehow already added it
                      if (!participants.find(p => p.id === otherId)) {
                          participants.push({
                              id: otherId,
                              name: ride.name, // The ride's "persona" name
                              avatar: ride.avatar, // The ride's "persona" avatar
                              isCurrentUser: false,
                              rating: ride.rating
                          });
                      }
                 }
             }
        }

        return {
          id: chat.id,
          rideId: chat.ride_id,
          rideName: chat.ride_name,
          participants: participants,
          messages: [],
          lastMessage: chat.last_message,
          lastMessageTime: new Date(Number(chat.last_message_time)).getTime() // Ensure it's a number
        };
      }));

      return enrichedChats;
    },

    initiate: async (ride: Ride): Promise<ChatSession> => {
      const user = await api.auth.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      // --- ALLOW SELF CHAT FOR DEMO ---
      // However, to make the chat work (have 2 participants), if the hostId is same as user,
      // we must use a "Ghost" ID for the host so the UI treats them as separate people.
      // We use generateUUID() to ensure compatibility with UUID column types in the DB.
      let targetHostId = ride.hostId;
      if (targetHostId === user.id) {
          targetHostId = generateUUID();
      }

      const { data: existing } = await supabase
        .from('chats')
        .select('*')
        .eq('ride_id', ride.id)
        .contains('participant_ids', [user.id])
        .single();

      if (existing) {
         // Logic to reconstruct participants similarly to list()
         const { data: profiles } = await supabase.from('profiles').select('*').in('id', existing.participant_ids);
         const participants: User[] = (profiles || []).map((p: any) => mapProfileToUser(p, user.id));
         
         // Fix broken participants (legacy self chats)
         if (participants.length < 2) {
             let otherId = existing.participant_ids.find((id: string) => id !== user.id);
             // Fallback for legacy chats
             if (!otherId) otherId = targetHostId; 

             if (otherId) {
                  // Use the ride details passed in argument to ensure freshness
                  if (!participants.find(p => p.id === otherId)) {
                      participants.push({
                          id: otherId,
                          name: ride.name,
                          avatar: ride.avatar,
                          isCurrentUser: false
                      });
                  }
             }
         }

         const { data: messages } = await supabase.from('messages').select('*').eq('chat_id', existing.id).order('timestamp', { ascending: true });
         
         return {
             id: existing.id,
             rideId: existing.ride_id,
             rideName: existing.ride_name,
             participants,
             messages: messages?.map((m: any) => ({ 
                 ...m, 
                 senderId: m.sender_id,
                 timestamp: new Date(Number(m.timestamp)).getTime() 
             })) || [],
             lastMessage: existing.last_message,
             lastMessageTime: new Date(Number(existing.last_message_time)).getTime()
         };
      }

      const participantIds = [user.id, targetHostId];

      const now = Date.now(); // FIX: Use number timestamp for BigInt column

      const { data: newChat, error } = await supabase
        .from('chats')
        .insert({
            ride_id: ride.id,
            ride_name: `${ride.from} to ${ride.to}`,
            participant_ids: participantIds,
            last_message: "Chat started",
            last_message_time: now
        })
        .select()
        .single();

      if (error) {
          console.error("Chat Creation Error:", error);
          throw new Error(error.message || "Failed to create chat session");
      }

      await api.chats.sendMessage(newChat.id, `Hi! I would like to join your ride.`);

      // Construct return object immediately with the spoofed host details
      const participants = [
          user, 
          { 
              id: targetHostId, 
              name: ride.name, 
              avatar: ride.avatar,
              isCurrentUser: false
          } as User
      ];

      return {
        id: newChat.id,
        rideId: newChat.ride_id,
        rideName: newChat.ride_name,
        participants,
        messages: [],
        lastMessage: newChat.last_message,
        lastMessageTime: now
      };
    },

    sendMessage: async (chatId: string, text: string): Promise<Message> => {
      const user = await api.auth.getCurrentUser();
      if (!user) throw new Error("Not logged in");

      const now = Date.now(); // FIX: Use number timestamp for BigInt column

      const { data: msg, error } = await supabase
        .from('messages')
        .insert({
            chat_id: chatId,
            sender_id: user.id,
            text,
            timestamp: now
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chats')
        .update({
            last_message: text,
            last_message_time: now
        })
        .eq('id', chatId);

      return {
          id: msg.id,
          senderId: msg.sender_id,
          text: msg.text,
          timestamp: now
      };
    },

    getMessages: async (chatId: string): Promise<Message[]> => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chatId)
            .order('timestamp', { ascending: true });
        
        if (error) return [];
        return data.map((m: any) => ({
            id: m.id,
            senderId: m.sender_id,
            text: m.text,
            timestamp: new Date(Number(m.timestamp)).getTime() // Ensure number
        }));
    }
  }
};