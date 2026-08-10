const shopId = '1535099531';
const itemId = '42710507117';
const url = `https://shopee.vn/api/v4/item/get?itemid=${itemId}&shopid=${shopId}`;

console.log('Fetching:', url);

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://shopee.vn/',
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
})
.then(res => {
  console.log('Status:', res.status);
  return res.json();
})
.then(data => {
  console.log('Response Keys:', Object.keys(data));
  if (data.data) {
    console.log('Item Title:', data.data.name);
    console.log('Item Price:', data.data.price);
  } else {
    console.log('No data found, response:', JSON.stringify(data).slice(0, 500));
  }
})
.catch(err => {
  console.error('Error:', err);
});
