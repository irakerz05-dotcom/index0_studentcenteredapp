import os

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from database import get_db_connection

load_dotenv()

app = Flask(__name__)
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
        
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        establishments = [dict(zip(columns, row)) for row in rows]
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
        columns = [desc[0] for desc in cur.description]
        row = cur.fetchone()
        
        if not row:
            return jsonify({"error": "Establishment not found"}), 404
        
        establishment = dict(zip(columns, row))
        cur.close()
        conn.close()
        
        return jsonify(establishment)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ===== REVIEW ROUTES =====
@app.post("/api/reviews")
def create_review():
    """Create a new review for an establishment"""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ["user_id", "store_id", "rating_score", "review_text"]):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute(
            """
            INSERT INTO review (user_id, store_id, rating_score, review_text)
            VALUES (%s, %s, %s, %s) RETURNING review_id
            """,
            (data["user_id"], data["store_id"], data["rating_score"], data["review_text"]),
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
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        reviews = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        
        return jsonify(reviews)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


# ===== BOOKMARK ROUTES =====
@app.post("/api/bookmarks")
def create_bookmark():
    """Save an establishment to user's bookmarks"""
    try:
        data = request.get_json()
        
        if not all(k in data for k in ["user_id", "store_id"]):
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
            (data["user_id"], data["store_id"]),
        )
        
        bookmark_id = cur.fetchone()[0]
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Establishment bookmarked", "bookmark_id": bookmark_id}), 201
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.get("/api/users/<int:user_id>/bookmarks")
def get_bookmarks(user_id):
    """Get all bookmarks for a user"""
    try:
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
        columns = [desc[0] for desc in cur.description]
        rows = cur.fetchall()
        
        bookmarks = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        
        return jsonify(bookmarks)
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.delete("/api/bookmarks/<int:user_id>/<int:store_id>")
def delete_bookmark(user_id, store_id):
    """Remove an establishment from user's bookmarks"""
    try:
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
