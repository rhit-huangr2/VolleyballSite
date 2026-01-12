import http from 'http';

const TOTAL = 24;
const HOST = 'localhost';
const PORT = 3000;
const PATH = '/api/register';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function postRegistration(name, email) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name, email });
    const options = {
      hostname: HOST,
      port: PORT,
      path: PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch (e) { parsed = data; }
        resolve({ statusCode: res.statusCode, body: parsed });
      });
    });

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
}

(async () => {
  console.log(`Seeding ${TOTAL} registrations to http://${HOST}:${PORT}${PATH}`);

  for (let i = 1; i <= TOTAL; i++) {
    const name = `${i}`;
    const email = `${i}@gmail.com`;

    try {
      const res = await postRegistration(name, email);
      console.log(`#${i} ${name} <${email}> -> ${res.statusCode}`);
      if (res.body && typeof res.body === 'object') {
        if (res.body.message) console.log('  message:', res.body.message);
        if (Array.isArray(res.body.registered)) console.log('  registered:', res.body.registered.length);
        if (Array.isArray(res.body.waitlisted)) console.log('  waitlisted:', res.body.waitlisted.length);
        if (res.body.registered === undefined && res.body.waitlisted === undefined && res.body.others) {
          console.log('  others length:', res.body.others.length);
        }
      } else if (res.body) {
        console.log('  body:', String(res.body).slice(0, 200));
      }
    } catch (err) {
      console.error(`#${i} ${name} <${email}> -> ERROR`, err.message || err);
    }

    // Small delay to avoid flooding the server
    await sleep(1200);
  }

  console.log('Seeding complete.');
})();
