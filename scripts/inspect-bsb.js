const XLSX = require('xlsx');
const path = require('path');

const filePath = 'E:\\Bible stuff\\ISA820\\ISA820-main\\ISA_MASTER_VAULT\\01_Bible_Raw\\English_Versions\\Berean Bible.xlsx';
const wb = XLSX.readFile(filePath);

console.log('Sheets:', wb.SheetNames);

const ws = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

console.log('Total rows:', rows.length);
console.log('Headers:', rows[0]);
console.log('Row 1:', rows[1]);
console.log('Row 2:', rows[2]);
console.log('Row 3:', rows[3]);
