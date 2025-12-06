import { createClient } from '@supabase/supabase-js';
import { Ride, ChatSession, User, Message } from "../types";
import { SAMPLE_RIDES, GARDEN_AVATARS } from "../constants";

// --- SUPABASE CONFIGURATION ---
// IMPORTANT: Replace these with your own project details from the Supabase Dashboard!
// Using Vite environment variables (import.meta.env)
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://ossbzuzqqnmgsnheyhxy.supabase.co';
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_4XD6GYYD1C2TEEf4lo37rA_gTG5KeLQ';

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
      const { data, error } = await