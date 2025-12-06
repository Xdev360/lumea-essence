# Lumea Essence - Newsletter System Setup

## 🚀 Local Development Setup

### Prerequisites
- Node.js installed (v14 or higher)
- npm or yarn package manager

### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Main Landing Page: `http://localhost:3000/index.html`
   - Admin Panel: `http://localhost:3000/admin-newsletter.html`
   - Default Admin Password: `LumeaAdmin2025!`

## 📊 Newsletter System Features

### User-Facing Features
- ✅ Newsletter signup modal on landing page
- ✅ Gmail validation (only accepts @gmail.com)
- ✅ Duplicate email prevention
- ✅ Success confirmation message
- ✅ Beautiful branded UI

### Admin Panel Features
- ✅ Password-protected access
- ✅ View all subscribers in a table
- ✅ Search functionality (by name or email)
- ✅ Statistics dashboard (total, today, this week)
- ✅ Export subscribers as CSV
- ✅ Delete individual subscribers
- ✅ Refresh data button
- ✅ Responsive design

## 🔐 Admin Access

**URL:** `http://localhost:3000/admin-newsletter.html`  
**Password:** `LumeaAdmin2025!`

⚠️ **Important:** Change the admin password in `server.js` before deployment!

## 📁 File Structure

```
├── server.js                 # Express backend server
├── package.json             # Node dependencies
├── index.html               # Main landing page
├── admin-newsletter.html    # Admin panel (hidden)
├── data/
│   └── subscribers.json     # Subscriber data storage
└── styles.css              # Styling
```

## 🌐 API Endpoints

### Public Endpoints
- `POST /api/subscribe` - Subscribe to newsletter
  ```json
  {
    "name": "Full Name",
    "email": "email@gmail.com"
  }
  ```

### Admin Endpoints (require auth header)
- `POST /api/admin/verify` - Verify admin password
- `GET /api/admin/subscribers` - Get all subscribers
- `GET /api/admin/export-csv` - Export as CSV
- `DELETE /api/admin/subscriber/:id` - Delete subscriber

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Static Files)
Note: Vercel doesn't support Node.js backends for free tier in this way. You'll need to:
1. Deploy the frontend (static files) to Vercel
2. Deploy the backend separately (Heroku, Railway, Render, etc.)
3. Update API URLs in the frontend to point to your backend URL

### Option 2: Railway.app (Full Stack)
1. Push code to GitHub
2. Connect repository to Railway
3. Deploy automatically

### Option 3: Heroku
1. Create Heroku app
2. Add Procfile: `web: node server.js`
3. Deploy via Git

### Option 4: Render.com
1. Connect GitHub repo
2. Auto-deploy on push
3. Free tier available

## 🔧 Configuration

### Change Admin Password
Edit `server.js`:
```javascript
const ADMIN_PASSWORD = 'YourNewPassword123!';
```

### Change Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

## 📊 Data Storage

Subscribers are stored in `data/subscribers.json` with the following format:
```json
[
  {
    "id": 1638360000000,
    "name": "Jane Doe",
    "email": "jane@gmail.com",
    "dateSubscribed": "2025-12-06T10:30:00.000Z",
    "timestamp": 1638360000000
  }
]
```

## 🔒 Security Notes

1. **Admin Password:** Change the default password in production
2. **HTTPS:** Always use HTTPS in production
3. **Environment Variables:** Use `.env` file for sensitive data
4. **Rate Limiting:** Consider adding rate limiting for API endpoints
5. **Data Backup:** Regularly backup `data/subscribers.json`

## 📝 License

Free to use and modify for Lumea Essence brand.
