const crypto = require('crypto');

const password = '11111111';
const salt = 'e51299d1c25fb14a005611ceb32b6b86';
const targetHash = '47923cf975ccf0e17652676c6ab6893a9d3304a8364fa0d4cd019a22cd426f7b5a2fba4b2de94046b15c3cc48338171bae689223e2185e5efbfd29459aeb403f';

const candidates = [
  // 1. Simple sha512 of password + salt
  () => crypto.createHash('sha512').update(password + salt).digest('hex'),
  // 2. Simple sha512 of salt + password
  () => crypto.createHash('sha512').update(salt + password).digest('hex'),
  // 3. HMAC-sha512 with salt as key
  () => crypto.createHmac('sha512', salt).update(password).digest('hex'),
  // 4. HMAC-sha512 with password as key
  () => crypto.createHmac('sha512', password).update(salt).digest('hex'),
  // 5. PBKDF2 candidates
  ...[10, 100, 1000, 10000, 20000, 100000].flatMap(iterations => [
    () => crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512').toString('hex'),
    () => crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), iterations, 64, 'sha512').toString('hex'),
  ])
];

for (let i = 0; i < candidates.length; i++) {
  try {
    const res = candidates[i]();
    if (res === targetHash) {
      console.log(`MATCH FOUND at index ${i}!`);
      console.log(candidates[i].toString());
      process.exit(0);
    }
  } catch (e) {
    // Ignore
  }
}

console.log('No match found.');
