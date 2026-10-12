const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3333;

// Admin credentials file
const CONFIG_FILE = path.join(__dirname, 'admin_config.json');
if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({
        username: 'admin',
        password: 'admin123'
    }, null, 2), 'utf8');
}

function getAdminConfig() {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer storage for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dest = path.join(__dirname, 'images');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `upload_${Date.now()}_${cleanBase}${ext}`;
        cb(null, filename);
    }
});
const upload = multer({ storage: storage });

// Helper to regenerate blogs_data.js
function regenerateJsData() {
    try {
        const jsonData = JSON.parse(fs.readFileSync(path.join(__dirname, 'blogs_data.json'), 'utf8'));
        const jsContent = `// Dữ liệu bài viết Blog cá nhân\nwindow.BLOGS_DATA = ${JSON.stringify(jsonData, null, 2)};\n`;
        fs.writeFileSync(path.join(__dirname, 'blogs_data.js'), jsContent, 'utf8');
        console.log('Regenerated blogs_data.js');
    } catch (err) {
        console.error('Error regenerating blogs_data.js:', err.message);
    }
}

// Convert markdown to clean HTML (lightweight converter)
function markdownToHtml(md) {
    if (!md) return '';
    let html = md;
    html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">');
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');
    html = html.replace(/^\- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gim, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/gim, '');
    html = html.replace(/\n\n+/g, '</p><p>');
    html = `<p>${html}</p>`;
    html = html.replace(/<p><h([1-6])>/g, '<h$1>').replace(/<\/h([1-6])><\/p>/g, '</h$1>');
    html = html.replace(/<p><ul>/g, '<ul>').replace(/<\/ul><\/p>/g, '</ul>');
    html = html.replace(/<p><blockquote>/g, '<blockquote>').replace(/<\/blockquote><\/p>/g, '</blockquote>');
    html = html.replace(/<p><\/p>/g, '');
    return html;
}

// --- API ENDPOINTS ---

// 1. Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const config = getAdminConfig();
    if (username === config.username && password === config.password) {
        // Simple token for admin session
        const token = 'admin_token_' + Buffer.from(`${username}:${Date.now()}`).toString('base64');
        return res.json({ success: true, token: token, username: config.username });
    }
    return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
});

// Auth Middleware
function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer admin_token_')) {
        return res.status(401).json({ success: false, message: 'Yêu cầu quyền quản trị! Vui lòng đăng nhập.' });
    }
    next();
}

// 2. Change Password
app.post('/api/change-password', requireAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const config = getAdminConfig();
    if (currentPassword !== config.password) {
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
    }
    if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 4 ký tự!' });
    }
    config.password = newPassword;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
});

