const fs = require('fs');
const path = require('path');

function decodeEntities(encodedString) {
    if (!encodedString) return '';
    const translate = {
        "nbsp": " ",
        "amp": "&",
        "quot": "\"",
        "lt": "<",
        "gt": ">"
    };
    return encodedString.replace(/&(nbsp|amp|quot|lt|gt|#(\d+)|#x([0-9a-fA-F]+));/g, function(match, entity, num, hex) {
        if (num) return String.fromCharCode(parseInt(num, 10));
        if (hex) return String.fromCharCode(parseInt(hex, 16));
        return translate[entity] || match;
    });
}

function htmlToMarkdown(html) {
    if (!html) return '';
    let text = html;
    
    // Headers
    text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
    text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
    text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
    text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');

    // Bold, italic
    text = text.replace(/<strong>([\s\S]*?)<\/strong>/gi, '**$1**');
    text = text.replace(/<b>([\s\S]*?)<\/b>/gi, '**$1**');
    text = text.replace(/<em>([\s\S]*?)<\/em>/gi, '*$1*');
    text = text.replace(/<i>([\s\S]*?)<\/i>/gi, '*$1*');

    // Links
    text = text.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

    // Images
    text = text.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    text = text.replace(/<img[^>]*alt=["']([^"']*)["'][^>]*src=["']([^"']*)["'][^>]*>/gi, '![$1]($2)');
    text = text.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');

    // List items
    text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');
    text = text.replace(/<\/?ul[^>]*>/gi, '\n');
    text = text.replace(/<\/?ol[^>]*>/gi, '\n');

    // Paragraphs & breaks
    text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '\n$1\n');
    text = text.replace(/<br\s*[\/]?>/gi, '\n');
    text = text.replace(/<hr\s*[\/]?>/gi, '\n---\n');

    // Strip remaining tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode entities
    text = decodeEntities(text);

    // Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return text;
}

