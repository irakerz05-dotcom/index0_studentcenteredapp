import os
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash
from database import get_db_connection

load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-only-change-this-secret")
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                origin.strip()
                for origin in os.getenv(
                    "CORS_ORIGINS",
                    "http://127.0.0.1:5173,http://localhost:5173",
                ).split(",")
                if origin.strip()
            ]
        }
    },
)

TOKEN_SALT = "student-services-map-auth"
TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30


def get_serializer():
    return URLSafeTimedSerializer(app.config["SECRET_KEY"])


def make_token(user_id):
    return get_serializer().dumps({"user_id": user_id}, salt=TOKEN_SALT)


def rows_to_dicts(cursor, rows):
    columns = [desc[0] for desc in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def fetch_user(user_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT user_id, full_name, email, school, role, date_registered
        FROM "user"
        WHERE user_id = %s
        """,
        (user_id,),
    )
    rows = rows_to_dicts(cur, cur.fetchall())
    cur.close()
    conn.close()
    return rows[0] if rows else None


def auth_user():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.removeprefix("Bearer ").strip()
    try:
        payload = get_serializer().loads(
            token,
            salt=TOKEN_SALT,
            max_age=TOKEN_MAX_AGE_SECONDS,
        )
    except (BadSignature, SignatureExpired):
        return None

    return fetch_user(payload.get("user_id"))


def require_auth(route):
    @wraps(route)
    def wrapper(*args, **kwargs):
        user = auth_user()
        if not user:
            return jsonify({"error": "Login required"}), 401
        request.current_user = user
        return route(*args, **kwargs)

    return wrapper


def user_response(user):
    return {
        "user_id": user["user_id"],
        "full_name": user["full_name"],
        "email": user["email"],
        "school": user.get("school"),
        "role": user.get("role"),
    }


def password_matches(stored_hash, password):
    try:
        return check_password_hash(stored_hash, password)
    except ValueError:
        return False


@app.get("/")
def home():
    return jsonify({"message": "Student-Centered App Backend is running"})


@app.get("/health")
def health():
    try:
        connection = get_db_connection()
        connection.close()
        return jsonify({"message": "Connected to PostgreSQL!"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ===== AUTH ROUTES =====
@app.post("/api/auth/signup")
def signup():
    try:
        data = request.get_json() or {}
        full_name = (data.get("full_name") or "").strip()
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""
        school = (data.get("school") or "").strip() or None

        if not full_name or not email or len(password) < 6:
            return jsonify({"error": "Name, email, and a password of at least 6 characters are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO "user" (full_name, email, password_hash, school, role)
            VALUES (%s, %s, %s, %s, 'student')
            RETURNING user_id, full_name, email, school, role, date_registered
            """,
            (full_name, email, generate_password_hash(password), school),
        )
        user = rows_to_dicts(cur, [cur.fetchone()])[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"token": make_token(user["user_id"]), "user": user_response(user)}), 201
    except Exception as exc:
        if "duplicate key" in str(exc).lower() or "unique" in str(exc).lower():
            return jsonify({"error": "An account with that email already exists"}), 409
        return jsonify({"error": str(exc)}), 500


@app.post("/api/auth/login")
def login():
    try:
        data = request.get_json() or {}
        email = (data.get("email") or "").strip().lower()
        password = data.get("password") or ""

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT user_id, full_name, email, password_hash, school, role, date_registered
            FROM "user"
            WHERE email = %s
            """,
            (email,),
        )
        rows = rows_to_dicts(cur, cur.fetchall())
        cur.close()
        conn.close()

        if not rows or not password_matches(rows[0]["password_hash"], password):
            return jsonify({"error": "Invalid email or password"}), 401

        user = rows[0]
        return jsonify({"token": make_token(user["user_id"]), "user": user_response(user)})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/me")
@require_auth
def me():
    return jsonify({"user": user_response(request.current_user)})


# ===== ESTABLISHMENT ROUTES =====
@app.get("/api/establishments")
def get_establishments():
    """Get all establishments or filter by type"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        establishment_type = request.args.get("type")
        
        if establishment_type:
            cur.execute("SELECT * FROM establishment WHERE type = %s", (establishment_type,))
        else:
            cur.execute("SELECT * FROM establishment")
        
        rows = cur.fetchall()
        
        establishments = rows_to_dicts(cur, rows)
        cur.close()
        conn.close()
        
        return jsonify(establishments)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/establishments/<int:store_id>")
