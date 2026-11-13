const fs = require('fs');
const vm = require('vm');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'server.js'), 'utf8');
const patient = [
  { id: 'P1', name: 'Ravi', nurse: 'Nurse Anjali', doctor: 'Dr Sharma' },
  { id: 'P2', name: 'Imran', nurse: 'Nurse Priya', doctor: 'Dr Verma' }
];
const helperStart = source.indexOf('function norm(value)');
const helperEnd = source.indexOf('\nfunction recordDetection', helperStart);
if (helperStart < 0 || helperEnd < 0) throw new Error('Authorization helpers not found');
const roleStart = source.indexOf('function careRoleWrite(key, role)');
const roleEnd = source.indexOf('\nfunction careId', roleStart);
const context = { patientRecord: id => patient.find(p => p.id === String(id)) };
vm.createContext(context);
vm.runInContext(source.slice(helperStart, helperEnd) + '\n' + source.slice(roleStart, roleEnd), context);
const assert = (ok, msg) => { if (!ok) throw new Error(msg); console.log('✓ ' + msg); };
assert(context.canAccessPatient({role:'family',linkedPatientId:'P1'}, patient[0]), 'Family account can access linked patient');
assert(!context.canAccessPatient({role:'family',linkedPatientId:'P1'}, patient[1]), 'Family account cannot access another patient');
assert(context.canAccessPatient({role:'nurse',name:'Nurse Anjali',username:'anjali'}, patient[0]), 'Nurse can access assigned patient');
assert(!context.canAccessPatient({role:'nurse',name:'Nurse Anjali',username:'anjali'}, patient[1]), 'Nurse cannot access unassigned patient');
assert(context.canAccessPatient({role:'doctor',name:'Dr Sharma',username:'drsharma'}, patient[0]), 'Doctor can access assigned patient');
assert(!context.canAccessPatient({role:'doctor',name:'Dr Sharma',username:'drsharma'}, patient[1]), 'Doctor cannot access unassigned patient');
assert(context.canAccessPatient({role:'billing'}, patient[0], 'billing'), 'Billing can access billing scope');
assert(!context.canAccessPatient({role:'billing'}, patient[0], 'clinical'), 'Billing cannot access clinical scope');
assert(context.canAccessPatient({role:'admin'}, patient[1]), 'Admin can access hospital records');
assert(context.careRoleWrite('messages','family'), 'Family can send a message');
assert(!context.careRoleWrite('bills','family'), 'Family cannot create or edit bills');
assert(context.careRoleWrite('bills','billing'), 'Billing staff can manage bills');
assert(context.careRoleWrite('prescriptions','doctor'), 'Doctor can manage prescriptions');
assert(!context.careRoleWrite('prescriptions','nurse'), 'Nurse cannot create prescriptions');
assert(context.careRoleWrite('administrations','nurse'), 'Nurse can record medicine administration');
assert(!context.careRoleWrite('administrations','doctor'), 'Doctor cannot mark nurse administration');
// Static route-level checks: all relevant patient-data reads must use the scoped filters.
assert(source.includes("rows=filterPatientRows(rows,req.user") && source.includes("a=filterPatientRows(a,req.user)"), 'Patient-specific collection filters are wired into API reads');
assert(source.includes("if(!canAccessPatientId(req.user,rows[i].patientId"), 'Care record updates verify patient assignment');
assert(source.includes("if(!canAccessPatientId(s,a[i].patientId)"), 'Alert updates verify patient assignment');
console.log('\nAccess-control tests passed. These test policy helpers and source wiring; live HTTP tests require npm dependencies.');
