
CREATE DATABASE IF NOT EXISTS travel_planner;

USE travel_planner;

DROP TABLE IF EXISTS user_plans;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS places;


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
    image_url VARCHAR(500),
    google_maps_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE user_plans (
    user_id INT NOT NULL,
    place_id INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, place_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES places(id) ON DELETE CASCADE
);

INSERT INTO places (id, name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude) VALUES
(1, 'Fort Frederick', 'Heritage', 2.0, 
 'Historic fort built by the Portuguese in 1624, later expanded by the Dutch and British. Located near Swami Rock, this fort offers stunning views and rich colonial history.',
 '8:00 AM - 6:00 PM Daily', 'Free', 
 'Best visited early morning or late afternoon. Wear comfortable shoes for walking on uneven surfaces.',
 8.56700000, 81.23500000),

(2, 'Koneswaram Temple', 'Religious', 2.0, 
 'Ancient Hindu temple situated on Swami Rock overlooking the ocean. Known for its architectural beauty, panoramic views, and spiritual significance.',
 '5:30 AM - 12:00 PM, 4:00 PM - 8:00 PM Daily', 'Free (Donations welcome)', 
 'Dress modestly (cover shoulders and knees). Remove shoes before entering. Best view at sunset.',
 8.57500000, 81.24500000),

(3, 'Lover''s Leap', 'Scenic', 2.0, 
 'Cliff viewpoint within the Fort Frederick/Koneswaram area offering breathtaking ocean views. A romantic spot with stunning photo opportunities.',
 'Sunrise to Sunset', 'Free', 
 'Be careful near cliff edges. Best for photography during golden hour (sunset).',
 8.57000000, 81.24000000),

(4, 'Dutch Bay Beach', 'Beach', 1.0, 
 'Small beach near the town centre, ideal for relaxing and evening walks. Calm waters perfect for swimming.',
 '24/7', 'Free', 
 'Best time: Early morning or late afternoon. Bring own snacks as facilities are limited.',
 8.55000000, 81.21500000),

(5, 'Maritime and Naval History Museum', 'Museum', 2.0, 
 'Museum inside Fort Frederick displaying Sri Lanka''s maritime and naval history, artifacts, ship models, and naval equipment.',
 '9:00 AM - 5:00 PM (Closed Mondays)', 'LKR 200 (approx $1)', 
 'Allow 1-2 hours for full exploration. Photography may be restricted in some areas.',
 8.56500000, 81.23200000),

(6, 'Deer Park', 'Nature', 2.0, 
 'Natural park area near Fort Frederick where spotted deer roam freely. Ideal for photography and nature lovers.',
 '6:00 AM - 6:00 PM', 'Free', 
 'Don''t feed the deer processed foods. Bring camera for wildlife photos. Visit early morning for more animal activity.',
 8.57200000, 81.23800000),

(7, 'Pathirakali Amman Temple', 'Religious', 2.0, 
 'Colourful Hindu temple dedicated to Goddess Kali, featuring intricate statues, vibrant colors, and traditional Dravidian architecture.',
 '6:00 AM - 12:00 PM, 4:00 PM - 8:00 PM', 'Free', 
 'Remove footwear before entering. Photography may be limited inside. Respect local customs.',
 8.56000000, 81.22800000),

(8, 'Hot Water Wells (Kanniya)', 'Nature', 9.0, 
 'Series of seven hot water springs believed to have therapeutic properties. Each well has water at different temperatures.',
 '6:00 AM - 6:00 PM', 'Free (Small donation appreciated)', 
 'Bring a towel if you want to experience the water. Best visited in morning. Combine with nearby attractions.',
 8.53100000, 81.18500000),

(9, 'Trincomalee British War Cemetery', 'Heritage', 6.0, 
 'Commonwealth War Graves cemetery commemorating World War II soldiers in a peaceful, well-maintained garden setting.',
 '8:00 AM - 5:00 PM Daily', 'Free', 
 'Maintain silence and respect. Good for history enthusiasts. Well-maintained gardens for quiet reflection.',
 8.54500000, 81.22700000),

(10, 'Trincomalee Harbour', 'Cultural', 1.0, 
 'One of the world''s finest natural harbours, offering scenic waterfront views, fishing activities, and historical significance as a strategic port.',
 '24/7 (Best viewed during daytime)', 'Free', 
 'Best visited during sunset for spectacular views. Take a boat tour for full experience.',
 8.55500000, 81.21000000);


INSERT INTO users (username, password, is_admin) VALUES 
('admin', 'admin123', 1);

INSERT INTO users (username, password, is_admin) VALUES 
('testuser', 'test123', 0);

SELECT '✅ DATABASE SETUP COMPLETE!' AS Status;
SELECT COUNT(*) AS TotalPlaces FROM places;
SELECT COUNT(*) AS TotalUsers FROM users;

SELECT id, name, category, distance, opening_hours, entry_fee FROM places ORDER BY distance;

SELECT id, username, is_admin, created_at FROM users;


