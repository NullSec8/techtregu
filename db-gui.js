#!/usr/bin/env node

/**
 * Standalone Database GUI for TechTregu
 * Run with: node db-gui.js
 * Access at: http://localhost:3000
 */

const express = require('express');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, 'server', '.env') });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Database configuration
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: process.env.MYSQL_PORT || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'techtregu',
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Dashboard - List all tables
app.get('/', async (req, res) => {
  try {
    const [tables] = await pool.query('SHOW TABLES');
    const tableKey = Object.keys(tables[0])[0];
    const tableNames = tables.map(t => t[tableKey]);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>TechTregu DB Viewer</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .content { padding: 30px; }
        .info-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .table-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-decoration: none; transition: transform 0.3s, box-shadow 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .table-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .table-card h3 { margin-bottom: 10px; font-size: 1.3em; }
        .table-card p { opacity: 0.9; font-size: 0.9em; }
        .query-section { background: #f5f5f5; padding: 20px; border-radius: 10px; margin-top: 30px; }
        .query-section h2 { margin-bottom: 15px; color: #333; }
        textarea { width: 100%; min-height: 100px; padding: 10px; border: 2px solid #ddd; border-radius: 5px; font-family: 'Courier New', monospace; font-size: 14px; }
        button { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 10px; transition: transform 0.2s; }
        button:hover { transform: scale(1.05); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗄️ TechTregu Database Viewer</h1>
          <p>Connected to: ${dbConfig.database} @ ${dbConfig.host}:${dbConfig.port}</p>
        </div>
        <div class="content">
          <div class="info-box">
            <strong>ℹ️ Info:</strong> Found ${tableNames.length} tables in the database
          </div>
          
          <h2>📋 Tables</h2>
          <div class="table-grid">
            ${tableNames.map(t => `
              <a href="/table/${t}" class="table-card">
                <h3>📋 ${t}</h3>
                <p>Click to view data</p>
              </a>
            `).join('')}
          </div>

          <div class="query-section">
            <h2>🔍 Custom Query</h2>
            <form method="POST" action="/query">
              <textarea name="query" placeholder="SELECT * FROM users LIMIT 10" required></textarea>
              <button type="submit">Execute Query</button>
            </form>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    
    res.send(html);
  } catch (err) {
    res.send(`<h1>Database Connection Error</h1><pre>${err.message}</pre>`);
  }
});

// View table contents
app.get('/table/:name', async (req, res) => {
  const tableName = req.params.name;
  try {
    const [rows] = await pool.query(`SELECT * FROM \`${tableName}\` LIMIT 100`);
    const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);
    
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Table: ${tableName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
        .header a { color: white; text-decoration: none; display: inline-block; margin-bottom: 10px; }
        .header h1 { margin: 10px 0; }
        .content { padding: 20px; overflow-x: auto; }
        .info { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px; text-align: left; position: sticky; top: 0; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
        .back-btn { display: inline-block; padding: 10px 20px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
        .back-btn:hover { background: #764ba2; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="/">← Back to Dashboard</a>
          <h1>📋 Table: ${tableName}</h1>
        </div>
        <div class="content">
          <div class="info">
            <strong>Columns:</strong> ${columns.map(c => c.Field).join(', ')}<br>
            <strong>Rows shown:</strong> ${rows.length} (limited to 100)
          </div>
          
          <table>
            <thead><tr>${columns.map(c => `<th>${c.Field}<br><small>${c.Type}</small></th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${columns.map(c => `<td title="${row[c.Field] !== null ? String(row[c.Field]) : 'NULL'}">${row[c.Field] !== null ? String(row[c.Field]).substring(0, 100) : '<em style="color:#999">NULL</em>'}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </body>
    </html>`;
    
    res.send(html);
  } catch (err) {
    res.send(`<h1>Error</h1><p>${err.message}</p><a href="/">Back</a>`);
  }
});

// Execute custom query
app.post('/query', async (req, res) => {
  const query = req.body.query;
  try {
    const [rows] = await pool.query(query);
    
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Query Result</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
        .header a { color: white; text-decoration: none; display: inline-block; margin-bottom: 10px; }
        .content { padding: 20px; overflow-x: auto; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #28a745; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="/">← Back to Dashboard</a>
          <h1>✅ Query Result</h1>
        </div>
        <div class="content">
          <div class="success">Query executed successfully</div>
          <pre>${query}</pre>`;
    
    if (Array.isArray(rows) && rows.length > 0) {
      const columns = Object.keys(rows[0]);
      html += `
          <table>
            <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${columns.map(c => `<td title="${row[c] !== null ? String(row[c]) : 'NULL'}">${row[c] !== null ? String(row[c]).substring(0, 200) : '<em style="color:#999">NULL</em>'}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>`;
    } else if (Array.isArray(rows)) {
      html += `<p>No rows returned</p>`;
    } else {
      html += `<p>Query executed. Affected rows: ${rows.affectedRows || 0}</p>`;
    }
    
    html += `</div></div></body></html>`;
    res.send(html);
  } catch (err) {
    res.send(`<h1>Error</h1><p style="color:red">${err.message}</p><a href="/">Back</a>`);
  }
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎉 Database GUI is running!`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`📍 Network: http://${require('os').hostname()}.local:${PORT}`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
