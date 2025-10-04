# LMS Startup Guide

## Quick Start Instructions

### 1. Start the Backend Server

Open a terminal in the `backend` directory and run:

```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see output like:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Started server process [xxxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### 2. Start the Frontend Server

Open another terminal in the `frontend` directory and run:

```bash
cd frontend
npm run dev
```

You should see output like:

```
▲ Next.js 15.5.4
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000

✓ Ready in 2.1s
```

### 3. Verify Everything is Working

1. **Check Backend Health:**

   ```bash
   curl http://localhost:8000/health
   ```

   Should return: `{"status":"healthy","message":"Learning Management System API is running"}`

2. **Check API Endpoints:**

   ```bash
   curl http://localhost:8000/api/courses/categories
   ```

   Should return a JSON array of course categories.

3. **Check Frontend:**
   - Open http://localhost:3000 in your browser
   - Look for the API status indicator in the top-right corner
   - It should show "API Connected" (green) if everything is working

### 4. Test API Connection from Frontend

1. Open the browser developer console (F12)
2. Look for the API Debug Panel in the bottom-right corner of the page
3. Click "Test Direct Fetch" to verify the connection
4. Check the console for detailed logging

## Troubleshooting

### Backend Issues

**Problem:** Backend won't start

- **Solution:** Check if Python and dependencies are installed:
  ```bash
  cd backend
  pip install -r requirements.txt
  ```

**Problem:** Port 8000 already in use

- **Solution:** Kill the existing process or use a different port:

  ```bash
  # Windows
  netstat -ano | findstr :8000
  taskkill /PID <process_id> /F

  # Mac/Linux
  lsof -ti:8000 | xargs kill -9
  ```

**Problem:** Database connection errors

- **Solution:** Check MySQL is running and database exists:
  ```bash
  mysql -u root -p
  CREATE DATABASE learn_with_roko;
  ```

### Frontend Issues

**Problem:** Frontend won't start

- **Solution:** Install dependencies:
  ```bash
  cd frontend
  npm install
  ```

**Problem:** "API Disconnected" message

- **Solutions:**
  1. Ensure backend is running on port 8000
  2. Check for CORS issues in browser console
  3. Verify no firewall blocking localhost connections
  4. Try the API Debug Panel tests

**Problem:** Authentication errors (403 Forbidden)

- **Solutions:**
  1. Clear browser cookies and localStorage
  2. Login again with super admin credentials
  3. Check browser developer tools for token in cookies

### Network Issues

**Problem:** CORS errors

- **Solution:** Backend should automatically handle CORS for localhost:3000
- **Check:** Look for `access-control-allow-origin` headers in network tab

**Problem:** Connection refused

- **Solution:** Verify both servers are running:

  ```bash
  # Check backend
  curl http://localhost:8000/health

  # Check frontend
  curl http://localhost:3000
  ```

## Development Workflow

### Normal Development Process

1. **Start Backend First:**

   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Start Frontend Second:**

   ```bash
   cd frontend
   npm run dev
   ```

3. **Verify Connection:**
   - Check API status indicator (should be green)
   - Test API debug panel
   - Login as super admin to test full functionality

### Super Admin Testing

1. **Login Credentials:** Use your super admin account
2. **Test File Upload:** Try uploading course videos/images
3. **Test Course Management:** Create, edit, delete courses
4. **Check Permissions:** Verify access to admin panel

## Useful Commands

### Backend Commands

```bash
# Start backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Check backend health
curl http://localhost:8000/health

# Test API endpoint
curl http://localhost:8000/api/courses/categories
```

### Frontend Commands

```bash
# Start frontend
npm run dev

# Check backend connectivity
npm run check:backend

# Validate CSS
npm run validate:css

# Build for production
npm run build
```

### Database Commands

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE learn_with_roko;

# Show databases
SHOW DATABASES;
```

## Environment Configuration

### Backend (.env)

```
DB_NAME=learn_with_roko
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
SECRET_KEY=your_secure_secret_key_here
BACKEND_URL=http://localhost:8000
```

### Frontend (automatic)

- API URL: `http://localhost:8000/api` (default)
- Frontend URL: `http://localhost:3000` (default)

## Success Indicators

✅ **Backend Running:** Health endpoint returns 200 OK
✅ **Frontend Running:** Page loads at localhost:3000
✅ **API Connected:** Green status indicator in UI
✅ **Authentication Working:** Can login as super admin
✅ **File Upload Working:** Can upload course materials
✅ **No Console Errors:** Clean browser console

If you see all these indicators, your LMS is ready for development and testing!
