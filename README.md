# RouteShare 🚗

RouteShare is a modern, mobile-first ride-sharing application designed for the Indian context. It connects daily commuters with verified drivers, making travel affordable and eco-friendly.

## ✨ Features

- **Smart Search**: AI-powered search (e.g., "Bike to Cyber Hub") using Google Gemini.
- **Ride Matching**: Filter by vehicle type, origin, and destination.
- **Real-time Chat**: Integrated messaging system between drivers and passengers.
- **User Profiles**: Custom avatars, ratings, and verified badges.
- **Responsive UI**: Built with a mobile-first approach using Tailwind CSS and Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: React 19
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Backend**: Supabase (Auth & Database)
- **AI**: Google GenAI SDK (Gemini 2.5)

## 🚀 Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/routeshare.git
    cd routeshare
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    # Google Gemini API Key
    API_KEY=your_google_api_key_here
    
    # Supabase Configuration (Optional overrides)
    REACT_APP_SUPABASE_URL=your_supabase_url
    REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Locally**
    ```bash
    npm start
    # or if using Vite
    npm run dev
    ```

## 📂 Project Structure

- `/components`: Reusable UI components (RideCard, ChatInterface, etc.)
- `/services`: API integrations (Supabase, Google AI)
- `/types`: TypeScript definitions

## 📄 License

MIT License
