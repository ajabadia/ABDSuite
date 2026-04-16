import fs from 'fs';

const HEADER = "HEAD 2026-04-16 BATCH_STRESS_001\n";
const names = ["MARTINEZ GARCIA, JUAN", "PEREZ SOBRINO, MARIA", "RODRIGUEZ RUIZ, ALBERTO", "SANCHEZ SANCHEZ, ANA", "LOPEZ LOPEZ, PEDRO", "GARCIA GARCIA, LUISA", "HERNANDEZ CALVO, JULIA", "JIMENEZ RUIZ, CARLOS", "GOMEZ GOMEZ, BELEN", "DIAZ DIAZ, ROBERTO"];
const ibans = ["ES12345678901234567890", "ES98765432109876543210", "ES55555444443333322221", "ES11111222223333344444", "ES00000000000000000000"];

let dataLines = "";
let totalAmount = 0;

for (let i = 1; i <= 10000; i++) {
  const id = i.toString().padStart(6, '0');
  const name = names[i % names.length].padEnd(25, ' ');
  const iban = ibans[i % ibans.length].padEnd(22, ' ');
  const amount = Math.floor(Math.random() * 100000);
  totalAmount += amount;
  const amountStr = amount.toString().padStart(10, '0');
  
  dataLines += `DATA ${id} ${name} ${iban} ${amountStr}\n`;
}

const footer = `FOOT 010000 ${totalAmount.toString().padStart(12, '0')}\n`;

fs.writeFileSync('d:/desarrollos/ABDFNSuite/DOC/STRESS_TEST_10K.txt', HEADER + dataLines + footer);
console.log("Generado STRESS_TEST_10K.txt con 10,000 registros.");
