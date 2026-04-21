const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('='.repeat(50));
console.log('🌊 Trinco Wave Travel Planner Backend');
console.log('='.repeat(50));

// Database configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'travel_planner',
    port: 3306
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('\n❌ DATABASE CONNECTION FAILED!');
        console.error('Error:', err.message);
        console.log('\n🔧 FIX THESE ISSUES:');
        console.log('1. Open XAMPP Control Panel');
        console.log('2. Click "Start" next to MySQL');
        console.log('3. Wait for green "Running" status');
        console.log('4. Open http://localhost/phpmyadmin');
        console.log('5. Create database: travel_planner');
        console.log('6. Run the SQL script provided\n');
        process.exit(1);
    }
    console.log('\n✅ MySQL Connected Successfully!');
    console.log('📊 Database: travel_planner');
    console.log('🔐 Password encryption: bcrypt\n');
});

// ============ TEST ROUTE ============
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Backend server is running!',
        timestamp: new Date().toISOString()
    });
});

// ============ PLACES ROUTES ============

// Get all places
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
            console.error('Error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json(results);
    });
});

// Get single place
app.get('/api/places/:id', (req, res) => {
    db.query('SELECT * FROM places WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        if (results.length === 0) return res.status(404).json({ success: false, error: 'Place not found' });
        res.json(results[0]);
    });
});

// Add new place (Admin)
app.post('/api/places', (req, res) => {
    const { name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude } = req.body;
    
    if (!name || !category || !distance) {
        return res.status(400).json({ success: false, error: 'Name, category, and distance are required' });
    }
    
    const query = `INSERT INTO places (name, category, distance, description, opening_hours, entry_fee, travel_tips, latitude, longitude) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    db.query(query, [
        name, category, distance, description || '', 
        opening_hours || 'Contact for hours', 
        entry_fee || 'Free', 
        travel_tips || 'Enjoy your visit!', 
        latitude || null, 
        longitude || null
    ], (err, result) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, message: 'Place added successfully', id: result.insertId });
    });
});

// Update place (Admin)
app.put('/api/places/:id', (req, res) => {
    const { name, category, distance, description, opening_hours, entry_fee, travel_tips } = req.body;
    
    const query = `UPDATE places SET name=?, category=?, distance=?, description=?, opening_hours=?, entry_fee=?, travel_tips=? WHERE id=?`;
    
    db.query(query, [name, category, distance, description, opening_hours, entry_fee, travel_tips, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Place not found' });
        res.json({ success: true, message: 'Place updated successfully' });
    });
});

// Delete place (Admin)
app.delete('/api/places/:id', (req, res) => {
    db.query('DELETE FROM user_plans WHERE place_id = ?', [req.params.id], (err) => {
        db.query('DELETE FROM places WHERE id = ?', [req.params.id], (err, result) => {
            if (err) return res.status(500).json({ success: false, error: 'Database error' });
            if (result.affectedRows === 0) return res.status(404).json({ success: false, error: 'Place not found' });
            res.json({ success: true, message: 'Place deleted successfully' });
        });
    });
});

// ============ USER AUTHENTICATION ============

// Register
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    
    if (username.length < 3) {
        return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ success: false, error: 'Password must be at least 4 characters' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)', 
            [username, hashedPassword, false], 
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ success: false, error: 'Username already exists' });
                    }
                    console.error('Error:', err);
                    return res.status(500).json({ success: false, error: 'Database error' });
                }
                console.log(`✅ New user registered: ${username}`);
                res.json({ success: true, message: 'Registration successful! Please login.' });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    
    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        if (results.length === 0) return res.status(401).json({ success: false, error: 'Invalid username or password' });
        
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);
        
        if (!match) return res.status(401).json({ success: false, error: 'Invalid username or password' });
        
        console.log(`✅ User logged in: ${username}`);
        res.json({ 
            success: true, 
            message: 'Login successful',
            userId: user.id, 
            username: user.username,
            isAdmin: user.is_admin === 1
        });
    });
});

// ============ ITINERARY PLANS ============

// Get user's plan
app.get('/api/plan/:userId', (req, res) => {
    const query = `SELECT p.* FROM places p 
                   INNER JOIN user_plans up ON p.id = up.place_id 
                   WHERE up.user_id = ? 
                   ORDER BY up.added_at ASC`;
    
    db.query(query, [req.params.userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        res.json(results);
    });
});

// Add to plan
app.post('/api/plan/add', (req, res) => {
    const { userId, placeId } = req.body;
    
    if (!userId || !placeId) {
        return res.status(400).json({ success: false, error: 'User ID and Place ID required' });
    }
    
    db.query('INSERT INTO user_plans (user_id, place_id) VALUES (?, ?)', [userId, placeId], (err) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, error: 'Place already in your plan' });
            }
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, message: 'Added to your plan' });
    });
});

// Remove from plan
app.delete('/api/plan/remove', (req, res) => {
    const { userId, placeId } = req.body;
    
    db.query('DELETE FROM user_plans WHERE user_id = ? AND place_id = ?', [userId, placeId], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        res.json({ success: true, message: 'Removed from your plan' });
    });
});

// Clear plan
app.delete('/api/plan/clear/:userId', (req, res) => {
    db.query('DELETE FROM user_plans WHERE user_id = ?', [req.params.userId], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Database error' });
        res.json({ success: true, message: 'Plan cleared' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`\n📡 Available Endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/api/test`);
    console.log(`   GET    http://localhost:${PORT}/api/places`);
    console.log(`   POST   http://localhost:${PORT}/api/register`);
    console.log(`   POST   http://localhost:${PORT}/api/login`);
    console.log(`   GET    http://localhost:${PORT}/api/plan/:userId`);
    console.log(`\n✨ Ready to accept requests!\n`);
});
