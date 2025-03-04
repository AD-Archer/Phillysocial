# Philly Social
A community-driven platform for real-time discussions and meetings in Philadelphia.

## About the Project
Philly Social is a web application designed to bring Philadelphia residents and those with Philly roots into a single, accessible space for real-time community engagement. Users can host or join meetings, discuss local topics, and collaborate on city-wide initiatives—all in one place.

This project was created in just 30 hours during a Philadelphia codefest at Drexel University in 2025. It was inspired by two previous projects:
- "Everything Southwest Philly" (2024) - A social app for the Southwest Philadelphia community proposed by Antonio Archer, Mohamed Souare, and Jaylen Nixon
- [Nexus Social](https://nexus-social-zeta.vercel.app/dashboard) (2024-2025) - A social app developed by Bryan Gunawan

## Why Philly Social?
Many communities struggle with accessibility, engagement, and coordination when it comes to civic discussions. Social media platforms are too broad, and neighborhood meetings can be hard to attend. Philly Social solves this by offering a real-time, Philly-focused networking and discussion platform that keeps users connected no matter where they are.

## Features
✅ Instant Community Meetings – Host or join live discussions effortlessly.
✅ Topic-Based Discussion Rooms – Organize conversations by neighborhood, interests, or issues.
✅ Event & Initiative Planning – Plan meetups, volunteer efforts, and advocacy campaigns.
✅ Philly-Centric Networking – Connect with others who care about the city.
✅ User-Friendly Interface – Clean and accessible design for seamless engagement.

## Tech Stack
- **Frontend**: Next.js 15.2.0, React 19.0.0, Tailwind CSS 4
- **Backend**: Firebase 11.4.0
- **Animation**: Framer Motion 12.4.7
- **Icons**: React Icons 5.5.0
- **Date Handling**: date-fns 4.1.0
- **RSS Parsing**: rss-parser 3.13.0

## Hosting
- **Vercel** - heres the link [PhillySocial](https://phillysocial.adarcher.app/)

## Installation

### Prerequisites
- Node.js & npm installed
- Firebase project set up

### Steps

1. Clone the repository:
```bash
git clone https://github.com/ad-archer/phillysocial.git
cd phillysocial
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (.env.local file):
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-firebase-app-id
```

4. Start the development server:
```bash
npm run dev
```

## Usage
- Sign up and create a profile.
- Join or start a real-time community discussion.
- Engage with other Philadelphians in topic-based chat rooms.
- Plan and organize events directly through the platform.

## Future Enhancements
🚀 AI-powered topic recommendations.
🚀 Verified badges for organizations and community leaders.
🚀 Push notifications for event reminders and discussions.

## Contributing
We welcome contributions! To contribute:
1. Fork the repository.
2. Create a new branch (feature-new-feature).
3. Commit your changes.
4. Push to the branch and submit a pull request.

## License
This project is licensed under the MIT License.


