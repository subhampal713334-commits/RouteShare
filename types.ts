export interface User {
  id: string;
  name: string;
  avatar: string;
  isCurrentUser?: boolean;
  rating?: number;
  tripsCount?: number;
}

export interface Ride {
  id: string;
  hostId: string; // The driver
  name: string;
  car: string;
  vehicleType: string; // Changed to string to allow custom input
  price: number;
  seatsLeft: number;
  avatar: string;
  eta: string;
  badge?: string;
  from: string;
  to: string;
  date: string; // ISO string
  time: string;
  rating: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  rideId: string;
  rideName: string; // Context for the chat
  participants: User[];
  messages: Message[];
  lastMessage: string;
  lastMessageTime: number;
}

export type Tab = "home" | "find" | "post" | "chat" | "profile";