# Trackify 🎯

A comprehensive web dashboard to track your projects, goals, and learning journey.

## Features ✨

- **🚀 Smart Add**: Add projects, goals, and tasks using natural language.
- **⚡ Quick Add**: Instantly add new projects with just a title.
- **📊 Dashboard Overview**: View overall progress, statistics, and quick actions.
- **📅 Monthly Tracking**: Detailed views for each month's projects and goals.
- **🎯 Project Management**: Track progress, add GitHub/deployment URLs, manage documentation status.
- **⏰ Time Tracking**: Log daily work hours to maintain your goals.
- **📚 Learning Resources**: Manage tutorials, documentation, and learning materials.
- **📈 Progress Analytics**: Visual progress bars and statistics.
- **💻 Responsive Design**: Works on desktop, tablet, and mobile devices.

## Technology Stack 🛠️

### Backend
- **Node.js** with Express.js
- **SQLite** database for simplicity
- **RESTful API** design

### Frontend
- **React 18** with functional components and hooks
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **CSS Custom Properties** for theming

## Quick Start 🚀

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone and setup the project:**
```bash
git clone <your-repo-url>
cd tracker
```

2. **Install all dependencies:**
```bash
npm run install-all
```

3. **Start the development server:**
```bash
npm run dev
```

This will start both the backend server (port 5000) and the React frontend (port 3000).

### Manual Setup (Alternative)

If the above doesn't work, you can set up manually:

1. **Install root dependencies:**
```bash
npm install
```

2. **Setup backend:**
```bash
cd server
npm install
npm start
```

3. **Setup frontend (in a new terminal):**
```bash
cd client
npm install
npm start
```

## Usage Guide 📖

### Getting Started

1. **Dashboard**: Start with the main dashboard to see your overall progress
2. **Monthly Views**: Click on any month to see detailed projects and resources
3. **Time Tracking**: Use the time tracker to log your daily 2-3 hours of work
4. **Project Updates**: Update project status, add GitHub URLs, and track progress
5. **Resources**: Mark learning resources as completed and add notes

### Daily Workflow

1. **Log Time**: Start by logging your work session in the Time Tracker
2. **Update Progress**: Mark project progress and update status
3. **Review Goals**: Check your daily/weekly goals on the dashboard
4. **Complete Resources**: Work through learning materials and mark them complete

## Roadmap Structure 🗺️

The application tracks a 6-month roadmap:

- **Month 1**: Fundamentals (Regression & Classification)
- **Month 2**: Computer Vision (CNNs & Transfer Learning)
- **Month 3**: NLP (BERT & Transformers)
- **Month 4**: Recommender Systems (Collaborative & Content-based)
- **Month 5**: Advanced Integration (Object Detection & LLM Integration)
- **Month 6**: Capstone & Portfolio Polish

Each month includes:
- 1-2 hands-on ML projects
- Curated learning resources
- Deployment requirements
- Documentation goals

## API Endpoints 🔌

### Main Endpoints
- `POST /api/smart-add` - Add projects, tasks, and goals from a single text block.
- `POST /api/projects/quick-add` - Quickly create a project with just a title.
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/months` - All months with progress
- `GET /api/months/:id` - Specific month details
- `GET /api/projects` - All projects
- `PUT /api/projects/:id` - Update project
- `POST /api/time-logs` - Add time log
- `GET /api/learning-resources` - All learning resources

## Database Schema 💾

The SQLite database includes tables for:
- **months**: Monthly roadmap information
- **projects**: Individual ML projects
- **learning_resources**: Tutorials and documentation
- **time_logs**: Daily work hour tracking
- **tasks**: Project-specific tasks (future feature)

## Contributing 🤝

This is a personal project tracker, but you can customize it for your own needs:

1. Modify the smart-add parser in `server/index.js`
2. Update project types and categories
3. Add custom fields for your specific needs
4. Customize the UI colors and themes in `client/src/index.css`

## Deployment Options 🚀

### Local Development
- Use `npm run dev` for development with hot reload

### Production Build
```bash
cd client
npm run build
```

### Deployment Platforms
- **Heroku**: Use the included package.json scripts
- **Vercel**: Deploy the client folder for frontend
- **Railway/Render**: Full-stack deployment options

## Tips for Success 💡

1. **Daily Consistency**: Aim for 2-3 hours daily
2. **Track Everything**: Log time, update progress, complete resources
3. **Deploy Projects**: Always deploy to build your portfolio
4. **Document Well**: Good documentation impresses recruiters
5. **GitHub Active**: Keep your GitHub green with regular commits

## Support & Customization 🔧

To customize for your own learning journey:
- Update the roadmap data structure
- Modify project categories and types
- Add custom tracking fields
- Integrate with external APIs (GitHub, portfolio sites)

## License 📄

MIT License - Feel free to adapt for your own learning journey!

---

**Ready to start tracking?** 🚀

Launch the application and begin organizing your projects and goals! 