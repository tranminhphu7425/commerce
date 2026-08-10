const fs = require('fs');
const path = require('path');

// Cấu hình các đường dẫn lưu file
const htmlPath = path.join(__dirname, '..', 'test.html');
const imgDestDir = path.join(__dirname, '..', 'public', 'images', 'products');

// 3 tệp store.json cần được cập nhật đồng bộ để tránh lỗi Hydration
const storePaths = [
  path.join(__dirname, '..', 'data', 'store.json'),
  path.join(__dirname, '..', 'public', 'data', 'store.json'),
  path.join(__dirname, '..', 'docs', 'data', 'store.json')
];

// Hàm chuyển tiêu đề tiếng Việt thành Handle slug không dấu
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Phân tích tiêu đề để tự nhận diện options và values phù hợp
function parseOptionsFromTitle(title) {
  const lowercaseTitle = title.toLowerCase();
  
  // 1. Nhận diện dạng số (ví dụ: số 4,6,8)
  const soMatch = title.match(/số\s+([\d,]+)/i);
  if (soMatch) {
    const values = soMatch[1].split(',').map(v => `Số ${v.trim()}`);
    return { name: 'Kích Cỡ', values };
  }
  
  // 2. Nhận diện kích thước CM (ví dụ: 7CM 9CM 11CM)
  const cmMatches = title.match(/(\d+(?:\.\d+)?)\s*cm/gi);
  if (cmMatches && cmMatches.length > 1) {
    const values = cmMatches.map(m => m.trim().toUpperCase());
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length > 1) {
      return { name: 'Kích Thước', values: uniqueValues };
    }
  }
  
  // 3. Nhận diện trọng lượng GAM (ví dụ: 6.5gam-9gam-13gam)
  const gamMatches = title.match(/(\d+(?:\.\d+)?)\s*gam/gi);
  if (gamMatches && gamMatches.length > 1) {
    const values = gamMatches.map(m => m.trim().toLowerCase().replace('gam', 'g'));
    const uniqueValues = Array.from(new Set(values));
    if (uniqueValues.length > 1) {
      return { name: 'Trọng Lượng', values: uniqueValues };
    }
  }

  // 4. Dạng kích thước đơn lẻ kèm cân nặng (ví dụ: 4.2cm 11gam)
  const singleCm = title.match(/(\d+(?:\.\d+)?)\s*cm/i);
  const singleGam = title.match(/(\d+(?:\.\d+)?)\s*gam/i);
  if (singleCm && singleGam) {
    return { name: 'Phân Loại', values: [`${singleCm[0]} - ${singleGam[0]}`] };
  }

  // Mặc định
  return { name: 'Phân Loại', values: ['Mặc định'] };
}

// Tải ảnh từ Shopee CDN lưu về thư mục dự án
async function downloadImage(url, filename) {
  const destPath = path.join(imgDestDir, filename);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.error(`❌ Lỗi khi tải ảnh ${url}:`, err.message);
    return false;
  }
}

