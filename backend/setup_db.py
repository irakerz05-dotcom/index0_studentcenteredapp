from database import get_db_connection

conn = get_db_connection()
cur = conn.cursor()

# Check which database we're in
cur.execute("SELECT current_database()")
db_name = cur.fetchone()[0]
print(f"Connected to database: {db_name}")

# Create User table
cur.execute(
    """
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    school VARCHAR(150),
    role VARCHAR(50) DEFAULT 'student',
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""
)

# Create Establishment table
cur.execute(
    """
CREATE TABLE IF NOT EXISTS establishment (
    store_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    contact_number VARCHAR(20),
    operating_hours VARCHAR(100),
    price_range VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""
)

# Create Review table
cur.execute(
    """
CREATE TABLE IF NOT EXISTS review (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    rating_score INTEGER CHECK (rating_score >= 1 AND rating_score <= 5),
    review_text TEXT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES establishment(store_id) ON DELETE CASCADE
)
"""
)

# Create Bookmark table
cur.execute(
    """
CREATE TABLE IF NOT EXISTS bookmark (
    bookmark_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES establishment(store_id) ON DELETE CASCADE
)
"""
)

# Create Search table
cur.execute(
    """
CREATE TABLE IF NOT EXISTS search (
    search_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    search_query VARCHAR(255),
    filter_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
)
"""
)

conn.commit()
print("✓ All tables created successfully!")

# Now add seed data
cur.execute("SELECT COUNT(*) FROM establishment")
count = cur.fetchone()[0]

if count == 0:
    establishments = [
        (
            "Campus Study Hub",
            "Study Center",
            "123 Main St, Near Campus",
            "555-0101",
            "08:00-22:00",
            "$",
            "Quiet study space with WiFi and outlets",
        ),
        (
            "Tech Repair Shop",
            "Computer Shop",
            "456 Tech Ave, Campus District",
            "555-0102",
            "09:00-18:00",
            "$$",
            "Laptop and phone repairs",
        ),
        (
            "QuickPrint Center",
            "Printing & Binding",
            "789 Copy Lane, Student Area",
            "555-0103",
            "07:00-20:00",
            "$",
            "Fast printing and bookbinding services",
        ),
        (
            "Student Dorm Supply",
            "General Store",
            "321 Dorm Rd, Housing Area",
            "555-0104",
            "10:00-21:00",
            "$$",
            "Dorm essentials and supplies",
        ),
        (
            "Campus Cafe",
            "Cafe",
            "654 Food St, Central Campus",
            "555-0105",
            "08:00-17:00",
            "$",
            "Coffee and snacks for students",
        ),
    ]

    for est in establishments:
        cur.execute(
            """
            INSERT INTO establishment (name, type, address, contact_number, operating_hours, price_range, description)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            est,
        )

    # Insert a sample user
    cur.execute(
        """
        INSERT INTO "user" (full_name, email, password_hash, school, role)
        VALUES (%s, %s, %s, %s, %s)
        """,
        ("John Doe", "john@university.edu", "hashed_password_123", "University", "student"),
    )

    conn.commit()
    print("✓ Sample data added successfully!")
else:
    print("✓ Data already exists in the database")

cur.close()
conn.close()

