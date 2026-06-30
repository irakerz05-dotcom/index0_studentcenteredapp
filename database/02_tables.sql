-- User Table
CREATE TABLE IF NOT EXISTS "user" (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    school VARCHAR(150),
    role VARCHAR(50) DEFAULT 'student',
    date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Establishment Table
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
);

-- Review Table
CREATE TABLE IF NOT EXISTS review (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    rating_score INTEGER CHECK (rating_score >= 1 AND rating_score <= 5),
    review_text TEXT,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES establishment(store_id) ON DELETE CASCADE
);

-- Bookmark Table
CREATE TABLE IF NOT EXISTS bookmark (
    bookmark_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    date_saved TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES establishment(store_id) ON DELETE CASCADE
);

-- Search History Table (optional but useful)
CREATE TABLE IF NOT EXISTS search (
    search_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    search_query VARCHAR(255),
    filter_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);