// 3. Get all posts
app.get('/api/posts', (req, res) => {
    try {
        const jsonPath = path.join(__dirname, 'blogs_data.json');
        const blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        res.json({ success: true, data: blogs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 4. Get single post by slug
app.get('/api/posts/:slug', (req, res) => {
    try {
        const jsonPath = path.join(__dirname, 'blogs_data.json');
        const blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const post = blogs.find(b => b.slug === req.params.slug);
        if (!post) return res.status(404).json({ success: false, message: 'Bài viết không tồn tại' });
        res.json({ success: true, data: post });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 5. Create new post
app.post('/api/posts', requireAuth, (req, res) => {
    try {
        const { title, slug, summary, category, thumbnail, contentMarkdown } = req.body;
        if (!title || !slug) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền tiêu đề và slug!' });
        }

        const jsonPath = path.join(__dirname, 'blogs_data.json');
        let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        if (blogs.some(b => b.slug === slug)) {
            return res.status(400).json({ success: false, message: 'Đường dẫn (slug) này đã tồn tại, hãy chọn slug khác!' });
        }

        const now = new Date();
        const publishedAt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const wordCount = (contentMarkdown || '').split(/\s+/).length;
        const readingTime = `${Math.max(1, Math.ceil(wordCount / 180))} phút đọc`;
        const contentHtml = markdownToHtml(contentMarkdown);

        const newPost = {
            id: slug,
            slug: slug,
            url: `/blogs/${slug}`,
            title: title.trim(),
            summary: (summary || '').trim(),
            publishedAt: publishedAt,
            category: category || 'Hướng dẫn Game',
            readingTime: readingTime,
            thumbnail: thumbnail || 'images/thumb_cachlienkethoyoverse.jpg',
            detailImage: thumbnail || 'images/thumb_cachlienkethoyoverse.jpg',
            contentMarkdown: contentMarkdown || '',
            contentHtml: contentHtml
        };

        blogs.unshift(newPost);
        fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');

        // Create markdown file in blogs/
        const mdPath = path.join(__dirname, 'blogs', `${slug}.md`);
        const mdText = `# ${newPost.title}\n\n> **Ngày đăng**: ${newPost.publishedAt}  \n> **Mô tả**: ${newPost.summary}\n\n![${newPost.title}](../${newPost.thumbnail})\n\n## Nội Dung\n\n${newPost.contentMarkdown}\n`;
        fs.writeFileSync(mdPath, mdText, 'utf8');

        regenerateJsData();
        res.json({ success: true, data: newPost, message: 'Thêm bài viết thành công!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 6. Update existing post
app.put('/api/posts/:slug', requireAuth, (req, res) => {
    try {
        const oldSlug = req.params.slug;
        const { title, summary, category, thumbnail, contentMarkdown } = req.body;

        const jsonPath = path.join(__dirname, 'blogs_data.json');
        let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const index = blogs.findIndex(b => b.slug === oldSlug);
        if (index === -1) {
            return res.status(404).json({ success: false, message: 'Bài viết không tồn tại!' });
        }

        const post = blogs[index];
        if (title) post.title = title.trim();
        if (summary !== undefined) post.summary = summary.trim();
        if (category) post.category = category;
        if (thumbnail) {
            post.thumbnail = thumbnail;
            post.detailImage = thumbnail;
        }
        if (contentMarkdown !== undefined) {
            post.contentMarkdown = contentMarkdown;
            post.contentHtml = markdownToHtml(contentMarkdown);
            const wordCount = contentMarkdown.split(/\s+/).length;
            post.readingTime = `${Math.max(1, Math.ceil(wordCount / 180))} phút đọc`;
        }

        fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');

        // Update markdown file in blogs/
        const mdPath = path.join(__dirname, 'blogs', `${post.slug}.md`);
        const mdText = `# ${post.title}\n\n> **Ngày đăng**: ${post.publishedAt}  \n> **Mô tả**: ${post.summary}\n\n![${post.title}](../${post.thumbnail})\n\n## Nội Dung\n\n${post.contentMarkdown}\n`;
        fs.writeFileSync(mdPath, mdText, 'utf8');

        regenerateJsData();
        res.json({ success: true, data: post, message: 'Lưu bài viết thành công!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 7. Delete post
app.delete('/api/posts/:slug', requireAuth, (req, res) => {
    try {
        const slug = req.params.slug;
        const jsonPath = path.join(__dirname, 'blogs_data.json');
        let blogs = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        const initialLen = blogs.length;
        blogs = blogs.filter(b => b.slug !== slug);

        if (blogs.length === initialLen) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết để xóa!' });
        }

        fs.writeFileSync(jsonPath, JSON.stringify(blogs, null, 2), 'utf8');

        // Delete markdown file
        const mdPath = path.join(__dirname, 'blogs', `${slug}.md`);
        if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);

        regenerateJsData();
        res.json({ success: true, message: 'Đã xóa bài viết thành công!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// 8. Image Upload
app.post('/api/upload', requireAuth, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không có file ảnh nào được tải lên!' });
    }
    const relativeUrl = `images/${req.file.filename}`;
    res.json({
        success: true,
        url: relativeUrl,
        filename: req.file.filename,
        message: 'Tải ảnh lên thành công!'
    });
});

// Serve static frontend files
app.use(express.static(__dirname));

// Fallback to index.html or admin.html
app.use((req, res) => {
    if (req.url.startsWith('/admin')) {
        return res.sendFile(path.join(__dirname, 'admin.html'));
    }
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Blog & CMS Server running on http://localhost:${PORT}`);
    console.log(`Admin dashboard at: http://localhost:${PORT}/admin.html`);
});
