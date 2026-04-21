const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

console.log('🌊 Trinco Wave Travel Planner Backend Server');
console.log('=============================================\n');

// Database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',  // Your MySQL password (empty for XAMPP default)
    database: 'travel_planner',
    multipleStatements: true
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('\n📌 Setup Instructions:');
        console.log('1. Start XAMPP/WAMP (MySQL service)');
        console.log('2. Open phpMyAdmin');
        console.log('3. Create database: travel_planner');
        console.log('4. Run the SQL setup script provided');
        return;
    }
    console.log('✅ MySQL connected successfully');
    console.log('📊 Database: travel_planner');
    console.log('🔐 Using bcrypt for password encryption\n');
});

// ============ PLACES API ============

// Get all places (with optional category filter)
app.get('/api/places', (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM places';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY distance ASC';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error('❌ Error fetching places:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get single place by ID
app.get('/api/places/:id', (req, res) => {
    db.query('SELECT * FROM places WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching place:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Place not found' });
        }
        res.json(results[0]);
    });
});

// Add new place (Admin only)
app.post('/api/places', (req, res) => {
    const { 
        name, 
        category, 
        distance, 
        description, 
        opening_hours, 
        entry_fee, 
        travel_tips, 
        latitude, 
        longitude,
        image_url,
        google_maps_url
    } = req.body;
    
    // Validate required fields
    if (!name || !category || !distance) {
        return res.status(400).json({ error: 'Name, category, and distance are required' });
    }
    
    const query = `INSERT INTO places 
        (name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude, image_url, google_maps_url) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [
        name, category, distance, description || '', 
        opening_hours || 'Contact for hours', 
        entry_fee || 'Free', 
        travel_tips || 'Enjoy your visit!', 
        latitude || null, 
        longitude || null,
        image_url || null,
        google_maps_url || null
    ], (err, result) => {
        if (err) {
            console.error('❌ Error adding place:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ 
            message: 'Place added successfully', 
            id: result.insertId 
        });
    });
});

// Update place (Admin only)
app.put('/api/places/:id', (req, res) => {
    const { name, category, distance, description, opening_hours, entry_fee, travel_tips } = req.body;
    
    const query = `UPDATE places SET 
        name = ?, 
        category = ?, 
        distance = ?, 
        description = ?, 
        opening_hours = ?, 
        entry_fee = ?, 
        travel_tips = ? 
        WHERE id = ?`;
    
    db.query(query, [
        name, category, distance, description, 
        opening_hours, entry_fee, travel_tips, 
        req.params.id
    ], (err, result) => {
        if (err) {
            console.error('❌ Error updating place:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Place not found' });
        }
        res.json({ message: 'Place updated successfully' });
    });
});

// Delete place (Admin only)
app.delete('/api/places/:id', (req, res) => {
    // First delete from user_plans (foreign key constraint)
    db.query('DELETE FROM user_plans WHERE place_id = ?', [req.params.id], (err) => {
        if (err) {
            console.error('❌ Error deleting from user_plans:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        
        // Then delete the place
        db.query('DELETE FROM places WHERE id = ?', [req.params.id], (err, result) => {
            if (err) {
                console.error('❌ Error deleting place:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Place not found' });
            }
            res.json({ message: 'Place deleted successfully' });
        });
    });
});

// ============ USER AUTHENTICATION API ============

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insert user into database
        db.query(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)',
            [username, hashedPassword, false],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Username already exists. Please choose another.' });
                    }
                    console.error('❌ Registration error:', err);
                    return res.status(500).json({ error: 'Database error during registration' });
                }
                
                console.log(`✅ New user registered: ${username} (ID: ${result.insertId})`);
                res.json({ 
                    message: 'Registration successful! Please login.', 
                    userId: result.insertId 
                });
            }
        );
    } catch (error) {
        console.error('❌ Hashing error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {
            if (err) {
                console.error('❌ Login query error:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                console.log(`❌ Failed login attempt: ${username} - User not found`);
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            
            const user = results[0];
            
            try {
                // Compare password with hashed password
                const match = await bcrypt.compare(password, user.password);
                
                if (!match) {
                    console.log(`❌ Failed login attempt: ${username} - Wrong password`);
                    return res.status(401).json({ error: 'Invalid username or password' });
                }
                
                console.log(`✅ User logged in: ${username} (Admin: ${user.is_admin === 1})`);
                res.json({ 
                    message: 'Login successful', 
                    userId: user.id, 
                    username: user.username,
                    isAdmin: user.is_admin === 1
                });
            } catch (error) {
                console.error('❌ Password comparison error:', error);
                res.status(500).json({ error: 'Server error during login' });
            }
        }
    );
});

// ============ USER PLAN API ============

// Get user's itinerary plan
app.get('/api/plan/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        SELECT p.*, up.added_at 
        FROM places p 
        INNER JOIN user_plans up ON p.id = up.place_id 
        WHERE up.user_id = ? 
        ORDER BY up.added_at ASC
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching user plan:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Add place to user's plan
app.post('/api/plan/add', (req, res) => {
    const { userId, placeId } = req.body;
    
    if (!userId || !placeId) {
        return res.status(400).json({ error: 'User ID and Place ID are required' });
    }
    
    // Check if place exists
    db.query('SELECT id FROM places WHERE id = ?', [placeId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Place not found' });
        }
        
        // Add to plan
        db.query(
            'INSERT INTO user_plans (user_id, place_id) VALUES (?, ?)',
            [userId, placeId],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Place already in your plan' });
                    }
                    console.error('❌ Error adding to plan:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                console.log(`✅ Added place ${placeId} to user ${userId}'s plan`);
                res.json({ message: 'Added to your itinerary plan' });
            }
        );
    });
});

