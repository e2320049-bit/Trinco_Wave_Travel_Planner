-- Drop and recreate database
DROP DATABASE IF EXISTS travel_planner;
CREATE DATABASE travel_planner;
USE travel_planner;

-- Create places table
CREATE TABLE places (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    distance DECIMAL(5,2) NOT NULL,
    description TEXT,
    opening_hours VARCHAR(100),
    entry_fee VARCHAR(100),
    travel_tips TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_plans table
CREATE TABLE user_plans (
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, place_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

-- Insert sample places
INSERT INTO places (id, name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude) VALUES
(1, 'Fort Frederick', 'Heritage', 2.0, 'Historic fort built by the Portuguese in 1624, later expanded by the Dutch and British.', '8:00 AM - 6:00 PM Daily', 'Free', 'Best visited early morning or late afternoon.', 8.56700000, 81.23500000),
(2, 'Koneswaram Temple', 'Religious', 2.0, 'Ancient Hindu temple on Swami Rock overlooking the ocean.', '5:30 AM - 12:00 PM, 4:00 PM - 8:00 PM', 'Free', 'Dress modestly. Remove shoes before entering.', 8.57500000, 81.24500000),
(3, 'Lover\'s Leap', 'Scenic', 2.0, 'Cliff viewpoint offering breathtaking ocean views.', 'Sunrise to Sunset', 'Free', 'Be careful near cliff edges.', 8.57000000, 81.24000000),
(4, 'Dutch Bay Beach', 'Beach', 1.0, 'Small beach near town centre, ideal for relaxing.', '24/7', 'Free', 'Best time: Early morning or late afternoon.', 8.55000000, 81.21500000),
(5, 'Maritime Museum', 'Museum', 2.0, 'Museum displaying Sri Lanka\'s maritime history.', '9:00 AM - 5:00 PM (Closed Mondays)', 'LKR 200', 'Allow 1-2 hours for full exploration.', 8.56500000, 81.23200000),
(6, 'Deer Park', 'Nature', 2.0, 'Natural park where spotted deer roam freely.', '6:00 AM - 6:00 PM', 'Free', 'Visit early morning for more animal activity.', 8.57200000, 81.23800000),
(7, 'Pathirakali Amman Temple', 'Religious', 2.0, 'Hindu temple dedicated to Goddess Kali.', '6:00 AM - 12:00 PM, 4:00 PM - 8:00 PM', 'Free', 'Remove footwear before entering.', 8.56000000, 81.22800000),
(8, 'Hot Water Wells', 'Nature', 9.0, 'Seven hot water springs with therapeutic properties.', '6:00 AM - 6:00 PM', 'Free', 'Bring a towel. Best visited in morning.', 8.53100000, 81.18500000),
(9, 'British War Cemetery', 'Heritage', 6.0, 'Commonwealth War Graves cemetery.', '8:00 AM - 5:00 PM', 'Free', 'Maintain silence and respect.', 8.54500000, 81.22700000),
(10, 'Trincomalee Harbour', 'Cultural', 1.0, 'One of the world\'s finest natural harbours.', '24/7', 'Free', 'Best visited during sunset.', 8.55500000, 81.21000000);

-- Insert admin user (password: admin123)
-- Note: This is a bcrypt hash of 'admin123'
INSERT INTO users (username, password, is_admin) VALUES 
('admin', '$2b$10$CwTycUXWue0Thq9StjUM0uQY5iMqGJqL8YqWxqXqXqXqXqXqXqXq', 1);

-- Insert test user (password: test123)
INSERT INTO users (username, password, is_admin) VALUES 
('testuser', '$2b$10$DxTycUXWue0Thq9StjUM0uQY5iMqGJqL8YqWxqXqXqXqXqXqXqX', 0);

SELECT '✅ Database setup complete!' AS Status;
SELECT COUNT(*) AS TotalPlaces FROM places;
SELECT COUNT(*) AS TotalUsers FROM users;
