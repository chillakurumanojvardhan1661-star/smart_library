# 📚 Library Management System v2.0

A modern, full-stack web application for digitizing library operations with intelligent features including AI-based recommendations, advanced analytics, and comprehensive reporting.

![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)
![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Highlights

- 🔐 **Secure Authentication** - JWT-based user authentication
- 🤖 **AI Recommendations** - Smart book suggestions based on history
- 📊 **Advanced Analytics** - Interactive charts and insights
- 📤 **Export Reports** - CSV export for all data
- 🎨 **Modern UI** - Beautiful, responsive design with Tailwind CSS
- ⚡ **Real-time Updates** - Live statistics and availability tracking
- 💰 **Auto Fine Calculation** - Automatic overdue fine computation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd library-management-system
```

2. **Quick Setup with SQLite** (No database installation needed!)
```bash
./quick-start-sqlite.sh
```

3. **Start the servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

4. **Access the application**
```
Frontend: http://localhost:3000
Backend API: http://localhost:5001
```

5. **Login with demo account**
```
Email: admin@library.com
Password: admin123
```

## 🎯 Core Features

### 📘 Book Management
- Complete CRUD operations
- ISBN tracking
- Real-time availability
- Search by title/author
- Category filtering
- Automatic stock updates

### 👥 Member Management
- Member registration
- Contact information
- Borrowing history
- Status tracking
- Unique member IDs

### 🔄 Issue & Return System
- Book issuing workflow
- Due date management
- Automatic fine calculation ($5/day)
- Overdue tracking
- Return processing

### 📊 Admin Dashboard
- Real-time statistics
- Library utilization metrics
- Quick export options
- System status monitoring

## 🚀 Advanced Features

### 🤖 AI-Based Recommendations
- Personalized suggestions based on borrowing history
- Category and author matching
- Trending books (last 30 days)
- Relevance scoring algorithm

### 📈 Analytics Dashboard
- **Issues Trend** - Line chart showing borrowing patterns
- **Category Distribution** - Pie chart of book categories  
- **Top Borrowers** - Bar chart of most active members
- **Fine Analytics** - Comprehensive fine statistics

### 📤 Export Functionality
- Export books, members, and issues to CSV
- One-click download from dashboard
- Excel-compatible format

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Tailwind CSS** - Styling
- **TanStack Query** - Data fetching & caching
- **React Router v6** - Navigation
- **Recharts** - Data visualization
- **Heroicons** - Icon library
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **SQLite/PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📁 Project Structure

```
library-management-system/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth & validation
│   │   └── server.js        # Entry point
│   ├── scripts/             # Utility scripts
│   └── library.db           # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client
│   │   ├── context/         # React context
│   │   └── App.jsx          # Main app
│   └── public/
├── database/
│   ├── schema.sql           # Database schema
│   └── sample-data.sql      # Sample data
└── docs/                    # Documentation
```

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Detailed installation instructions
- **[Quick Start](QUICKSTART.md)** - Get running in 5 minutes
- **[API Documentation](API_DOCUMENTATION.md)** - Complete API reference
- **[Features](FEATURES.md)** - Comprehensive feature list
- **[Testing Guide](TESTING.md)** - Testing checklist
- **[Upgrade Notes](UPGRADE_NOTES.md)** - Version 2.0 changes

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Books
- `GET /api/books` - Get all books
- `POST /api/books` - Create book
- `PUT /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Members
- `GET /api/members` - Get all members
- `GET /api/members/:id/history` - Get borrowing history

### Issues
- `POST /api/issues` - Issue book
- `PUT /api/issues/:id/return` - Return book
- `GET /api/issues/overdue` - Get overdue books

### Analytics
- `GET /api/analytics/issues-trend` - Issues trend
- `GET /api/analytics/category-distribution` - Category stats
- `GET /api/analytics/top-borrowers` - Top borrowers

### Export
- `GET /api/export/books?format=csv` - Export books
- `GET /api/export/members?format=csv` - Export members
- `GET /api/export/issues?format=csv` - Export issues

[Full API Documentation →](API_DOCUMENTATION.md)

## 🎨 Screenshots

### Dashboard
Modern dashboard with real-time statistics and export options

### Analytics
Interactive charts showing library insights

### Recommendations
AI-powered book suggestions

## 🧪 Testing

Run the test checklist:
```bash
# See TESTING.md for complete checklist
```

Test API endpoints:
```bash
# Health check
curl http://localhost:5001/health

# Get books
curl http://localhost:5001/api/books

# Get analytics
curl http://localhost:5001/api/analytics/category-distribution
```

## 🔐 Security

- Password hashing with bcrypt (10 rounds)
- JWT authentication with 7-day expiration
- Protected API routes
- SQL injection prevention
- Input validation
- Secure session management

## 📊 Database

### SQLite (Development)
- No installation required
- File-based database
- Perfect for development and testing

### PostgreSQL (Production)
- Scalable and robust
- Full SQL support
- Production-ready

Migration between databases is seamless with the database adapter layer.

## 🚀 Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
# Serve the dist/ folder
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world library management needs
- Designed for educational and practical use

## 📞 Support

For issues or questions:
- Check the [documentation](docs/)
- Review [API docs](API_DOCUMENTATION.md)
- See [testing guide](TESTING.md)

## 🎓 Educational Value

This project demonstrates:
- Full-stack web development
- RESTful API design
- Database design and normalization
- Authentication & authorization
- State management
- Data visualization
- Modern UI/UX practices
- Software architecture patterns

## 🔮 Roadmap

### v3.0 (Planned)
- [ ] Book reservations
- [ ] Email notifications
- [ ] QR code scanning
- [ ] Barcode integration
- [ ] Mobile app (React Native)
- [ ] Advanced search filters
- [ ] Book reviews and ratings
- [ ] Multi-language support
- [ ] Dark mode
- [ ] PDF report generation

---

**Version:** 2.0.0  
**Status:** Production Ready ✅  
**Last Updated:** February 11, 2026

Made with ❤️ for libraries everywhere