// Remove place from user's plan
app.delete('/api/plan/remove', (req, res) => {
    const { userId, placeId } = req.body;
    
    if (!userId || !placeId) {
        return res.status(400).json({ error: 'User ID and Place ID are required' });
    }
    
    db.query(
        'DELETE FROM user_plans WHERE user_id = ? AND place_id = ?',
        [userId, placeId],
        (err, result) => {
            if (err) {
                console.error('❌ Error removing from plan:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Place not found in your plan' });
            }
            console.log(`✅ Removed place ${placeId} from user ${userId}'s plan`);
            res.json({ message: 'Removed from your itinerary' });
        }
    );
});

// Clear user's entire plan
app.delete('/api/plan/clear/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.query(
        'DELETE FROM user_plans WHERE user_id = ?',
        [userId],
        (err, result) => {
            if (err) {
                console.error('❌ Error clearing plan:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            console.log(`✅ Cleared plan for user ${userId} (${result.affectedRows} items removed)`);
            res.json({ message: 'Your itinerary has been cleared' });
        }
    );
});

// Get user's plan summary (count and total distance)
app.get('/api/plan/summary/:userId', (req, res) => {
    const { userId } = req.params;
    
    const query = `
        SELECT 
            COUNT(*) as total_places,
            SUM(p.distance) as total_distance
        FROM user_plans up
        INNER JOIN places p ON up.place_id = p.id
        WHERE up.user_id = ?
    `;
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('❌ Error getting plan summary:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0] || { total_places: 0, total_distance: 0 });
    });
});

// ============ HEALTH CHECK ============
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        database: db.state === 'authenticated' ? 'connected' : 'disconnected'
    });
});

// ============ START SERVER ============
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   ┌─────────────────────────────────────────┐`);
    console.log(`   │ PLACES                                  │`);
    console.log(`   │  GET    /api/places                    │`);
    console.log(`   │  GET    /api/places/:id                │`);
    console.log(`   │  POST   /api/places                    │`);
    console.log(`   │  PUT    /api/places/:id                │`);
    console.log(`   │  DELETE /api/places/:id                │`);
    console.log(`   ├─────────────────────────────────────────┤`);
    console.log(`   │ AUTHENTICATION                          │`);
    console.log(`   │  POST   /api/register                  │`);
    console.log(`   │  POST   /api/login                     │`);
    console.log(`   ├─────────────────────────────────────────┤`);
    console.log(`   │ USER PLANS                              │`);
    console.log(`   │  GET    /api/plan/:userId              │`);
    console.log(`   │  POST   /api/plan/add                  │`);
    console.log(`   │  DELETE /api/plan/remove               │`);
    console.log(`   │  DELETE /api/plan/clear/:userId        │`);
    console.log(`   │  GET    /api/plan/summary/:userId      │`);
    console.log(`   └─────────────────────────────────────────┘`);
    console.log(`\n✨ Ready to accept requests!\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down server...');
    db.end((err) => {
        if (err) {
            console.error('❌ Error closing database:', err);
        } else {
            console.log('✅ Database connection closed');
        }
        process.exit(0);
    });
});
