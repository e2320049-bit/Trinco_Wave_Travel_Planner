const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('\n========================================');
console.log('🌊 Trinco Wave Travel Planner Backend');
console.log('========================================\n');

// MySQL Database Connection
const db = mysql.createConnection({
    host: 'localhost',      // Your MySQL host
    user: 'root',           // Your MySQL username
    password: '',           // Your MySQL password (empty for XAMPP)
    database: 'travel_planner',  // Your database name
    port: 3306              // MySQL default port
});

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('❌ DATABASE CONNECTION FAILED!');
        console.error('Error:', err.message);
        console.log('\n🔧 FIX THESE ISSUES:');
        console.log('1. Open XAMPP Control Panel');
        console.log('2. Click "Start" button next to MySQL');
        console.log('3. Wait for green "Running" status');
        console.log('4. Open http://localhost/phpmyadmin');
        console.log('5. Verify database "travel_planner" exists\n');
        process.exit(1);
    }
    console.log('✅ Connected to MySQL Database!');
    console.log('📊 Database: travel_planner');
    console.log('🔗 phpMyAdmin: http://localhost/phpmyadmin');
    console.log('💾 Data will be stored in your database\n');
});

// ============ API ENDPOINTS ============

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Backend is running!',
        database: 'Connected to travel_planner',
        phpMyAdmin: 'http://localhost/phpmyadmin'
    });
});

// Get all places from database
app.get('/api/places', (req, res) => {
    const query = 'SELECT * FROM places ORDER BY distance';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        console.log(`📦 Sent ${results.length} places to frontend`);
        res.json(results);
    });
});

// Register new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    
    console.log(`📝 Registration attempt: ${username}`);
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    if (username.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    if (password.length < 4) {
        return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.query(
            'INSERT INTO users (username, password, is_admin) VALUES (?, ?, 0)',
            [username, hashedPassword],
            (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'Username already exists' });
                    }
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Database error' });
                }
                
                console.log(`✅ User registered: ${username} (ID: ${result.insertId})`);
                console.log(`📊 Check in phpMyAdmin: http://localhost/phpmyadmin?db=travel_planner&table=users`);
                
                res.json({ 
                    success: true, 
                    message: 'Registration successful! Please login.',
                    userId: result.insertId
                });
            }
        );
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Login user
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log(`🔐 Login attempt: ${username}`);
    
    db.query(
        'SELECT * FROM users WHERE username = ?',
        [username],
        async (err, results) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (results.length === 0) {
                console.log(`❌ Login failed: ${username} - User not found`);
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            
            const user = results[0];
            const match = await bcrypt.compare(password, user.password);
            
            if (!match) {
                console.log(`❌ Login failed: ${username} - Wrong password`);
                return res.status(401).json({ error: 'Invalid username or password' });
            }
            
            console.log(`✅ User logged in: ${username} (Admin: ${user.is_admin === 1})`);
            
            res.json({ 
                success: true,
                message: 'Login successful',
                userId: user.id,
                username: user.username,
                isAdmin: user.is_admin === 1
            });
        }
    );
});

// Add place to user's plan
app.post('/api/plan/add', (req, res) => {
    const { userId, placeId } = req.body;
    
    console.log(`📝 Adding place ${placeId} to user ${userId}'s plan`);
    
    db.query(
        'INSERT INTO user_plans (user_id, place_id) VALUES (?, ?)',
        [userId, placeId],
        (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Place already in your plan' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            
            console.log(`✅ Added to plan`);
            res.json({ success: true, message: 'Added to your plan' });
        }
    );
});

// Get user's plan
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
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Remove from plan
app.delete('/api/plan/remove', (req, res) => {
    const { userId, placeId } = req.body;
    
    db.query(
        'DELETE FROM user_plans WHERE user_id = ? AND place_id = ?',
        [userId, placeId],
        (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ success: true, message: 'Removed from plan' });
        }
    );
});

// Clear plan
app.delete('/api/plan/clear/:userId', (req, res) => {
    db.query('DELETE FROM user_plans WHERE user_id = ?', [req.params.userId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, message: 'Plan cleared' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`\n📡 API Endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/api/test`);
    console.log(`   GET    http://localhost:${PORT}/api/places`);
    console.log(`   POST   http://localhost:${PORT}/api/register`);
    console.log(`   POST   http://localhost:${PORT}/api/login`);
    console.log(`\n💡 Frontend should connect to: http://localhost:${PORT}/api`);
    console.log(`📊 View database at: http://localhost/phpmyadmin\n`);
});
