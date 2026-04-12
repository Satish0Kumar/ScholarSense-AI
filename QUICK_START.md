# Quick Start Guide - ScholarSense

## 🚀 Start Backend API
```bash
cd backend
python api.py
```
API runs on: http://localhost:5000

## 🎨 Start Frontend
```bash
cd frontend-react
npm run dev
```
UI opens at: http://localhost:5173

## 🔐 Login
- **Admin**: admin@scholarsense.com / admin123
- **Teacher**: teacher@scholarsense.com / teacher123

## 🧪 Run Tests
```bash
# API tests
python tests/test_api.py

# Integration tests (requires JWT token)
python tests/test_integration.py <jwt_token>
```

## 🏥 Health Check
```bash
curl http://127.0.0.1:5000/api/health
```

## 📊 Make Prediction
1. Login to UI
2. Navigate to Students → Select Student
3. Click "Predict Risk"
4. View risk assessment and recommendations
