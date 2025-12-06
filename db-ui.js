/**
 * Database Web UI - Access MySQL Database via Web Browser
 * 
 * Start this server with: node db-ui.js
 * Access at: http://localhost:8080
 * 
 * Allows you to:
 * - View all tables in snooker_db
 * - Query any table and see results
 * - Insert/Update/Delete data (optional)
 */

const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const PORT = 8080;

// MySQL Connection Pool
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'snooker_db',
    connectionLimit: 10,
    waitForConnections: true,
    queueLimit: 0
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// HTML Template - Main Page
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snooker DB Manager</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #667eea;
        }
        
        .table-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .table-btn {
            padding: 15px;
            background: #f8f9fa;
            border: 2px solid #667eea;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
            text-align: center;
            text-decoration: none;
            color: #667eea;
            font-weight: bold;
            display: block;
        }
        
        .table-btn:hover {
            background: #667eea;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .query-form {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
        }
        
        select, input, textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-family: monospace;
            font-size: 0.95em;
        }
        
        textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            font-size: 1em;
            transition: all 0.3s;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .results {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            overflow-x: auto;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 12px;
            text-align: left;
            font-weight: bold;
        }
        
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:hover {
            background: #f0f0f0;
        }
        
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #f5c6cb;
        }
        
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #c3e6cb;
        }
        
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            border: 1px solid #bee5eb;
        }
        
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            border-top: 1px solid #ddd;
        }
        
        .back-btn {
            display: inline-block;
            background: #6c757d;
            padding: 10px 20px;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .back-btn:hover {
            background: #5a6268;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎱 Snooker Database Manager</h1>
            <p>Web-based MySQL Database Viewer & Query Tool</p>
        </div>
        
        <div class="content">
            {CONTENT}
        </div>
        
        <div class="footer">
            <p>Snooker DB Manager | MySQL Database Viewer | Access at: http://localhost:8080</p>
        </div>
    </div>
</body>
</html>
`;

// Route: Home - Show all tables
app.get('/', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        // Get all tables
        const [tables] = await connection.query(
            "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'snooker_db' ORDER BY TABLE_NAME"
        );
        
        let tableList = '<div class="section"><h2>📊 Available Tables</h2><div class="table-list">';
        tables.forEach(table => {
            tableList += `<a href="/table/${table.TABLE_NAME}" class="table-btn">${table.TABLE_NAME}</a>`;
        });
        tableList += '</div></div>';
        
        // Get database stats
        const [stats] = await connection.query(
            "SELECT TABLE_NAME, TABLE_ROWS FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'snooker_db'"
        );
        
        let statsHtml = '<div class="section"><h2>📈 Database Statistics</h2>';
        statsHtml += '<table><tr><th>Table Name</th><th>Row Count</th></tr>';
        let totalRows = 0;
        stats.forEach(stat => {
            statsHtml += `<tr><td>${stat.TABLE_NAME}</td><td>${stat.TABLE_ROWS}</td></tr>`;
            totalRows += stat.TABLE_ROWS;
        });
        statsHtml += `<tr><td><strong>TOTAL</strong></td><td><strong>${totalRows}</strong></td></tr></table></div>`;
        
        connection.release();
        
        const content = tableList + statsHtml + `
            <div class="section">
                <h2>🔍 Custom Query</h2>
                <form method="POST" action="/query" class="query-form">
                    <div class="form-group">
                        <label>Enter SQL Query:</label>
                        <textarea name="query" placeholder="SELECT * FROM masterstudio LIMIT 10" required></textarea>
                    </div>
                    <button type="submit">Execute Query</button>
                </form>
            </div>
        `;
        
        res.send(htmlTemplate.replace('{CONTENT}', content));
    } catch (error) {
        res.send(htmlTemplate.replace('{CONTENT}', `<div class="error">Error: ${error.message}</div>`));
    }
});

// Route: View specific table
app.get('/table/:tableName', async (req, res) => {
    const tableName = req.params.tableName;
    
    try {
        const connection = await pool.getConnection();
        
        // Get table data
        const [rows] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 100`);
        
        let content = `<a href="/" class="back-btn">← Back to Home</a>`;
        content += `<h2>📋 Table: ${tableName}</h2>`;
        content += `<div class="info">${rows.length} rows displayed (limit: 100)</div>`;
        
        if (rows.length === 0) {
            content += '<div class="info">No data found in this table.</div>';
        } else {
            content += '<div class="results"><table><tr>';
            
            // Get column names
            Object.keys(rows[0]).forEach(col => {
                content += `<th>${col}</th>`;
            });
            content += '</tr>';
            
            // Add rows
            rows.forEach(row => {
                content += '<tr>';
                Object.values(row).forEach(val => {
                    const displayVal = val === null ? '<em>NULL</em>' : String(val).substring(0, 100);
                    content += `<td>${displayVal}</td>`;
                });
                content += '</tr>';
            });
            
            content += '</table></div>';
        }
        
        connection.release();
        
        res.send(htmlTemplate.replace('{CONTENT}', content));
    } catch (error) {
        const content = `
            <a href="/" class="back-btn">← Back to Home</a>
            <div class="error">Error: ${error.message}</div>
        `;
        res.send(htmlTemplate.replace('{CONTENT}', content));
    }
});

// Route: Execute custom query
app.post('/query', async (req, res) => {
    const query = req.body.query;
    
    if (!query || query.trim().length === 0) {
        res.redirect('/');
        return;
    }
    
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query(query);
        
        let content = '<a href="/" class="back-btn">← Back to Home</a>';
        content += '<h2>🔍 Query Results</h2>';
        content += `<div class="success">Query executed successfully!</div>`;
        content += `<div class="info"><strong>Query:</strong> <code>${query}</code></div>`;
        
        if (Array.isArray(rows) && rows.length > 0) {
            content += `<div class="info">${rows.length} rows returned</div>`;
            content += '<div class="results"><table><tr>';
            
            Object.keys(rows[0]).forEach(col => {
                content += `<th>${col}</th>`;
            });
            content += '</tr>';
            
            rows.forEach(row => {
                content += '<tr>';
                Object.values(row).forEach(val => {
                    const displayVal = val === null ? '<em>NULL</em>' : String(val).substring(0, 100);
                    content += `<td>${displayVal}</td>`;
                });
                content += '</tr>';
            });
            
            content += '</table></div>';
        } else {
            content += '<div class="info">Query executed but returned no rows.</div>';
        }
        
        connection.release();
        
        res.send(htmlTemplate.replace('{CONTENT}', content));
    } catch (error) {
        const content = `
            <a href="/" class="back-btn">← Back to Home</a>
            <div class="error"><strong>Query Error:</strong> ${error.message}</div>
        `;
        res.send(htmlTemplate.replace('{CONTENT}', content));
    }
});

// Start server
app.listen(PORT, () => {
    console.log('\n========================================');
    console.log('✓ Database Web UI is running!');
    console.log('========================================');
    console.log(`Access it at: http://localhost:${PORT}`);
    console.log(`MySQL Database: snooker_db`);
    console.log(`MySQL Host: localhost:3306`);
    console.log('========================================\n');
});

module.exports = app;
