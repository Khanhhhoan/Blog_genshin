const fs = require('fs');
const path = require('path');

// Fix in blogs/*.md -> change `https://shop../images/` to `../images/`
const blogsDir = path.join(__dirname, 'blogs');
for (const file of fs.readdirSync(blogsDir)) {
    if (file.endsWith('.md')) {
        const fp = path.join(blogsDir, file);
        let content = fs.readFileSync(fp, 'utf8');
        content = content.replace(/https:\/\/shop\.\.\/images\//g, '../images/');
        content = content.replace(/https:\/\/shopimages\//g, '../images/');
        fs.writeFileSync(fp, content, 'utf8');
    }
}

// Fix in blogs_summary.md -> change `https://shop../images/` or `https://shopimages/` to `images/`
const summaryPath = path.join(__dirname, 'blogs_summary.md');
if (fs.existsSync(summaryPath)) {
    let content = fs.readFileSync(summaryPath, 'utf8');
    content = content.replace(/https:\/\/shop\.\.\/images\//g, 'images/');
    content = content.replace(/https:\/\/shopimages\//g, 'images/');
    fs.writeFileSync(summaryPath, content, 'utf8');
}

// Fix in blogs_data.json
const jsonPath = path.join(__dirname, 'blogs_data.json');
if (fs.existsSync(jsonPath)) {
    let content = fs.readFileSync(jsonPath, 'utf8');
    content = content.replace(/https:\/\/shop\.\.\/images\//g, 'images/');
    content = content.replace(/https:\/\/shopimages\//g, 'images/');
    fs.writeFileSync(jsonPath, content, 'utf8');
}

console.log('Fixed all image paths successfully.');
