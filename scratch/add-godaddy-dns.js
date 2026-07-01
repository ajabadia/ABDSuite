const https = require('https');

const key = "gHzYf6rJTfkY_36nXjbyBATy38scBhEiC75";
const secret = "Pi9zfEVMjJZbH5bZnAku93";

const data = JSON.stringify([
  {
    "type": "CNAME",
    "name": "files",
    "data": "cname.vercel-dns.com.",
    "ttl": 3600
  }
]);

const options = {
  hostname: 'api.godaddy.com',
  port: 443,
  path: '/v1/domains/abdia.es/records',
  method: 'PATCH',
  headers: {
    'Authorization': `sso-key ${key}:${secret}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log("Sending CNAME update request to GoDaddy for files.abdia.es -> cname.vercel-dns.com.");

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  res.on('end', () => {
    console.log('Response:', responseData);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log('CNAME Record added successfully!');
    } else {
      console.log('Error adding CNAME Record.');
    }
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

req.write(data);
req.end();