async function run() {
  try {
    // Đảm bảo thư mục lưu ảnh tồn tại
    fs.mkdirSync(imgDestDir, { recursive: true });

    console.log('📖 Đang đọc file test.html...');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // Tách các khối HTML sản phẩm
    const chunks = htmlContent.split('shop-search-result-view__item');
    console.log(`Tìm thấy ${chunks.length - 1} khối HTML tiềm năng.`);

    const scrapedProducts = [];
    let count = 0;

    for (let i = 1; i < chunks.length; i++) {
      const chunk = chunks[i];

      // Lọc link chi tiết có đuôi shop_id.product_id
      const hrefMatch = chunk.match(/href="([^"]+)"/);
      if (!hrefMatch) continue;
      const href = hrefMatch[1];
      
      // Chỉ lấy các sản phẩm của shop (ID: 1535099531)
      if (!href.includes('-i.1535099531.')) continue;

      // Lấy ID sản phẩm từ URL
      const idMatch = href.match(/-i\.1535099531\.(\d+)/);
      const itemId = idMatch ? idMatch[1] : `scraped-${Date.now()}-${i}`;

      // Trích xuất tiêu đề
      const titleMatch = chunk.match(/line-clamp-2[^>]*>([\s\S]*?)<\/div>/);
      if (!titleMatch) continue;
      const title = titleMatch[1].trim();

      // Trích xuất giá (dạng chuỗi 100.000)
      const priceMatch = chunk.match(/text-base\/5 font-medium[^>]*>([^<]+)<\/span>/);
      const priceStr = priceMatch ? priceMatch[1].trim() : '0';
      const basePrice = parseInt(priceStr.replace(/\./g, ''), 10) || 0;

      // Trích xuất ảnh chính
      const imgMatch = chunk.match(/src="(https:\/\/down-vn\.img\.susercontent\.com\/file\/[^"]+)"/);
      const cdnImgUrl = imgMatch ? imgMatch[1] : null;

      count++;
      console.log(`\n📦 [${count}] Đang xử lý: ${title}`);
      console.log(`   - ID: ${itemId} | Giá gốc: ${basePrice.toLocaleString()} ₫`);

      // Tải và lưu ảnh sản phẩm
      const imageFilename = `${itemId}.jpg`;
      let localImgUrl = '/commerce/images/products/placeholder.jpg';
      if (cdnImgUrl) {
        console.log(`   - Đang tải ảnh về máy...`);
        const downloaded = await downloadImage(cdnImgUrl, imageFilename);
        if (downloaded) {
          localImgUrl = `/commerce/images/products/${imageFilename}`;
          console.log(`   - Đã tải ảnh thành công!`);
        }
      }

      const handle = slugify(title);
      const optionsInfo = parseOptionsFromTitle(title);

      // Tạo các variants và tính giá lệch nhẹ tượng trưng nếu có nhiều hơn 1 variant
      const variants = optionsInfo.values.map((val, idx) => {
        // Tăng giá nhẹ theo từng phân loại (10k mỗi bước) để tạo độ sống động cho trang
        const variantPrice = basePrice + (idx * 10000);
        return {
          id: `var-${itemId}-${idx}`,
          title: val,
          availableForSale: true,
          selectedOptions: [
            {
              name: optionsInfo.name,
              value: val
            }
          ],
          price: {
            amount: variantPrice.toString(),
            currencyCode: 'VND'
          },
          compareAtPrice: {
            amount: Math.round(variantPrice * 1.3).toString(),
            currencyCode: 'VND'
          },
          importPrice: {
            amount: Math.round(variantPrice * 0.6).toString(),
            currencyCode: 'VND'
          },
          image: {
            url: localImgUrl,
            altText: val,
            width: 800,
            height: 800
          },
          images: [
            {
              url: localImgUrl,
              altText: val,
              width: 800,
              height: 800
            }
          ]
        };
      });

      // Lấy khoảng giá min/max của variants
      const variantPrices = variants.map(v => parseInt(v.price.amount, 10));
      const minPrice = Math.min(...variantPrices);
      const maxPrice = Math.max(...variantPrices);

      // Nhãn danh mục sản phẩm (mặc định gắn moi-cau hoặc phu-kien tùy tên)
      const lowercaseTitle = title.toLowerCase();
      const isPhuKien = lowercaseTitle.includes('lưỡi') || lowercaseTitle.includes('day') || lowercaseTitle.includes('khoen') || lowercaseTitle.includes('cần') || lowercaseTitle.includes('hộp');
      const category = isPhuKien ? 'phu-kien' : 'moi-cau';

      // Xây dựng bản ghi sản phẩm
      const newProduct = {
        id: `prod-${itemId}`,
        handle: handle,
        availableForSale: true,
        title: title,
        description: `${title} cao cấp, chính hãng, giá tốt, giao hàng toàn quốc nhanh chóng.`,
        descriptionHtml: `<p>${title} cao cấp, chính hãng, giá tốt, giao hàng toàn quốc nhanh chóng.</p>`,
        options: [
          {
            id: `opt-${itemId}`,
            name: optionsInfo.name,
            values: optionsInfo.values
          }
        ],
        priceRange: {
          minVariantPrice: {
            amount: minPrice.toString(),
            currencyCode: 'VND'
          },
          maxVariantPrice: {
            amount: maxPrice.toString(),
            currencyCode: 'VND'
          }
        },
        variants: variants,
        featuredImage: {
          url: localImgUrl,
          altText: title,
          width: 800,
          height: 800
        },
        images: [
          {
            url: localImgUrl,
            altText: title,
            width: 800,
            height: 800
          }
        ],
        seo: {
          title: title,
          description: `${title} chất lượng cao, nhạy cá.`
        },
        tags: [category, 'shopee-import'],
        updatedAt: new Date().toISOString(),
        collections: [category]
      };

      scrapedProducts.push(newProduct);
    }

    console.log(`\n✅ Tổng số sản phẩm xử lý thành công: ${scrapedProducts.length}`);

    // Ghi vào store.json của dự án
    for (const storePath of storePaths) {
      if (fs.existsSync(storePath)) {
        try {
          const rawStore = fs.readFileSync(storePath, 'utf8');
          const storeJson = JSON.parse(rawStore);
          
          // Tránh ghi đè trùng lặp sản phẩm đã import
          const existingIds = new Set(storeJson.products.map(p => p.id));
          const toAdd = scrapedProducts.filter(p => !existingIds.has(p.id));

          if (toAdd.length > 0) {
            storeJson.products = [...storeJson.products, ...toAdd];
            fs.writeFileSync(storePath, JSON.stringify(storeJson, null, 2), 'utf8');
            console.log(`🎉 Đã đồng bộ thêm ${toAdd.length} sản phẩm mới vào: ${storePath}`);
          } else {
            console.log(`ℹ️ Không có sản phẩm mới nào cần thêm vào: ${storePath} (Tất cả đã tồn tại)`);
          }
        } catch (jsonErr) {
          console.error(`❌ Không thể cập nhật file ${storePath}:`, jsonErr.message);
        }
      } else {
        console.warn(`⚠️ File không tồn tại: ${storePath}`);
      }
    }

  } catch (error) {
    console.error('💥 Đã xảy ra lỗi nghiêm trọng:', error.message);
  }
}

run();
