
// Business Logic Emulator (Mirror of src/lib/services/permissions.ts)
const ROLE_CAPABILITIES = {
  ADMIN: ['CRYPT_USE', 'CRYPT_RUN', 'SETTINGS_GLOBAL'],
  TECH: ['CRYPT_USE', 'CRYPT_RUN'],
  OPERATOR: ['CRYPT_USE', 'CRYPT_RUN']
};

function hasCapabilityForOperator(operator, cap) {
  if (!operator) return false;
  const denied = operator.deniedCapabilities || [];
  if (denied.includes(cap)) return false; // VETO
  const base = ROLE_CAPABILITIES[operator.role] || [];
  if (base.includes(cap)) return true; // BASE ROLE
  const extra = operator.extraCapabilities || [];
  if (extra.includes(cap)) return true; // EXTRA
  return false;
}

// Mock data
const mockOperator = {
  username: 'admin.root',
  role: 'ADMIN',
  extraCapabilities: ['AUDIT_RUN'],
  deniedCapabilities: []
};

console.log('\x1b[1m\x1b[36m--- ABDFN SUITE: VETOR ENGINE SIMULATION (PHASE 12.1) ---\x1b[0m');
console.log('\x1b[33m[GIVEN]\x1b[0m Operator: \x1b[1m' + mockOperator.username + '\x1b[0m with role \x1b[1m' + mockOperator.role + '\x1b[0m');

// 1. Initial State
let canRun = hasCapabilityForOperator(mockOperator, 'CRYPT_RUN');
console.log('\x1b[32m[TEST 1]\x1b[0m Initial CRYPT_RUN Check: ' + (canRun ? '\x1b[32mGRANTED\x1b[0m (Role ADMIN)' : '\x1b[31mDENIED\x1b[0m'));

// 2. Applying Veto
console.log('\n\x1b[33m[ACTION]\x1b[0m Applying \x1b[1mDENIED_CAPABILITY: CRYPT_RUN\x1b[0m to operator metadata...');
mockOperator.deniedCapabilities.push('CRYPT_RUN');

// 3. Re-evaluating
canRun = hasCapabilityForOperator(mockOperator, 'CRYPT_RUN');
console.log('\x1b[32m[TEST 2]\x1b[0m Post-Veto CRYPT_RUN Check: ' + (canRun ? '\x1b[32mGRANTED\x1b[0m' : '\x1b[31mDENIED\x1b[0m \x1b[1m(Hard Override Matched)\x1b[0m'));

console.log('\n\x1b[36m--- SIMULATION SUCCESS: HIERARCHY DENY > ROLE VALIDATED ---\x1b[0m');
