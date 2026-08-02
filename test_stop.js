const fetch = require('node-fetch');
fetch('http://localhost:3000/api/applications/6740608b-3a6e-47e5-9294-452ebf89c936', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'stop' })
}).then(r => r.json()).then(console.log).catch(console.error);
