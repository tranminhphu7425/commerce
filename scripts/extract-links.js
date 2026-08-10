const fs = require('fs');
const path = require('path');

// Đường dẫn file test.html và file đầu ra
const inputFile = path.join(__dirname, '..', 'test.html');
const outputFile = path.join(__dirname, '..', 'extracted_links.txt');

try {
  console.log('Đang đọc file test.html...');
  const htmlContent = fs.readFileSync(inputFile, 'utf8');

  // Regex nhận diện cấu trúc link chi tiết sản phẩm Shopee:
  // Bắt đầu bằng / và chứa đuôi định danh -i.{shop_id}.{product_id}
  const regex = /href="(\/[^"]+-i\.\d+\.\d+[^"]*)"/g;
  
  const uniqueLinks = new Set();
  let match;
  
  while ((match = regex.exec(htmlContent)) !== null) {
    uniqueLinks.add(match[1]);
  }

  const linksArray = Array.from(uniqueLinks);
  
  // Ghi danh sách link ra file
  fs.writeFileSync(outputFile, linksArray.join('\n'), 'utf8');

  console.log(`\n🎉 Thành công!`);
  console.log(`- Tìm thấy tổng số: ${linksArray.length} đường dẫn sản phẩm duy nhất.`);
  console.log(`- Đã ghi danh sách vào file: ${outputFile}`);
  console.log(`\nXem trước 10 đường dẫn đầu tiên:`);
  linksArray.slice(0, 10).forEach((link, i) => {
    console.log(`${i + 1}. ${link}`);
  });

} catch (error) {
  console.error('Đã xảy ra lỗi khi xử lý file:', error.message);
}
