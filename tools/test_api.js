fetch('http://localhost:3000/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: "default_client", clientId: "default_client" })
}).then(r => r.json()).then(console.log).catch(console.error);
