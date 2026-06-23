const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const output = fs.createWriteStream(path.join(__dirname, 'standalone_app.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log('Zip file created successfully: ' + archive.pointer() + ' total bytes');
  console.log('SILAKAN UPLOAD standalone_app.zip KE HOSTING ANDA');
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Masukkan file bawaan standalone kecuali server.js (kita akan patch) dan file-file binary yang tidak perlu di Linux
archive.directory('.next/standalone/', false, (file) => {
  if (file.name === 'server.js') {
    return false; // Skip the original server.js
  }
  // Kecualikan engine windows, tmp files, dan file cache untuk menghemat disk space hosting (disk quota exceeded)
  if (
    file.name.includes('.tmp') ||
    file.name.includes('windows.dll') ||
    file.name.includes('.exe') ||
    file.name.includes('schema-engine-windows') ||
    file.name.includes('query_engine-windows')
  ) {
    return false;
  }
  return file;
});

// Patch server.js agar kompatibel dengan cPanel/Passenger
const serverJsPath = path.join(__dirname, '.next/standalone/server.js');
let serverJsContent = fs.readFileSync(serverJsPath, 'utf8');

// Polyfill untuk Array.prototype.toSorted karena cPanel LiteSpeed menggunakan Node < 20 secara default
const polyfill = `
if (!Array.prototype.toSorted) {
  Array.prototype.toSorted = function(compareFn) {
    return this.slice().sort(compareFn);
  };
}
`;

serverJsContent = polyfill + serverJsContent;

// cPanel/Passenger sering mengirim PORT berupa string socket, parseInt akan merusak nilainya.
serverJsContent = serverJsContent.replace(
  'const currentPort = parseInt(process.env.PORT, 10) || 3000',
  'const currentPort = process.env.PORT || 3000'
);

// Mencegah error "fork: retry: Resource temporarily unavailable" di cPanel
// Next.js secara default menggunakan jumlah core dari server build (misal 21), yang memicu batas proses (NPROC) di shared hosting.
serverJsContent = serverJsContent.replace(/"cpus":\d+/, '"cpus":1');
serverJsContent = serverJsContent.replace(/"workerThreads":true/, '"workerThreads":false');

archive.append(serverJsContent, { name: 'server.js' });

// PENTING: Next.js standalone build di Windows tidak menyertakan Prisma Engine untuk Linux.
// Kita harus menambahkannya secara manual ke dalam zip agar Prisma bisa berjalan di cPanel.
const prismaClientDir = path.join(__dirname, 'node_modules', '.prisma', 'client');
if (fs.existsSync(prismaClientDir)) {
  fs.readdirSync(prismaClientDir).forEach(file => {
    if ((file.includes('query-engine-') || file.includes('libquery_engine') || file === 'schema.prisma') && !file.includes('.exe')) {
      console.log('Adding Prisma file:', file);
      archive.file(path.join(prismaClientDir, file), { name: `node_modules/.prisma/client/${file}` });
    }
  });
}


// PENTING: Masukkan folder static dan public agar website tidak blank/putih
archive.directory('.next/static/', '.next/static');
archive.directory('public/', 'public');

archive.finalize();
