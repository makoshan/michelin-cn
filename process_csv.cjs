const fs = require('fs');

const csvContent = fs.readFileSync('/tmp/michelin_data.csv', 'utf-8');

// More robust CSV parsing that properly handles quoted newlines
function parseCSV(content) {
  const records = [];
  let currentFields = [];
  let currentField = '';
  let inQuotes = false;
  let isHeader = true;
  let headers = [];
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentFields.push(currentField);
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentFields.length > 0 || currentField) {
        currentFields.push(currentField);
        
        if (isHeader) {
          headers = currentFields.map(h => h.trim());
          isHeader = false;
        } else {
          if (currentFields.length >= headers.length) {
            const record = {};
            headers.forEach((h, idx) => {
              record[h] = currentFields[idx] || '';
            });
            records.push(record);
          }
        }
        
        currentFields = [];
        currentField = '';
      }
      // skip \r\n
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
    } else {
      currentField += char;
    }
  }
  
  // Handle last record if no trailing newline
  if (currentFields.length > 0 || currentField) {
    currentFields.push(currentField);
    if (!isHeader && currentFields.length >= headers.length) {
      const record = {};
      headers.forEach((h, idx) => {
        record[h] = currentFields[idx] || '';
      });
      records.push(record);
    }
  }
  
  return { headers, records };
}

const { headers, records } = parseCSV(csvContent);
console.log(`Headers: ${headers.join(', ')}`);
console.log(`Total records parsed: ${records.length}`);

// Filter China
const chinaKeywords = ['Chinese Mainland', 'Hong Kong SAR China', 'Macau', 'Taiwan'];
const chinaData = records.filter(r => {
  const loc = r.Location || '';
  return chinaKeywords.some(kw => loc.includes(kw));
});

console.log(`China records: ${chinaData.length}`);

// Transform
const cityMap = {
  'Beijing, Chinese Mainland': '北京', 'Shanghai, Chinese Mainland': '上海',
  'Guangzhou, Chinese Mainland': '广州', 'Chengdu, Chinese Mainland': '成都',
  'Hangzhou, Chinese Mainland': '杭州', 'Shenzhen, Chinese Mainland': '深圳',
  'Hong Kong, Hong Kong SAR China': '香港', 'Macau': '澳门',
  'Taipei, Taiwan': '台北', 'Taichung, Taiwan': '台中',
  'Tainan, Taiwan': '台南', 'Kaohsiung, Taiwan': '高雄',
  'New Taipei, Taiwan': '新北', 'Nanjing, Chinese Mainland': '南京',
  'Suzhou, Chinese Mainland': '苏州', 'Fuzhou, Chinese Mainland': '福州',
  'Xiamen, Chinese Mainland': '厦门', 'Wenzhou, Chinese Mainland': '温州',
  'Taizhou, Chinese Mainland': '台州', 'Yangzhou, Chinese Mainland': '扬州',
  'Changzhou, Chinese Mainland': '常州', 'Quanzhou, Chinese Mainland': '泉州',
  'Ningde, Chinese Mainland': '宁德', 'Hsinchu City, Taiwan': '新竹市',
  'Hsinchu County, Taiwan': '新竹县',
};
const awardMap = {'3 Stars': '3-star', '2 Stars': '2-star', '1 Star': '1-star', 'Bib Gourmand': 'bib-gourmand', 'Selected Restaurants': 'selected'};
const priceMap = {'$': 1, '$$': 2, '$$$': 3, '$$$$': 4};

const result = chinaData.map((row, i) => {
  const city = cityMap[row.Location] || (row.Location ? row.Location.split(',')[0] : '');
  const cuisine = row.Cuisine && row.Cuisine.includes(',') ? row.Cuisine.split(',')[0].trim() : (row.Cuisine || '');
  const desc = (row.Description || '').substring(0, 500);
  const price = row.Price || '';
  let priceVal = 2;
  const yenChar = '\u00a5';
  if (price.startsWith(yenChar)) {
    const count = price.split(yenChar).length - 1;
    priceVal = priceMap['$'.repeat(count)] || 2;
  } else {
    priceVal = priceMap[price] || 2;
  }
  
  return {
    id: i + 1,
    name: row.Name || '',
    nameEn: row.Name || '',
    city,
    address: row.Address || '',
    latitude: row.Latitude || '',
    longitude: row.Longitude || '',
    award: awardMap[row.Award] || 'selected',
    cuisine,
    priceRange: priceVal,
    phone: row.PhoneNumber || null,
    website: row.WebsiteUrl || null,
    description: desc || null,
  };
});

const outputPath = '/mnt/agents/output/app/public/restaurants.json';
fs.writeFileSync(outputPath, JSON.stringify(result, null, 0), 'utf-8');

console.log(`Saved ${result.length} records`);
console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);

const cityCounts = {};
result.forEach(r => { cityCounts[r.city] = (cityCounts[r.city] || 0) + 1; });
Object.entries(cityCounts).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
  console.log(`  ${k}: ${v}`);
});
