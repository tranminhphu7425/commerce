import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORE_PATH = path.join(__dirname, '../data/store.json');
const IMAGE_DIR = path.join(__dirname, '../public/images/products');

// Tạo thư mục nếu chưa có
if (!fs.existsSync(IMAGE_DIR)) {
  fs.mkdirSync(IMAGE_DIR, { recursive: true });
}

const downloadImage = (url, dest) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });
      } else {
        reject(new Error(`Failed to download: ${res.statusCode}`));
      }
    }).on('error', (err) => {
      reject(err);
    });
  });
};

async function run() {
  console.log('🚀 Bắt đầu tải ảnh từ Shopee...');
  
  const data = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  let count = 0;

  for (const product of data.products) {
    if (product.featuredImage && product.featuredImage.url.startsWith('https://')) {
      const ext = '.webp'; // Mặc định Shopee dùng webp hoặc có thể lấy từ URL nếu cần
      const fileName = `${product.handle}${ext}`;
      const dest = path.join(IMAGE_DIR, fileName);

      try {
        await downloadImage(product.featuredImage.url, dest);
        console.log(`✅ Đã tải: ${fileName}`);
        
        // Cập nhật đường dẫn trong JSON
        const localPath = `/images/products/${fileName}`;
        product.featuredImage.url = localPath;
        if (product.images && product.images.length > 0) {
          product.images.forEach(img => {
            if (img.url.startsWith('https://')) {
              img.url = localPath;
            }
          });
        }
        count++;
      } catch (error) {
        console.error(`❌ Lỗi khi tải ${product.handle}:`, error.message);
      }
    }
  }

  // Lưu lại tệp JSON đã cập nhật
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n🎉 Hoàn tất! Đã tải thành công ${count} ảnh và cập nhật store.json.`);
}

run();
