const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '..', 'test.html');

try {
  const content = fs.readFileSync(inputFile, 'utf8');
  console.log('File size:', content.length, 'bytes');

  // Tìm các thẻ script
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;

  while ((match = scriptRegex.exec(content)) !== null) {
    scriptCount++;
    const scriptBody = match[1];
    const scriptTag = match[0];
    
    // In thông tin về script tag
    console.log(`\n--- Script #${scriptCount} ---`);
    console.log('Start tag:', scriptTag.slice(0, 100));
    console.log('Body length:', scriptBody.length);
    
    if (scriptBody.includes('__PRELOADED_STATE__') || scriptBody.includes('window.') || scriptBody.includes('{')) {
      console.log('Contains JS or JSON structure. First 300 chars:');
      console.log(scriptBody.trim().slice(0, 300));
    }
  }

} catch (error) {
  console.error('Error:', error.message);
}
