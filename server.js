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
    password: '',
    database: 'travel_planner',
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        console.log('\n📌 Setup Instructions:');
        console.log('1. Start XAMPP/WAMP (MySQL service)');
        console.log('2. Open phpMyAdmin');
        console.log('3. Create database: travel_planner');
        console.log('4. Import the setup.sql file');
        return;
    }
    console.log('✅ MySQL connected successfully');
    console.log('📊 Database: travel_planner\n');
});

// ============ PLACES API ============

// Get all places
app.get('/api/places', (req, res) => {
    const { category } = req.query;
    let query = 'SELECT * FROM places';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY distance';
    
    db.query(query, params, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Get single place
app.get('/api/places/:id', (req, res) => {
    db.query('SELECT * FROM places WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ error: 'Place not found' });
        res.json(results[0]);
    });
});

// Add new place (Admin)
app.post('/api/places', (req, res) => {
    const { name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude } = req.body;
    
    if (!name || !category || !distance) {
        return res.status(400).json({ error: 'Name, category, and distance are required' });
    }
    
    db.query(
        'INSERT INTO places (name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Place added successfully', id: result.insertId });
        }
    );
});

// Update place (Admin)
app.put('/api/places/:id', (req, res) => {
    const { name, category, distance, description, opening_hours, entry_fee, travel_tips } = req.body;
    
    db.query(
        'UPDATE places SET name = ?, category = ?, distance = ?, description = ?, opening_hours = ?, entry_fee = ?, travel_tips = ? WHERE id = ?',
        [name, category, distance, description, opening_hours, entry_fee, travel_tips, req.params.id],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Place not found' });
            res.json({ message: 'Place updated successfully' });
        }
    );
});

// Delete place (Admin)
app.delete('/api/places/:id', (req, res) => {
    db.query('DELETE FROM user_plans WHERE place_id = ?', [req.params.id], (err) => {
        if (err) console.error(err);
        
        db.query('DELETE FROM places WHERE id = ?', [req.params.id], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Database error' });
            }
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Place not found' });
            res.json({ message: 'Place deleted successfully' });
        });
    });
});

// ============ USER AUTHENTICATION API ============

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ message: 'Registration successful', userId: result.insertId });
            }
        );
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            
            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (!match) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            
            res.json({ 
                message: 'Login successful', 
                userId: user.id, 
                username: user.username,
                isAdmin: user.is_admin === 1
            });
        }
    );
});

// ============ USER PLAN API ============

// Get user's plan
app.get('/api/plan/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.query(
        `SELECT p.* FROM places p 
         INNER JOIN user_plans up ON p.id = up.place_id 
         WHERE up.user_id = ? 
         ORDER BY up.added_at`,
        [userId],
        (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json(results);
        }
    );
});

// Add to plan
app.post('/api/plan/add', (req, res) => {
    const { userId, placeId } = req.body;
    
    db.query(
        'INSERT INTO user_plans (user_id, place_id) VALUES (?, ?)',
        [userId, placeId],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Place already in plan' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Added to plan' });
        }
    );
});

// Remove from plan
app.delete('/api/plan/remove', (req, res) => {
    const { userId, placeId } = req.body;
    
    db.query(
        'DELETE FROM user_plans WHERE user_id = ? AND place_id = ?',
        [userId, placeId],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Removed from plan' });
        }
    );
});

// Clear plan
app.delete('/api/plan/clear/:userId', (req, res) => {
    const { userId } = req.params;
    
    db.query(
        'DELETE FROM user_plans WHERE user_id = ?',
        [userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Plan cleared' });
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📡 API Endpoints:`);
    console.log(`   GET    /api/places`);
    console.log(`   GET    /api/places/:id`);
    console.log(`   POST   /api/places`);
    console.log(`   PUT    /api/places/:id`);
    console.log(`   DELETE /api/places/:id`);
    console.log(`   POST   /api/register`);
    console.log(`   POST   /api/login`);
    console.log(`   GET    /api/plan/:userId`);
    console.log(`   POST   /api/plan/add`);
    console.log(`   DELETE /api/plan/remove`);
    console.log(`   DELETE /api/plan/clear/:userId\n`);
});

