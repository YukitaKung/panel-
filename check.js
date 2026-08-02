const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./dev.db');
db.all('SELECT id, name, port FROM Application', (err, rows) => {
  console.log(JSON.stringify(rows, null, 2));
});
