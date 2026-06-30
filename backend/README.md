# Student-Centered App - Backend Setup

## ✅ What's Been Set Up

- **Database**: PostgreSQL with 5 tables (User, Establishment, Review, Bookmark, Search)
- **Backend Framework**: Flask with Python
- **Database Connection**: Configured and tested
- **Sample Data**: 5 establishments and 1 test user loaded

## 📦 Project Structure

```
backend/
├── app.py                  # Main Flask app with all routes
├── config.py              # Database configuration
├── database.py            # Database connection module
├── setup_db.py            # Script to create tables (already run)
├── seed_data.py           # Script to add sample data (already run)
├── requirements.txt       # Python dependencies
└── .env                   # Environment variables (local only)
```

## 🚀 How to Start the Backend

1. Open terminal in the `backend` folder
2. Run: `python app.py`
3. Server will start on `http://127.0.0.1:5000`

## 📡 API Endpoints

### Health Check
- **GET** `/health`
- Response: `{"message": "Connected to PostgreSQL!"}`

### Establishments (Browse)
- **GET** `/api/establishments`
  - Optional filter: `?type=Study Center`
  - Response: List of all establishments

- **GET** `/api/establishments/<id>`
  - Response: Single establishment details

### Reviews
- **GET** `/api/establishments/<store_id>/reviews`
  - Response: All reviews for an establishment

- **POST** `/api/reviews`
  - Body:
    ```json
    {
      "user_id": 1,
      "store_id": 1,
      "rating_score": 5,
      "review_text": "Great place to study!"
    }
    ```

### Bookmarks
- **GET** `/api/users/<user_id>/bookmarks`
  - Response: All bookmarked establishments for a user

- **POST** `/api/bookmarks`
  - Body:
    ```json
    {
      "user_id": 1,
      "store_id": 2
    }
    ```

- **DELETE** `/api/bookmarks/<user_id>/<store_id>`
  - Response: Removes bookmark

## 🧪 Test with curl or Postman

### Get all establishments
```bash
curl http://127.0.0.1:5000/api/establishments
```

### Get a single establishment
```bash
curl http://127.0.0.1:5000/api/establishments/1
```

### Post a review
```bash
curl -X POST http://127.0.0.1:5000/api/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "store_id": 1,
    "rating_score": 4,
    "review_text": "Good place, but a bit crowded"
  }'
```

### Create a bookmark
```bash
curl -X POST http://127.0.0.1:5000/api/bookmarks \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "store_id": 1}'
```

### Get user bookmarks
```bash
curl http://127.0.0.1:5000/api/users/1/bookmarks
```

## 📚 Next Steps

1. **Test the API** - Run the curl commands above
2. **Add User Registration** - Create signup endpoint with password hashing
3. **Build Frontend** - Create HTML/CSS/JS interface
4. **Add Authentication** - Implement JWT or session-based login
5. **Deploy** - Move to production server

## 📝 Notes

- Sample user ID is `1` (john@university.edu)
- Sample establishment IDs are `1-5`
- All timestamps are in UTC
- Passwords should be hashed before storing (use bcrypt)
