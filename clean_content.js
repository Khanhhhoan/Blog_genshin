const fs = require('fs');
const path = require('path');

function cleanText(text, isDetail = false) {
    if (!text) return text;
    let res = text;

    // 1. First replace all image URLs with local image paths
    const imgPrefix = isDetail ? '../images/' : 'images/';
    res = res.replace(/https?:\/\/[^\/]*ronshop[^\/]*\/Content\/images\/blogs\//gi, imgPrefix);
    res = res.replace(/https?:\/\/shopimages\//gi, imgPrefix);
    res = res.replace(/\/Content\/images\/blogs\//gi, imgPrefix);

    // 2. Specific brand context replacements
    res = res.replace(/Ronshop247\s+có\s+uy\s+tín\s+không/gi, 'Shop có uy tín không');
    res = res.replace(/CHÍNH\s+SÁCH\s+TRẢ\s+GÓP\s+RONSHOP247/gi, 'CHÍNH SÁCH TRẢ GÓP');
    res = res.replace(/CAM\s+KẾT\s+TỪ\s+RONSHOP247/gi, 'CAM KẾT TỪ SHOP');
    res = res.replace(/CSKH\s+Ronshop247/gi, 'CSKH');
    
    // Checklegit history context
    res = res.replace(/Ronshop247\s+tên\s+trước\s+của\s+shop\s+là\s+Mihoyoshop\s+là\s+shop\s+hoyoverse\s+lớn\s+nhất\s+5\s+năm/gi, 
                      'Shop là shop Hoyoverse lớn nhất với 5 năm');
    res = res.replace(/shop\s+tên\s+trước\s+của\s+shop\s+là\s+Mihoyoshop\s+là\s+shop\s+hoyoverse\s+lớn\s+nhất\s+5\s+năm/gi, 
                      'Shop là shop Hoyoverse lớn nhất với 5 năm');
    res = res.replace(/Ronshop247\s+cung\s+cấp/gi, 'Shop cung cấp');
    res = res.replace(/Ronshop247\s+luôn\s+ưu\s+tiên/gi, 'Shop luôn ưu tiên');
    res = res.replace(/mua\s+acc\s+ở\s+Ronshop247(\.net)?/gi, 'mua acc ở Shop');
    res = res.replace(/mua\s+acc\s+ở\s+shop/gi, 'mua acc ở Shop');

    // 3. Remove source / URL lines
    res = res.replace(/>\s*\*\*Nguồn\*\*:\s*\[[^\]]+\]\([^\)]+\)\s*\n/gi, '');
    res = res.replace(/-\s*\*\*URL\s*(gốc)?\*\*:\s*\[[^\]]+\]\([^\)]+\)\s*\n/gi, '');

    // 4. Clean any remaining ronshop / ron shop occurrences
    res = res.replace(/ronshop247\.net/gi, 'shop');
    res = res.replace(/ronshop247/gi, 'shop');
    res = res.replace(/Ronshop247/g, 'Shop');
    res = res.replace(/RONSHOP247/g, 'SHOP');
    res = res.replace(/ron\s+shop\s*247(\.net)?/gi, 'shop');
    res = res.replace(/ron\s+shop/gi, 'shop');
    res = res.replace(/Ron\s+shop/g, 'Shop');
    res = res.replace(/Ron\s+Shop/g, 'Shop');
    res = res.replace(/RON\s+SHOP/g, 'SHOP');
    res = res.replace(/Ronshop/g, 'Shop');
    res = res.replace(/ronshop/gi, 'shop');

    return res;
}

// 1. Process blogs/*.md
const blogsDir = path.join(__dirname, 'blogs');
const blogFiles = fs.readdirSync(blogsDir);
for (const file of blogFiles) {
    if (file.endsWith('.md')) {
        const filePath = path.join(blogsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const cleaned = cleanText(content, true);
        fs.writeFileSync(filePath, cleaned, 'utf8');
        console.log(`Cleaned: blogs/${file}`);
    }
}

// 2. Process blogs_summary.md
const summaryPath = path.join(__dirname, 'blogs_summary.md');
if (fs.existsSync(summaryPath)) {
    const content = fs.readFileSync(summaryPath, 'utf8');
    let cleaned = cleanText(content, false);
    cleaned = cleaned.replace(/# Dữ Liệu Toàn Bộ Bài Viết Blogs\s*-\s*[^\n]*/gi, '# Dữ Liệu Toàn Bộ Bài Viết Blogs');
    fs.writeFileSync(summaryPath, cleaned, 'utf8');
    console.log(`Cleaned: blogs_summary.md`);
}

// 3. Process blogs_data.json
const jsonPath = path.join(__dirname, 'blogs_data.json');
if (fs.existsSync(jsonPath)) {
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const blogs = JSON.parse(raw);
    for (const b of blogs) {
        b.title = cleanText(b.title, false);
        b.summary = cleanText(b.summary, false);
        b.contentMarkdown = cleanText(b.contentMarkdown, false);
        b.contentHtml = cleanText(b.contentHtml, false);
        b.url = `/blogs/${b.slug}`;
        if (b.thumbnail) {
            b.thumbnail = b.thumbnail.replace(/https?:\/\/[^\/]*ronshop[^\/]*\/Content\/images\/blogs\//gi, 'images/');
            b.thumbnail = b.thumbnail.replace(/https?:\/\/shopimages\//gi, 'images/');
        }
        if (b.detailImage) {
            b.detailImage = b.detailImage.replace(/https?:\/\/[^\/]*ronshop[^\/]*\/Content\/images\/blogs\//gi, 'images/');
            b.detailImage = b.detailImage.replace(/https?:\/\/shopimages\//gi, 'images/');
        }
        if (Array.isArray(b.images)) {
            for (const img of b.images) {
                delete img.remoteUrl;
            }
        }
    }
    fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');
    console.log(`Cleaned: blogs_data.json`);
}
