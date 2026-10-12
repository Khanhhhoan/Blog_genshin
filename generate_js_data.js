const fs = require('fs');
const path = require('path');

const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'blogs_data.json'), 'utf8'));

// Enhance data with categories & reading times
const categories = {
    'chinhsachbaohanh': 'Chính sách',
    'chinhsachtragop': 'Chính sách',
    'checklegit': 'Hỏi đáp & Uy tín',
    'cachlienkethoyoverse': 'Hướng dẫn Game',
    'golienketthu3': 'Hướng dẫn Game',
    'huongdansudungmailoutlook': 'Bảo mật Email'
};

const enhancedData = jsonData.map(b => {
    // Calculate reading time (~200 words per minute)
    const wordCount = (b.contentMarkdown || '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 180));

    return {
        ...b,
        category: categories[b.slug] || 'Tin tức',
        readingTime: `${readingTime} phút đọc`
    };
});

const jsContent = `// Dữ liệu bài viết Blog cá nhân
window.BLOGS_DATA = ${JSON.stringify(enhancedData, null, 2)};
`;

fs.writeFileSync(path.join(__dirname, 'blogs_data.js'), jsContent, 'utf8');
console.log('Successfully generated blogs_data.js');
