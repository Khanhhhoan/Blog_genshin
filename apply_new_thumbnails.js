const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\16e5f875-934c-4c8f-9a19-b235c131f854';
const destImagesDir = path.join(__dirname, 'images');

const imageMappings = [
    {
        slug: 'cachlienkethoyoverse',
        srcFile: 'thumb_lienket_hoyo_1791774679601.jpg',
        destName: 'thumb_cachlienkethoyoverse.jpg',
        oldImgName: 'blog_20260826004706374_83d885bf.png'
    },
    {
        slug: 'golienketthu3',
        srcFile: 'thumb_go_lienket_1791774701519.jpg',
        destName: 'thumb_golienketthu3.jpg',
        oldImgName: 'blog_20260826011852108_f1976847.png'
    },
    {
        slug: 'chinhsachtragop',
        srcFile: 'thumb_tra_gop_1791774719681.jpg',
        destName: 'thumb_chinhsachtragop.jpg',
        oldImgName: 'blog_20260825195724522_6feeeba3.png'
    },
    {
        slug: 'chinhsachbaohanh',
        srcFile: 'thumb_bao_hanh_1791774748334.jpg',
        destName: 'thumb_chinhsachbaohanh.jpg',
        oldImgName: 'blog_20260825160613640_da04de3a.png'
    },
    {
        slug: 'huongdansudungmailoutlook',
        srcFile: 'thumb_mail_outlook_1791774768181.jpg',
        destName: 'thumb_huongdansudungmailoutlook.jpg',
        oldImgName: 'blog_20260825200008520_35cfd303.png'
    }
];

// 1. Copy generated images to images/
for (const m of imageMappings) {
    const srcPath = path.join(brainDir, m.srcFile);
    const destPath = path.join(destImagesDir, m.destName);
    if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${m.srcFile} -> images/${m.destName}`);
    } else {
        console.error(`Source not found: ${srcPath}`);
    }
}

// 2. Update blogs_data.json
const jsonPath = path.join(__dirname, 'blogs_data.json');
let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

for (const b of blogs) {
    const map = imageMappings.find(m => m.slug === b.slug);
    if (map) {
        b.thumbnail = `images/${map.destName}`;
        b.detailImage = `images/${map.destName}`;
    }
}
fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');
console.log('Updated blogs_data.json with new thumbnails');

// 3. Regenerate blogs_data.js
require('./generate_js_data.js');

// 4. Update each markdown in blogs/
const blogsDir = path.join(__dirname, 'blogs');
for (const m of imageMappings) {
    const mdPath = path.join(blogsDir, `${m.slug}.md`);
    if (fs.existsSync(mdPath)) {
        let content = fs.readFileSync(mdPath, 'utf8');
        // Replace old cover image reference with new one
        content = content.replace(new RegExp(`\\.\\./images/${m.oldImgName}`, 'g'), `../images/${m.destName}`);
        content = content.replace(/!\[(.*?)\]\(\.\.\/images\/thumb_.*?\)/g, `![$1](../images/${m.destName})`);
        fs.writeFileSync(mdPath, content, 'utf8');
        console.log(`Updated cover image in blogs/${m.slug}.md`);
    }
}

// 5. Update blogs_summary.md
const summaryPath = path.join(__dirname, 'blogs_summary.md');
if (fs.existsSync(summaryPath)) {
    let summary = fs.readFileSync(summaryPath, 'utf8');
    for (const m of imageMappings) {
        summary = summary.replace(new RegExp(`images/${m.oldImgName}`, 'g'), `images/${m.destName}`);
    }
    fs.writeFileSync(summaryPath, summary, 'utf8');
    console.log('Updated blogs_summary.md');
}

// 6. Update favicon in index.html to use the new Zhongli banner
const indexPath = path.join(__dirname, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
indexHtml = indexHtml.replace(/href="images\/[^"]+"/i, 'href="images/thumb_cachlienkethoyoverse.jpg"');
fs.writeFileSync(indexPath, indexHtml, 'utf8');

console.log('All thumbnails updated successfully!');
