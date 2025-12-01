# Frontend Implementation - VideoWise

## Overview

The VideoWise frontend is a modern React application built with TypeScript, providing a user-friendly interface for video summarization. It communicates with the backend API to upload videos, track processing jobs, and display summaries in multiple formats.

## Technology Stack

- **Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.0
- **Routing**: React Router DOM 6.20
- **State Management**: 
  - React Context API (Auth & Theme)
  - React Query (Server state & caching)
- **Styling**: TailwindCSS 3.3 with custom components
- **UI Components**: Custom components with Lucide React icons
- **HTTP Client**: Axios
- **Video Player**: React Player
- **Export Libraries**: jsPDF, docx
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── VideoPlayer.tsx      # Video player with timeline
│   │   ├── VideoUploadForm.tsx # Upload form with options
│   │   ├── SummaryFormatViewer.tsx # Format-specific summary display
│   │   ├── ExportMenu.tsx      # Export options (PDF, Word, etc.)
│   │   ├── Navbar.tsx          # Navigation bar
│   │   └── Footer.tsx          # Footer component
│   ├── pages/               # Page components
│   │   ├── Home.tsx            # Landing page
│   │   ├── Login.tsx           # Login page
│   │   ├── Signup.tsx          # Registration page
│   │   ├── Dashboard.tsx       # User dashboard
│   │   ├── JobPage.tsx         # Job status & results
│   │   ├── Profile.tsx         # User profile
│   │   ├── Settings.tsx        # Settings page
│   │   └── Collections.tsx     # Video collections
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx     # Authentication state
│   │   └── ThemeContext.tsx   # Dark/Light theme
│   ├── services/            # API services
│   │   └── api.ts              # API client & endpoints
│   ├── config/              # Configuration
│   │   └── api.ts              # API base URL config
│   ├── utils/               # Utility functions
│   │   ├── cn.ts               # Class name utility
│   │   └── export.ts           # Export functions (PDF, Word, etc.)
│   ├── styles/               # Global styles
│   │   └── index.css           # TailwindCSS & custom styles
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript config
├── tailwind.config.js      # TailwindCSS config
├── vite.config.ts          # Vite config
└── .env                    # Environment variables
```

## Key Features Implemented

### 1. Video Player with Timeline
- Embedded video player using `react-player`
- Clickable timeline markers for key moments
- Play/pause, volume, seek controls
- Fullscreen support
- Key moments list with clickable timestamps

### 2. Multiple Summary Formats
- **Paragraph**: Flowing narrative summary
- **Bullet Points**: Quick scanning format
- **Timeline**: Chronological breakdown with timestamps
- **Chapters**: Divided into sections with headings
- **Key Moments**: Only highlights and important points

### 3. Export Options
- Export as PDF (formatted document)
- Export as Word document (.docx)
- Export as Markdown (.md)
- Copy to clipboard
- Print-friendly view

### 4. Video Collections/Playlists
- Create and manage collections
- Organize videos by topic
- Collection management UI
- Link to videos from collections

### 5. Dark Mode
- Theme toggle in navbar
- System preference detection
- Persistent theme storage (localStorage)
- Smooth theme transitions

## Authentication Flow

1. User signs up/logs in via `/login` or `/signup`
2. JWT token stored in localStorage
3. Token included in all API requests via Axios interceptor
4. Protected routes check authentication via `AuthContext`
5. Token expiration handled automatically

## API Communication

### Base Configuration
- API base URL configured in `src/config/api.ts`
- Uses environment variable `VITE_API_BASE_URL`
- Defaults to `http://localhost:5000` if not set

### API Service (`src/services/api.ts`)
- Centralized API client using Axios
- Automatic token injection
- Error handling (401 redirects to login)
- TypeScript interfaces for all API responses

### Key Endpoints Used
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /videos/upload` - Upload video file
- `POST /videos/from-url` - Summarize from URL
- `GET /videos/status/<job_id>` - Get job status
- `GET /videos/result/<job_id>` - Get job result
- `GET /videos/list` - List user's jobs
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile

## State Management

### Auth Context
- Manages user authentication state
- Provides `login()`, `logout()`, `signup()` functions
- Persists token in localStorage
- Available throughout app via `useAuth()` hook

### Theme Context
- Manages dark/light theme
- Provides `theme` and `toggleTheme()` function
- Persists preference in localStorage
- Applies theme to document root

### React Query
- Manages server state (jobs, results, user data)
- Automatic caching and refetching
- Polling for job status updates
- Optimistic updates

## Styling Approach

### TailwindCSS
- Utility-first CSS framework
- Custom color palette (primary teal colors)
- Dark mode support via `dark:` prefix
- Responsive design with breakpoints

### Custom Components
- `.glass-card` - Glassmorphism effect
- `.btn-primary` - Primary button style
- `.btn-secondary` - Secondary button style
- `.input-field` - Form input styling
- `.card` - Card container

## Environment Variables

Create `.env` file in `frontend/` directory:

```env
VITE_API_BASE_URL=https://your-backend-url.trycloudflare.com
VITE_APP_NAME=VideoWise
VITE_ENVIRONMENT=production
```

## Development

### Install Dependencies
```bash
cd frontend
npm install
```

### Run Development Server
```bash
npm run dev
```
Server runs on `http://localhost:3000`

### Build for Production
```bash
npm run build
```
Output in `dist/` directory

### Preview Production Build
```bash
npm run preview
```

## Component Details

### VideoUploadForm
- Handles file upload or URL input
- Summary style selection (default, professional, commercial, etc.)
- Summary format selection (paragraph, bullet, timeline, etc.)
- Summary length selection (auto, short, medium, long, custom)
- Frame count selection
- Form validation and error handling

### JobPage
- Real-time job status polling
- Progress bar visualization
- Video player integration
- Format switcher for summaries
- Export menu
- Transcript and visual captions display

### SummaryFormatViewer
- Renders summary in selected format
- Parses summary text for different formats
- Displays transcript and visual captions
- Format-specific styling

### VideoPlayer
- React Player wrapper
- Custom controls (play, pause, volume, seek)
- Timeline markers for key moments
- Clickable timestamps
- Fullscreen support

### ExportMenu
- Dropdown menu with export options
- PDF, Word, Markdown export
- Copy to clipboard
- Print functionality

## Error Handling

- Centralized error handling in API service
- Toast notifications for user feedback
- Error boundaries for component errors
- Graceful fallbacks for missing data

## Performance Optimizations

- Code splitting via Vite
- Lazy loading for routes
- React Query caching
- Optimistic UI updates
- Image optimization

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ features required
- LocalStorage for persistence

## Security Considerations

- JWT tokens stored in localStorage
- Automatic token expiration handling
- CORS handled by backend
- Input validation on forms
- XSS protection via React's built-in escaping

## Future Enhancements

- Real-time notifications (WebSockets)
- Advanced search functionality
- Batch video processing
- Video preview thumbnails
- Social sharing features
- Multi-language support
