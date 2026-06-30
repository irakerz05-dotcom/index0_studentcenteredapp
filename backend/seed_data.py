import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

conn = psycopg2.connect(
    host=os.getenv("DB_HOST", "localhost"),
    port=os.getenv("DB_PORT", "5432"),
    dbname="postgres",
    user=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", ""),
)

cur = conn.cursor()

# Check if data already exists
cur.execute("SELECT COUNT(*) FROM establishment")
count = cur.fetchone()[0]

if count == 0:
    # Insert sample establishments
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
