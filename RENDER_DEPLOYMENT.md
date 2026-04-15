# 🚀 Render Deployment Guide - ScholarSense Backend

## ⚠️ CRITICAL: Pre-Deployment Checklist

Before deploying to Render, you MUST have these ready:

### 1. Generate Secret Keys
Run these commands to generate secure random keys:
```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```
Save both outputs - you'll need them in Render environment variables.

### 2. Get Supabase Database Credentials
Go to Supabase Dashboard → Settings → Database → Connection parameters:
- **DB_HOST**: `db.xxxxxxxxxxxx.supabase.co`
- **DB_PORT**: `5432`
- **DB_NAME**: `postgres`
- **DB_USER**: `postgres.xxxxxxxxxxxx` (includes project ID)
- **DB_PASSWORD**: Your database password

---

## 📋 Step-by-Step Render Setup

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account
3. Select **ScholarSense-AI** repository
4. Click **"Connect"**

### Step 3: Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `scholarsense-backend` |
| **Region** | `Singapore` (closest to India) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `cd .. && gunicorn backend.api:app --bind 0.0.0.0:$PORT` |

⚠️ **IMPORTANT**: The start command MUST be exactly as shown above to fix Python path issues.

### Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add ALL of these (copy from your generated values):

```bash
# ── Security (REQUIRED - App will crash without these) ──────────────
SECRET_KEY=<paste_your_generated_secret_key_here>
JWT_SECRET_KEY=<paste_your_generated_jwt_secret_key_here>

# ── Database (REQUIRED - From Supabase) ─────────────────────────────
DB_HOST=db.xxxxxxxxxxxx.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres.xxxxxxxxxxxx
DB_PASSWORD=<your_supabase_db_password>

# ── Application Settings ────────────────────────────────────────────
FLASK_ENV=production
FLASK_DEBUG=False
JWT_ACCESS_TOKEN_EXPIRES=3600
PROJECT_NAME=ScholarSense

# ── CORS (Update after Vercel deployment) ──────────────────────────
CORS_ORIGINS=http://localhost:5173

# ── Email Service (Optional - Gmail SMTP) ───────────────────────────
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=ScholarSense
```

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Render starts building (takes 3-5 minutes first time)
3. Watch build logs for errors

### Step 6: Verify Deployment
Once deployed, you'll get a URL like:
```
https://scholarsense-backend.onrender.com
```

Test the health endpoint:
```
https://scholarsense-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "ScholarSense API",
  "version": "3.0",
  "database": { ... }
}
```

### Step 7: Update CORS After Vercel Deployment
Once you deploy frontend to Vercel and get your URL:
1. Go to Render → Environment
2. Update `CORS_ORIGINS`:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
   ```
3. Click **"Save Changes"** → Render auto-redeploys

---

## 🔴 Common Errors & Solutions

### Error 1: "SECRET_KEY environment variable is not set!"
**Cause**: Missing SECRET_KEY or JWT_SECRET_KEY in Render environment variables

**Fix**:
1. Generate keys: `python -c "import secrets; print(secrets.token_hex(32))"`
2. Add both `SECRET_KEY` and `JWT_SECRET_KEY` in Render dashboard
3. Click "Save Changes"

---

### Error 2: "ModuleNotFoundError: No module named 'backend'"
**Cause**: Wrong start command or Python path issue

**Fix**: Update start command to:
```bash
cd .. && gunicorn backend.api:app --bind 0.0.0.0:$PORT
```

---

### Error 3: "Database connection failed"
**Cause**: Wrong Supabase credentials

**Fix**:
1. Go to Supabase → Settings → Database → Connection parameters
2. Verify all DB_* environment variables match exactly
3. Check DB_USER format: `postgres.xxxxxxxxxxxx` (includes project ID)
4. Verify DB_PASSWORD is correct

---

### Error 4: "CORS blocked on frontend"
**Cause**: Vercel URL not in CORS_ORIGINS

**Fix**:
1. Get your Vercel URL: `https://your-app.vercel.app`
2. Update CORS_ORIGINS in Render:
   ```
   CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
   ```

---

### Error 5: Build timeout (scikit-learn install slow)
**Cause**: ML libraries are large (normal on free tier)

**Fix**: Wait 4-6 minutes for first build. Subsequent builds are cached and faster.

---

## 📊 Expected Build Logs

Successful deployment should show:
```
✅ Database connection successful!
🔐 JWT Configuration: ...
📡 Gunicorn booting on 0.0.0.0:10000
[INFO] Listening at: http://0.0.0.0:10000
```

---

## 🔄 Deployment Order (Important!)

Follow this exact order:

1. ✅ **Setup Supabase** → Get DB credentials
2. ✅ **Deploy Backend on Render** → Add all env vars → Get Render URL
3. ✅ **Deploy Frontend on Vercel** → Set `VITE_API_URL` = Render URL
4. ✅ **Update CORS on Render** → Add Vercel URL to `CORS_ORIGINS`
5. ✅ **Run schema.sql on Supabase** → Initialize database tables
6. ✅ **Test login** → Use default credentials

---

## 🧪 Testing After Deployment

### 1. Test Health Endpoint
```bash
curl https://scholarsense-backend.onrender.com/api/health
```

### 2. Test Login
```bash
curl -X POST https://scholarsense-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@scholarsense.com","password":"admin123"}'
```

Should return JWT token.

### 3. Test from Frontend
1. Open Vercel URL
2. Login with default credentials
3. Check browser console for API calls
4. Verify no CORS errors

---

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `SECRET_KEY` | ✅ Yes | Flask secret key | 64-char hex string |
| `JWT_SECRET_KEY` | ✅ Yes | JWT signing key | 64-char hex string |
| `DB_HOST` | ✅ Yes | Supabase host | `db.xxx.supabase.co` |
| `DB_PORT` | ✅ Yes | PostgreSQL port | `5432` |
| `DB_NAME` | ✅ Yes | Database name | `postgres` |
| `DB_USER` | ✅ Yes | Database user | `postgres.xxx` |
| `DB_PASSWORD` | ✅ Yes | Database password | From Supabase |
| `CORS_ORIGINS` | ✅ Yes | Allowed origins | Comma-separated URLs |
| `FLASK_ENV` | No | Environment | `production` |
| `FLASK_DEBUG` | No | Debug mode | `False` |
| `JWT_ACCESS_TOKEN_EXPIRES` | No | Token expiry (seconds) | `3600` |
| `EMAIL_HOST` | No | SMTP host | `smtp.gmail.com` |
| `EMAIL_PORT` | No | SMTP port | `587` |
| `EMAIL_USER` | No | Gmail address | `your@gmail.com` |
| `EMAIL_PASSWORD` | No | Gmail app password | 16-char password |

---

## 🆘 Still Having Issues?

1. Check Render logs: Dashboard → Logs tab
2. Look for the exact error message
3. Verify all environment variables are set correctly
4. Test database connection from Supabase dashboard
5. Ensure schema.sql has been run on Supabase

---

## 📞 Support

For deployment issues, check:
- Render build logs
- Supabase connection status
- Environment variables configuration
- CORS settings

---

**Last Updated**: 2025
**Version**: 3.0
