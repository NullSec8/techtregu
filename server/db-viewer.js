const express = require('express');

function createDbViewer(dbPool) {
  const router = express.Router();

  // Dashboard - list all tables
  router.get('/', async (req, res) => {
    try {
      const [tables] = await dbPool.query('SHOW TABLES');
      const tableKey = Object.keys(tables[0])[0];
      const tableNames = tables.map(t => t[tableKey]);
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TechTregu DB Viewer</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          h1 { color: #333; }
          .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .table-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; margin: 20px 0; }
          .table-card { background: #007bff; color: white; padding: 15px; border-radius: 5px; text-decoration: none; display: block; transition: transform 0.2s; }
          .table-card:hover { transform: translateY(-2px); background: #0056b3; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #007bff; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .back-link { display: inline-block; margin: 20px 0; color: #007bff; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .query-form { margin: 20px 0; }
          textarea { width: 100%; height: 100px; font-family: monospace; }
          button { background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          button:hover { background: #218838; }
          .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 5px; margin: 10px 0; }
          .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🗄️ TechTregu Database Viewer</h1>
          <p>Database: <strong>techtregu</strong></p>
          
          <h2>Tables (${tableNames.length})</h2>
          <div class="table-list">
            ${tableNames.map(t => `<a href="/db-viewer/table/${t}" class="table-card">📋 ${t}</a>`).join('')}
          </div>

          <h2>Custom Query</h2>
          <form class="query-form" method="POST" action="/db-viewer/query">
            <textarea name="query" placeholder="SELECT * FROM users LIMIT 10"></textarea><br><br>
            <button type="submit">Execute Query</button>
          </form>
        </div>
      </body>
      </html>`;
      
      res.send(html);
    } catch (err) {
      res.send(`<h1>Error</h1><p>${err.message}</p>`);
    }
  });

  // View table contents
  router.get('/table/:name', async (req, res) => {
    const tableName = req.params.name;
    try {
      const [rows] = await dbPool.query(`SELECT * FROM \`${tableName}\` LIMIT 100`);
      const [columns] = await dbPool.query(`DESCRIBE \`${tableName}\``);
      
      const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Table: ${tableName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 14px; }
          th { background: #007bff; color: white; position: sticky; top: 0; }
          tr:nth-child(even) { background: #f9f9f9; }
          .back-link { display: inline-block; margin: 20px 0; color: #007bff; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .info { background: #d1ecf1; color: #0c5460; padding: 10px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="/db-viewer/" class="back-link">← Back to Dashboard</a>
          <h1>📋 Table: ${tableName}</h1>
          <div class="info">
            <strong>Columns (${columns.length}):</strong> ${columns.map(c => c.Field).join(', ')}<br>
            <strong>Rows shown:</strong> ${rows.length} (limited to 100)
          </div>
          
          <table>
            <thead><tr>${columns.map(c => `<th>${c.Field}<br><small>${c.Type}</small></th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${columns.map(c => `<td>${row[c.Field] !== null ? String(row[c.Field]).substring(0, 100) : '<em>null</em>'}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>`;
      
      res.send(html);
    } catch (err) {
      res.send(`<h1>Error</h1><p>${err.message}</p><a href="/db-viewer/">Back</a>`);
    }
  });

  // Execute custom query
  router.post('/query', express.urlencoded({ extended: true }), async (req, res) => {
    const query = req.body.query;
    try {
      const [rows] = await dbPool.query(query);
      
      let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Query Result</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
          .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow-x: auto; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #28a745; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .back-link { display: inline-block; margin: 20px 0; color: #007bff; text-decoration: none; }
          .back-link:hover { text-decoration: underline; }
          .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; }
          pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <div class="container">
          <a href="/db-viewer/" class="back-link">← Back to Dashboard</a>
          <h1>✅ Query Result</h1>
          <div class="success">Query executed successfully</div>
          <pre>${query}</pre>`;
      
      if (Array.isArray(rows) && rows.length > 0) {
        const columns = Object.keys(rows[0]);
        html += `
          <table>
            <thead><tr>${columns.map(c => `<th>${c}</th>`).join('')}</tr></thead>
            <tbody>
              ${rows.map(row => `<tr>${columns.map(c => `<td>${row[c] !== null ? String(row[c]).substring(0, 200) : '<em>null</em>'}</td>`).join('')}</tr>`).join('')}
            </tbody>
          </table>`;
      } else if (Array.isArray(rows)) {
        html += `<p>No rows returned</p>`;
      } else {
        html += `<p>Query executed. Affected rows: ${rows.affectedRows || 0}</p>`;
      }
      
      html += `</div></body></html>`;
      res.send(html);
    } catch (err) {
      res.send(`<h1>Error</h1><p>${err.message}</p><a href="/db-viewer/">Back</a>`);
    }
  });

  return router;
}

module.exports = { createDbViewer };