async function downloadFile(fileUrl, destPath) {
    try {
        const res = await fetch(fileUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(destPath, buffer);
        return true;
    } catch (err) {
        console.error(`Failed to download ${fileUrl}: ${err.message}`);
        return false;
    }
}

async function scrapeAllBlogs() {
    const listUrl = 'https://ronshop247.net/blogs';
    console.log(`Fetching blog list from ${listUrl}...`);
    const listRes = await fetch(listUrl);
    const listHtml = await listRes.text();

    const articleBlocks = listHtml.match(/<article class="card h-100 bg-dark text-light border-secondary">[\s\S]*?<\/article>/gi) || [];
    console.log(`Found ${articleBlocks.length} articles on listing page.`);

    const blogs = [];
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
    }

    const downloadedImages = new Map();

    for (const block of articleBlocks) {
        const linkMatch = block.match(/href="\/blogs\/([^"]+)"/i);
        const imgMatch = block.match(/<img src="([^"]+)"[^>]*alt="([^"]*)"/i);
        const titleMatch = block.match(/<h2 class="h5 fw-bold">\s*<a[^>]*>([\s\S]*?)<\/a>\s*<\/h2>/i);
        const summaryMatch = block.match(/<p class="text-secondary">([\s\S]*?)<\/p>/i);
        const dateMatch = block.match(/<div class="card-footer[^>]*>\s*([\s\S]*?)\s*<\/div>/i);

        const slug = linkMatch ? linkMatch[1] : '';
        const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : '';
        const summary = summaryMatch ? decodeEntities(summaryMatch[1].trim()) : '';
        const date = dateMatch ? decodeEntities(dateMatch[1].trim()) : '';
        const thumbnail = imgMatch ? imgMatch[1] : '';

        const detailUrl = `https://ronshop247.net/blogs/${slug}`;
        console.log(`\n--- Fetching [${slug}]: ${title} ---`);

        let contentHtml = '';
        let contentMarkdown = '';
        let detailImage = '';

        try {
            const detailRes = await fetch(detailUrl);
            const detailRaw = await detailRes.text();

            const blogContentMatch = detailRaw.match(/<div class="blog-content">([\s\S]*?)<\/div>\s*<\/article>/i);
            if (blogContentMatch) {
                contentHtml = blogContentMatch[1].trim();
                contentMarkdown = htmlToMarkdown(contentHtml);
            }

            const detailImgMatch = detailRaw.match(/<article[\s\S]*?<img src="([^"]+)" class="img-fluid rounded mb-4"/i);
            if (detailImgMatch) {
                detailImage = detailImgMatch[1];
            }
        } catch (err) {
            console.error(`Error fetching detail for ${slug}:`, err.message);
        }

        // Collect all image URLs in this blog
        const blogImages = [];
        if (thumbnail) blogImages.push(thumbnail);
        if (detailImage && !blogImages.includes(detailImage)) blogImages.push(detailImage);

        const contentImgMatches = [...contentHtml.matchAll(/src=["']([^"']+)["']/gi)];
        for (const m of contentImgMatches) {
            let imgUrl = m[1];
            if (imgUrl.startsWith('/')) imgUrl = 'https://ronshop247.net' + imgUrl;
            if (!blogImages.includes(imgUrl)) blogImages.push(imgUrl);
        }

        // Download images locally
        const localImages = [];
        for (const imgUrl of blogImages) {
            const urlObj = new URL(imgUrl);
            const filename = path.basename(urlObj.pathname);
            const localPath = path.join(imagesDir, filename);

            if (!downloadedImages.has(imgUrl)) {
                console.log(`Downloading: ${filename}...`);
                const ok = await downloadFile(imgUrl, localPath);
                if (ok) downloadedImages.set(imgUrl, filename);
            }
            localImages.push({
                remoteUrl: imgUrl,
                filename: filename,
                relativePath: `images/${filename}`
            });
        }

        blogs.push({
            id: slug,
            slug: slug,
            url: detailUrl,
            title: title,
            summary: summary,
            publishedAt: date,
            thumbnail: thumbnail,
            detailImage: detailImage,
            images: localImages,
            contentMarkdown: contentMarkdown,
            contentHtml: contentHtml
        });
    }

    // Save JSON output
    const jsonPath = path.join(__dirname, 'blogs_data.json');
    fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');
    console.log(`\nSaved full JSON data to ${jsonPath}`);

    // Create a markdown summary file
    let mdContent = `# Dữ Liệu Toàn Bộ Bài Viết Blogs - ronshop247.net\n\n`;
    mdContent += `*Tổng hợp vào lúc: ${new Date().toLocaleString('vi-VN')}*\n`;
    mdContent += `*Tổng số bài viết: ${blogs.length}*\n\n---\n\n`;

    for (let i = 0; i < blogs.length; i++) {
        const b = blogs[i];
        mdContent += `## ${i + 1}. ${b.title}\n\n`;
        mdContent += `- **URL gốc**: [${b.url}](${b.url})\n`;
        mdContent += `- **Slug**: \`${b.slug}\`\n`;
        mdContent += `- **Ngày đăng**: ${b.publishedAt}\n`;
        mdContent += `- **Tóm tắt**: ${b.summary}\n`;
        if (b.thumbnail) {
            mdContent += `- **Thumbnail**: ![${b.title}](${b.thumbnail})\n`;
        }
        mdContent += `\n### Nội dung chi tiết:\n\n`;
        mdContent += `${b.contentMarkdown}\n\n`;
        mdContent += `---\n\n`;
    }

    const mdPath = path.join(__dirname, 'blogs_summary.md');
    fs.writeFileSync(mdPath, mdContent, 'utf8');
    console.log(`Saved Markdown summary to ${mdPath}`);

    // Also save each blog as its own markdown file in a 'blogs' directory
    const blogsDir = path.join(__dirname, 'blogs');
    if (!fs.existsSync(blogsDir)) {
        fs.mkdirSync(blogsDir, { recursive: true });
    }

    for (const b of blogs) {
        let singleMd = `# ${b.title}\n\n`;
        singleMd += `> **Ngày đăng**: ${b.publishedAt}  \n`;
        singleMd += `> **Nguồn**: [${b.url}](${b.url})  \n`;
        singleMd += `> **Mô tả**: ${b.summary}\n\n`;
        if (b.thumbnail) {
            singleMd += `![${b.title}](${b.thumbnail})\n\n`;
        }
        singleMd += `## Nội Dung\n\n`;
        singleMd += `${b.contentMarkdown}\n`;

        fs.writeFileSync(path.join(blogsDir, `${b.slug}.md`), singleMd, 'utf8');
    }
    console.log(`Saved individual markdown files in ${blogsDir}/`);
    console.log(`Total downloaded images: ${downloadedImages.size}`);
}

scrapeAllBlogs().catch(err => {
    console.error('Fatal error:', err);
});
