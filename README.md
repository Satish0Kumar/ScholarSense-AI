# ScholarSense - AI-Powered Academic Intelligence System

## 🎓 Overview
ScholarSense is a comprehensive school administration system with AI-powered student dropout risk prediction, designed to help educators identify and support at-risk students proactively.

## ✨ Features

### Core Functionality
- **Student Management** - Complete CRUD operations for student records
- **Academic Tracking** - Monitor GPA, grades, and academic performance
- **Risk Prediction** - ML-based dropout risk assessment
- **User Authentication** - Secure JWT-based authentication
- **Role-Based Access** - Admin and Teacher roles with different permissions
- **Interactive Dashboard** - Real-time metrics and visualizations

### Key Modules
1. **Module 1: Risk Prediction Engine** ✅ COMPLETE
   - AI/ML-based risk classification (Low, Medium, High, Critical)
   - Confidence scoring and probability distribution
   - Feature-based predictions using 17+ data points

2. **Student Management System** ✅ COMPLETE
   - Add, view, edit, and manage student records
   - Search and filter functionality
   - Detailed student profiles

3. **Academic Records System** ✅ COMPLETE
   - Track semester-wise performance
   - Subject-wise scoring
   - GPA trends and analysis

## 🏗️ Tech Stack

### Backend
- **Framework:** Flask (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT with Flask-JWT-Extended
- **Password Security:** bcrypt
- **API:** RESTful architecture

### Frontend
- **Framework:** React 18 with Vite
- **UI Library:** Tailwind CSS
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Routing:** React Router DOM

### Machine Learning
- **Model:** Scikit-learn (Gradient Boosting/Random Forest)
- **Features:** 17 student attributes
- **Output:** 4-level risk classification

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│ React Frontend (Vite + Tailwind CSS)                    │
│ (Login, Dashboard, Students, Profile, Predictions)      │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTP/REST API
┌───────────────────▼─────────────────────────────────────┐
│ Flask Backend                                            │
│ (Authentication, Business Logic, ML Integration)         │
└───────────────────┬─────────────────────────────────────┘
                    │ SQLAlchemy ORM
┌───────────────────▼─────────────────────────────────────┐
│ PostgreSQL Database                                      │
│ (Students, Academic Records, Predictions, Users)         │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- PostgreSQL 14+
- pip (Python package manager)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd ai-school-admin-system
```

### Step 2: Create Virtual Environment
```bash
python -m venv venv
.\venv\Scripts\Activate  # Windows
source venv/bin/activate # Linux/Mac
```

### Step 3: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### Step 4: Install Frontend Dependencies
```bash
cd frontend-react
npm install
```

### Step 5: Setup Database
```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE scholarsense;
CREATE USER scholar_admin WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE scholarsense TO scholar_admin;
\q

# Initialize schema
psql -U scholar_admin -d scholarsense -f backend/database/schema.sql
```

### Step 6: Configure Environment
Create `.env` file in project root:

```env
# Database
DB_NAME=scholarsense
DB_USER=scholar_admin
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432

# Security
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600

# Application
PROJECT_NAME=ScholarSense
FLASK_ENV=development
```

**⚠️ IMPORTANT:** SECRET_KEY and JWT_SECRET_KEY are REQUIRED environment variables. The application will not start without them.

### Step 7: Create Default Users
```bash
python -m backend.auth.auth_service
```

### Step 8: Start Backend API
```bash
cd backend
python api.py
```
API will run on: http://localhost:5000

### Step 9: Start Frontend
```bash
cd frontend-react
npm run dev
```
UI will open at: http://localhost:5173

## 🔐 Default Credentials

**Admin Account:**
- Email: admin@scholarsense.com
- Password: admin123

**Teacher Account:**
- Email: teacher@scholarsense.com
- Password: teacher123

## 📁 Project Structure

```
ai-school-admin-system/
├── backend/
│   ├── api.py                      # Flask REST API
│   ├── database/
│   │   ├── schema.sql              # Database schema
│   │   ├── communications_migration.sql  # Database migrations
│   │   ├── db_config.py            # Database configuration
│   │   └── models.py               # SQLAlchemy models
│   ├── auth/
│   │   ├── auth_service.py         # Authentication service
│   │   └── token_blocklist.py      # JWT token management
│   ├── routes/                     # API route handlers
│   │   ├── student_routes.py       # Student endpoints
│   │   ├── academic_routes.py      # Academic endpoints
│   │   ├── prediction_routes.py    # ML prediction endpoints
│   │   ├── attendance_routes.py    # Attendance endpoints
│   │   ├── marks_routes.py         # Marks entry endpoints
│   │   └── ...                     # Other route files
│   ├── services/
│   │   ├── student_service.py      # Student CRUD
│   │   ├── academic_service.py     # Academic records
│   │   ├── prediction_service.py   # ML predictions
│   │   └── ...                     # Other services
│   └── requirements.txt            # Python dependencies
├── frontend-react/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx       # Main dashboard
│   │   │   ├── Students.jsx        # Student management
│   │   │   ├── Academics.jsx       # Academic records
│   │   │   ├── Predictions.jsx     # Risk predictions
│   │   │   └── ...                 # Other pages
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Navigation bar
│   │   │   ├── AddStudentForm.jsx  # Student registration
│   │   │   └── ...                 # Other components
│   │   ├── utils/
│   │   │   └── api.js              # API client
│   │   ├── App.jsx                 # Main app component
│   │   └── main.jsx                # Entry point
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite configuration
│   └── tailwind.config.js          # Tailwind CSS config
├── scripts/
│   ├── reset_passwords_deprecated.py # Legacy utilities
│   └── train_model.py              # ML training
├── tests/
│   ├── test_api.py                 # API tests
│   └── test_integration.py         # Integration tests
├── data/
│   ├── processed/                  # Processed datasets
│   └── raw/                        # Raw data files
├── docs/                           # Documentation
├── .env                            # Environment variables (REQUIRED)
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

## 🔄 Recent Changes

### v3.0.0 - React Migration & Cleanup
- **Major**: Migrated frontend from Streamlit/Plotly to React/Vite/Recharts
- **UI**: Modern, responsive design with Tailwind CSS
- **Performance**: Faster load times and better user experience
- **Cleanup**: Removed entire Streamlit frontend directory
- **Cleanup**: Removed Plotly-related scripts (patch_plotly_dark.py, fix_deprecations.ps1)
- **Cleanup**: Removed demo_presentation.py (Streamlit-based)
- **Cleanup**: Removed empty models/saved_models directory
- **Cleanup**: Removed debug log files
- **Docs**: Updated README with React setup instructions

### v2.2.0 - Comprehensive Student Registration Form
- **Feature**: Implemented comprehensive student registration form with REQUIRED academic data
- **Enhancement**: Two-section form (Basic Info + Academic Info) for better UX
- **Fix**: Ensures accurate ML predictions from day one by requiring all 17 features
- **UI**: Tab-based form with validation, loading states, and error handling
- **Impact**: Eliminates "Low Risk by default" issue for new students

### v2.1.0 - Code Quality & Security Improvements
- **Security**: Removed hardcoded fallback secret keys - now requires explicit environment variables
- **Bug Fix**: Fixed key name mismatches in prediction service
- **Cleanup**: Organized project structure (scripts/, tests/, backend/database/)

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/me` - Get current user

### Students
- `GET /api/students` - List all students
- `GET /api/students/{id}` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/{id}` - Update student
- `DELETE /api/students/{id}` - Delete student

### Academic Records
- `GET /api/students/{id}/academics` - Get student's records
- `POST /api/academics` - Create academic record
- `PUT /api/academics/{id}` - Update record

### Predictions
- `POST /api/students/{id}/predict` - Make prediction
- `GET /api/students/{id}/predictions` - Get prediction history
- `GET /api/predictions/high-risk` - Get high-risk students

## 📈 Usage

1. **Login**
   - Access http://localhost:5173 and login with credentials

2. **View Dashboard**
   - See overview of students, metrics, and risk distribution

3. **Manage Students**
   - Add, view, edit student records with comprehensive registration form

4. **Add Academic Records**
   - Enter semester grades, marks, and performance data

5. **Track Attendance & Behavior**
   - Log attendance and behavioral incidents

6. **Make Predictions**
   - Generate AI-powered dropout risk predictions

7. **Monitor High-Risk Students**
   - View and track students needing intervention

## 🔧 Development

### Run Tests
```bash
python -m backend.services.student_service
python -m backend.services.academic_service
python -m backend.services.prediction_service
```

### Database Queries
```bash
psql -U scholar_admin -d scholarsense
```

## 📊 Current Status

✅ **Completed:**
- Database design and implementation
- JWT authentication system
- REST API (30+ endpoints)
- Student management with comprehensive registration
- Academic records tracking
- Marks entry system
- Attendance tracking module
- Behavioral incident logging
- ML prediction engine
- Modern React UI with Tailwind CSS
- End-to-end workflow

🔄 **In Progress:**
- Advanced analytics dashboard
- Parent portal enhancements
- Batch prediction improvements

## 🤝 Contributing
Contributions welcome! Please create issues and pull requests.

## 📝 License
Educational Project - 2026

## 👨💻 Developer
Built with ❤️ by [Your Name]  
Final Year B.Tech Project

---

**Note:** This is an educational project demonstrating full-stack development with AI/ML integration.
