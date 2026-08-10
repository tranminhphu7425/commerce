const fs = require('fs');
const path = require('path');

const imgUrl = 'https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcoekjvph74sa8';
const dest = path.join(__dirname, '..', 'public', 'images', 'products', 'test-download.jpg');

fs.mkdirSync(path.dirname(dest), { recursive: true });

console.log('Downloading image from:', imgUrl);

fetch(imgUrl)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.arrayBuffer();
  })
  .then(arrayBuffer => {
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(dest, buffer);
    console.log('Success! Saved to:', dest);
    console.log('File size:', fs.statSync(dest).size, 'bytes');
  })
  .catch(err => {
    console.error('Error downloading:', err);
  });
