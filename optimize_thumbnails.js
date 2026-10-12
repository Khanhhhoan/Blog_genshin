const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const thumbs = [
    {
        full: 'thumb_cachlienkethoyoverse.jpg',
        card: 'thumb_card_cachlienkethoyoverse.jpg',
        slug: 'cachlienkethoyoverse'
    },
    {
        full: 'thumb_golienketthu3.jpg',
        card: 'thumb_card_golienketthu3.jpg',
        slug: 'golienketthu3'
    },
    {
        full: 'thumb_chinhsachtragop.jpg',
        card: 'thumb_card_chinhsachtragop.jpg',
        slug: 'chinhsachtragop'
    },
    {
        full: 'thumb_chinhsachbaohanh.jpg',
        card: 'thumb_card_chinhsachbaohanh.jpg',
        slug: 'chinhsachbaohanh'
    },
    {
        full: 'thumb_huongdansudungmailoutlook.jpg',
        card: 'thumb_card_huongdansudungmailoutlook.jpg',
        slug: 'huongdansudungmailoutlook'
    }
];

async function generateCardThumbnails() {
    for (const t of thumbs) {
        const input = path.join(__dirname, 'images', t.full);
        const output = path.join(__dirname, 'images', t.card);

        // Resize to 768x432 (2x retina for 384px card) with Lanczos3 and unsharp mask
        await sharp(input)
            .resize(768, 432, {
                kernel: sharp.kernel.lanczos3,
                fit: 'cover'
            })
            .sharpen({
                sigma: 1.1,
                m1: 1.2,
                m2: 2.0
            })
            .jpeg({
                quality: 95,
                mozjpeg: true
            })
            .toFile(output);

        console.log(`Generated sharp card thumbnail: images/${t.card}`);
    }

    // Update blogs_data.json
    const jsonPath = path.join(__dirname, 'blogs_data.json');
    let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    for (const b of blogs) {
        const item = thumbs.find(t => t.slug === b.slug);
        if (item) {
            b.thumbnail = `images/${item.card}`;
            b.detailImage = `images/${item.full}`;
        }
    }
    fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');
    console.log('Updated blogs_data.json with separate card and detail thumbnails');

    // Regenerate blogs_data.js
    require('./generate_js_data.js');
}

generateCardThumbnails().catch(console.error);
