const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'test.html');

try {
  const htmlContent = fs.readFileSync(inputFile, 'utf8');
  
  // Tách các thẻ sản phẩm
  const chunks = htmlContent.split('shop-search-result-view__item');
  console.log('Total chunks found:', chunks.length - 1);
  
  // Thử parse 3 sản phẩm đầu tiên
  for (let i = 1; i <= Math.min(3, chunks.length - 1); i++) {
    const chunk = chunks[i];
    console.log(`\n--- Item #${i} ---`);
    
    // 1. Trích xuất Href
    const hrefMatch = chunk.match(/href="([^"]+)"/);
    const href = hrefMatch ? hrefMatch[1] : 'N/A';
    console.log('Href:', href);

    // 2. Trích xuất Tiêu đề
    const titleMatch = chunk.match(/line-clamp-2[^>]*>([\s\S]*?)<\/div>/);
    const title = titleMatch ? titleMatch[1].trim() : 'N/A';
    console.log('Title:', title);

    // 3. Trích xuất Giá
    const priceMatch = chunk.match(/text-base\/5 font-medium[^>]*>([^<]+)<\/span>/);
    const price = priceMatch ? priceMatch[1].trim() : 'N/A';
    console.log('Price String:', price);

    // 4. Trích xuất Image URL
    const imgMatch = chunk.match(/src="(https:\/\/down-vn\.img\.susercontent\.com\/file\/[^"]+)"/);
    const imgUrl = imgMatch ? imgMatch[1] : 'N/A';
    console.log('Image URL:', imgUrl);
  }
} catch (error) {
  console.error('Error:', error.message);
}
