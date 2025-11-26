# SportsAddict Admin Panel

A React web application for managing SportsAddict content and author requests.

## Features

- **Admin Authentication**: Secure login using Firebase Authentication
- **Content Management**: View and delete articles, podcasts, and live events
- **Author Request Management**: Review and approve/reject author profile requests
- **Real-time Updates**: All data syncs in real-time with Firebase Realtime Database

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase project with Realtime Database enabled

### Installation

1. Navigate to the AdminPanel directory:
```bash
cd AdminPanel
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Login

Use your Firebase admin credentials to log in to the admin panel.

### Dashboard

The dashboard displays three tabs:
- **Articles**: View and delete all articles
- **Podcasts**: View and delete all podcasts
- **Live Events**: View and delete all live events

Each item shows:
- Category/Tag
- Title/Description
- Author email
- Creation date
- Delete button

### Author Requests

The Author Requests page allows you to:
- View all author requests (filtered by status: All, Pending, Approved, Rejected)
- Approve requests (sets user's `isAuthor` status to true)
- Reject requests
- Delete requests

When you approve an author request:
- The request status is updated to "approved"
- The user's `isAuthor` field is set to `true` in their profile
- The user's author profile data is saved
- The "Request Author Profile" option disappears from the user's drawer
- The "Author Profile" option appears in the user's drawer

## Project Structure

```
AdminPanel/
├── src/
│   ├── config/
│   │   └── firebase.ts          # Firebase configuration
│   ├── pages/
│   │   ├── Login.tsx            # Login page
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   └── AuthorRequests.tsx   # Author requests management
│   ├── App.tsx                  # Main app component with routing
│   └── main.tsx                 # Entry point
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Firebase Database Structure

The admin panel interacts with the following Firebase paths:

- `articles/` - All articles
- `podcasts/` - All podcasts
- `liveEvents/` - All live events
- `authorRequests/` - Author profile requests
- `users/{userId}/isAuthor` - User's author status
- `users/{userId}/authorProfile` - User's author profile data

## Styling

The admin panel uses the same design system as the main SportsAddict app:
- Primary color: `#06ABEB`
- Secondary color: `#5DD8D0`
- Background: `#FFFFFF`
- Text: `#000000`
- Borders: `#E0E0E0`

## Development

The project uses:
- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **Firebase** for authentication and database

## License

Private - SportsAddict Project