def get_establishment(store_id):
    """Get a specific establishment by ID"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM establishment WHERE store_id = %s", (store_id,))
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error": "Establishment not found"}), 404
        
        establishment = rows_to_dicts(cur, [row])[0]
        cur.close()
        conn.close()
        
        return jsonify(establishment)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.post("/api/establishments")
@require_auth
def create_establishment():
    """Allow a logged-in student to suggest an establishment."""
    try:
        data = request.get_json() or {}
        required_fields = ["name", "type", "address", "latitude", "longitude"]

        if not all(str(data.get(field) or "").strip() for field in required_fields):
            return jsonify({"error": "Name, type, address, latitude, and longitude are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO establishment (
              name, type, address, contact_number, operating_hours, price_range, description,
              latitude, longitude, district, availability_status, verification_status,
              verified_at, data_notes
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, %s)
            RETURNING *
            """,
            (
                data["name"].strip(),
                data["type"].strip(),
                data["address"].strip(),
                (data.get("contact_number") or "").strip() or None,
                (data.get("operating_hours") or "").strip() or "To verify",
                (data.get("price_range") or "").strip() or "To verify",
                (data.get("description") or "").strip() or "Student-submitted service.",
                data["latitude"],
                data["longitude"],
                (data.get("district") or "").strip() or "University Belt, Manila",
                (data.get("availability_status") or "").strip() or "Unknown",
                "student_submitted",
                f"Submitted by user_id={request.current_user['user_id']}. Needs moderator verification.",
            ),
        )
        establishment = rows_to_dicts(cur, [cur.fetchone()])[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify(establishment), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ===== REVIEW ROUTES =====
@app.post("/api/reviews")
@require_auth
def create_review():
    """Create a new review for an establishment"""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ["store_id", "rating_score", "review_text"]):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO review (user_id, store_id, rating_score, review_text)
            VALUES (%s, %s, %s, %s) RETURNING review_id
            """,
            (
                request.current_user["user_id"],
                data["store_id"],
                data["rating_score"],
                data["review_text"],
            ),
        )
        
        review_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Review created", "review_id": review_id}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/establishments/<int:store_id>/reviews")
def get_reviews(store_id):
    """Get all reviews for an establishment"""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "SELECT * FROM review WHERE store_id = %s ORDER BY date_posted DESC",
            (store_id,),
        )
        rows = cur.fetchall()
        
        reviews = rows_to_dicts(cur, rows)
        cur.close()
        conn.close()
        
        return jsonify(reviews)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ===== BOOKMARK ROUTES =====
@app.post("/api/bookmarks")
@require_auth
def create_bookmark():
    """Save an establishment to user's bookmarks"""
    try:
        data = request.get_json()
        
        if "store_id" not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO bookmark (user_id, store_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, store_id) DO UPDATE
              SET date_saved = CURRENT_TIMESTAMP
            RETURNING bookmark_id
            """,
            (request.current_user["user_id"], data["store_id"]),
        )
        
        bookmark_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Establishment bookmarked", "bookmark_id": bookmark_id}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/users/<int:user_id>/bookmarks")
@require_auth
def get_bookmarks(user_id):
    """Get all bookmarks for a user"""
    try:
        if request.current_user["user_id"] != user_id:
            return jsonify({"error": "You can only view your own bookmarks"}), 403

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            SELECT e.* FROM establishment e
            JOIN bookmark b ON e.store_id = b.store_id
            WHERE b.user_id = %s
            ORDER BY b.date_saved DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()
        
        bookmarks = rows_to_dicts(cur, rows)
        cur.close()
        conn.close()
        
        return jsonify(bookmarks)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.delete("/api/bookmarks/<int:user_id>/<int:store_id>")
@require_auth
def delete_bookmark(user_id, store_id):
    """Remove an establishment from user's bookmarks"""
    try:
        if request.current_user["user_id"] != user_id:
            return jsonify({"error": "You can only remove your own bookmarks"}), 403

        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            "DELETE FROM bookmark WHERE user_id = %s AND store_id = %s",
            (user_id, store_id),
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Bookmark removed"})
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
