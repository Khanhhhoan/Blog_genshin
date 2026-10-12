/**
 * Hoyo CMS - Admin Panel Logic
 * Real-time CRUD, Image Uploading, Markdown Editing & Preview
 */

(function () {
    'use strict';

    // State
    const state = {
        posts: [],
        currentEditingPost: null,
        token: localStorage.getItem('hoyo_admin_token') || null
    };

    // DOM Elements
    const el = {
        loginScreen: document.getElementById('loginScreen'),
        dashboardScreen: document.getElementById('dashboardScreen'),
        loginForm: document.getElementById('loginForm'),
        usernameInput: document.getElementById('usernameInput'),
        passwordInput: document.getElementById('passwordInput'),
        loginError: document.getElementById('loginError'),
        loginErrorMsg: document.getElementById('loginErrorMsg'),
        loginSubmitBtn: document.getElementById('loginSubmitBtn'),
        logoutBtn: document.getElementById('logoutBtn'),

        // Dashboard
        statTotalPosts: document.getElementById('statTotalPosts'),
        statCategories: document.getElementById('statCategories'),
        adminSearchInput: document.getElementById('adminSearchInput'),
        createPostBtn: document.getElementById('createPostBtn'),
        postsTableBody: document.getElementById('postsTableBody'),

        // Post Editor Modal
        editorModal: document.getElementById('editorModal'),
        editorModalTitle: document.getElementById('editorModalTitle'),
        closeEditorBtn: document.getElementById('closeEditorBtn'),
        cancelEditorBtn: document.getElementById('cancelEditorBtn'),
        postEditorForm: document.getElementById('postEditorForm'),
        editPostOldSlug: document.getElementById('editPostOldSlug'),
        postTitleInput: document.getElementById('postTitleInput'),
        postSlugInput: document.getElementById('postSlugInput'),
        postCategoryInput: document.getElementById('postCategoryInput'),
        postSummaryInput: document.getElementById('postSummaryInput'),
        thumbPreviewImg: document.getElementById('thumbPreviewImg'),
        thumbFileInput: document.getElementById('thumbFileInput'),
        triggerThumbUploadBtn: document.getElementById('triggerThumbUploadBtn'),
        uploadingStatus: document.getElementById('uploadingStatus'),
        thumbUrlInput: document.getElementById('thumbUrlInput'),
        contentImageUpload: document.getElementById('contentImageUpload'),
        postContentMarkdown: document.getElementById('postContentMarkdown'),
        postContentPreview: document.getElementById('postContentPreview'),
        tabEdit: document.getElementById('tabEdit'),
        tabPreview: document.getElementById('tabPreview'),
        savePostBtn: document.getElementById('savePostBtn'),

        // Password Modal
        changePassModal: document.getElementById('changePassModal'),
        openChangePassBtn: document.getElementById('openChangePassBtn'),
        closePassModalBtn: document.getElementById('closePassModalBtn'),
        cancelPassBtn: document.getElementById('cancelPassBtn'),
        changePassForm: document.getElementById('changePassForm'),
        currentPassInput: document.getElementById('currentPassInput'),
        newPassInput: document.getElementById('newPassInput'),
        confirmPassInput: document.getElementById('confirmPassInput'),
        passError: document.getElementById('passError'),

        // Toast
        adminToast: document.getElementById('adminToast'),
        adminToastMsg: document.getElementById('adminToastMsg')
    };

    /**
     * Initialization
     */
    function init() {
        bindEvents();
        checkAuth();
    }

    /**
     * Check authentication status
     */
    function checkAuth() {
        if (state.token) {
            showDashboard();
            loadPosts();
        } else {
            showLogin();
        }
    }

    function showLogin() {
        el.loginScreen.classList.remove('d-none');
        el.dashboardScreen.classList.add('d-none');
        if (el.usernameInput) el.usernameInput.focus();
    }

    function showDashboard() {
        el.loginScreen.classList.add('d-none');
        el.dashboardScreen.classList.remove('d-none');
    }

    /**
     * Bind DOM Event Handlers
     */
    function bindEvents() {
        // 1. Login Form
        if (el.loginForm) {
            el.loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                el.loginError.classList.add('d-none');
                const username = el.usernameInput.value.trim();
                const password = el.passwordInput.value.trim();

                try {
                    const res = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username, password })
                    });
                    const data = await res.json();

                    if (data.success) {
                        state.token = data.token;
                        localStorage.setItem('hoyo_admin_token', data.token);
                        showToast('Đăng nhập thành công! Chào mừng bạn.');
                        showDashboard();
                        loadPosts();
                    } else {
                        showLoginError(data.message || 'Sai tên đăng nhập hoặc mật khẩu!');
                    }
                } catch (err) {
                    showLoginError('Lỗi kết nối tới máy chủ: ' + err.message);
                }
            });
        }

        // 2. Logout Button
        if (el.logoutBtn) {
            el.logoutBtn.addEventListener('click', () => {
                state.token = null;
                localStorage.removeItem('hoyo_admin_token');
                showToast('Đã đăng xuất khỏi trang quản trị.');
                showLogin();
            });
        }

        // 3. Search Posts
        if (el.adminSearchInput) {
            el.adminSearchInput.addEventListener('input', () => {
                renderPostsTable();
            });
        }

        // 4. Create Post Button
        if (el.createPostBtn) {
            el.createPostBtn.addEventListener('click', () => {
                openEditorModal(null);
            });
        }

        // 5. Close / Cancel Editor Modal
        if (el.closeEditorBtn) el.closeEditorBtn.addEventListener('click', closeEditorModal);
        if (el.cancelEditorBtn) el.cancelEditorBtn.addEventListener('click', closeEditorModal);

        // 6. Post Title auto-slugify
        if (el.postTitleInput) {
            el.postTitleInput.addEventListener('input', () => {
                if (!el.editPostOldSlug.value) {
                    el.postSlugInput.value = slugify(el.postTitleInput.value);
                }
            });
        }

        // 7. Thumbnail URL direct input change
        if (el.thumbUrlInput) {
            el.thumbUrlInput.addEventListener('input', () => {
                el.thumbPreviewImg.src = el.thumbUrlInput.value || 'images/thumb_cachlienkethoyoverse.jpg';
            });
        }

        // 8. Thumbnail File Upload
        if (el.triggerThumbUploadBtn && el.thumbFileInput) {
            el.triggerThumbUploadBtn.addEventListener('click', () => el.thumbFileInput.click());
            el.thumbFileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                await uploadImageFile(file, (url) => {
                    el.thumbUrlInput.value = url;
                    el.thumbPreviewImg.src = url;
                    showToast('Đã cập nhật ảnh đại diện!');
                });
            });
        }

        // 9. Markdown Toolbar actions
        document.querySelectorAll('.tool-btn[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                handleToolbarAction(btn.getAttribute('data-action'));
            });
        });

        // 10. Content Image Upload button from toolbar
        if (el.contentImageUpload) {
            el.contentImageUpload.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                await uploadImageFile(file, (url) => {
                    insertTextAtCursor(el.postContentMarkdown, `\n![Ảnh minh họa](${url})\n`);
                    showToast('Đã chèn ảnh vào bài viết!');
                });
            });
        }

        // 11. Direct Image Paste (Ctrl + V) from clipboard
        if (el.postContentMarkdown) {
            el.postContentMarkdown.addEventListener('paste', async (e) => {
                const clipboardData = e.clipboardData || window.clipboardData;
                if (!clipboardData) return;

                const items = clipboardData.items;
                let imageFile = null;

                if (items) {
                    for (let i = 0; i < items.length; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            imageFile = items[i].getAsFile();
                            break;
                        }
                    }
                }

                if (imageFile) {
                    e.preventDefault();
                    const tempPlaceholder = `\n![Đang tải ảnh lên...](${Date.now()})\n`;
                    insertTextAtCursor(el.postContentMarkdown, tempPlaceholder);
                    showToast('Đang tải ảnh từ Clipboard lên máy chủ...');

                    await uploadImageFile(imageFile, (url) => {
                        el.postContentMarkdown.value = el.postContentMarkdown.value.replace(
                            tempPlaceholder,
                            `\n![Ảnh minh họa](${url})\n`
                        );
                        showToast('Đã dán và chèn ảnh thành công!');
                    });
                }
            });

            // 12. Drag & Drop image file directly into Editor
            el.postContentMarkdown.addEventListener('dragover', (e) => {
                e.preventDefault();
                el.postContentMarkdown.style.boxShadow = '0 0 0 2px var(--accent)';
            });
            el.postContentMarkdown.addEventListener('dragleave', (e) => {
                e.preventDefault();
                el.postContentMarkdown.style.boxShadow = '';
            });
            el.postContentMarkdown.addEventListener('drop', async (e) => {
                e.preventDefault();
                el.postContentMarkdown.style.boxShadow = '';
                const files = e.dataTransfer ? e.dataTransfer.files : [];
                if (files.length > 0 && files[0].type.startsWith('image/')) {
                    const file = files[0];
                    const tempPlaceholder = `\n![Đang tải ảnh lên...](${Date.now()})\n`;
                    insertTextAtCursor(el.postContentMarkdown, tempPlaceholder);
                    showToast('Đang tải ảnh vừa thả lên...');

                    await uploadImageFile(file, (url) => {
                        el.postContentMarkdown.value = el.postContentMarkdown.value.replace(
                            tempPlaceholder,
                            `\n![Ảnh minh họa](${url})\n`
                        );
                        showToast('Đã chèn ảnh thành công!');
                    });
                }
            });
        }

        // 13. Tabs: Edit vs Preview
        if (el.tabEdit && el.tabPreview) {
            el.tabEdit.addEventListener('click', () => switchEditorTab('edit'));
            el.tabPreview.addEventListener('click', () => switchEditorTab('preview'));
        }

        // 14. Save Post Form
        if (el.postEditorForm) {
            el.postEditorForm.addEventListener('submit', handleSavePost);
        }

        // 15. Password Modal handlers
        if (el.openChangePassBtn) el.openChangePassBtn.addEventListener('click', openPasswordModal);
        if (el.closePassModalBtn) el.closePassModalBtn.addEventListener('click', closePasswordModal);
        if (el.cancelPassBtn) el.cancelPassBtn.addEventListener('click', closePasswordModal);
        if (el.changePassForm) el.changePassForm.addEventListener('submit', handleChangePassword);
    }

    /**
     * Show Login Error
     */
    function showLoginError(msg) {
        el.loginErrorMsg.textContent = msg;
        el.loginError.classList.remove('d-none');
    }

    /**
     * Load Posts from Backend API
     */
    async function loadPosts() {
        try {
            const res = await fetch('/api/posts');
            const data = await res.json();
            if (data.success) {
                state.posts = data.data || [];
                renderStats();
                renderPostsTable();
            }
        } catch (err) {
            showToast('Lỗi tải danh sách bài viết: ' + err.message);
        }
    }

    /**
     * Render Stats
     */
    function renderStats() {
        if (el.statTotalPosts) el.statTotalPosts.textContent = state.posts.length;
        if (el.statCategories) {
            const cats = new Set(state.posts.map(p => p.category).filter(Boolean));
            el.statCategories.textContent = cats.size;
        }
    }

    /**
     * Render Posts Table
     */
    function renderPostsTable() {
        if (!el.postsTableBody) return;
        const query = (el.adminSearchInput ? el.adminSearchInput.value : '').trim().toLowerCase();

        const filtered = state.posts.filter(p => {
            if (!query) return true;
            return (p.title && p.title.toLowerCase().includes(query)) ||
                   (p.category && p.category.toLowerCase().includes(query)) ||
                   (p.slug && p.slug.toLowerCase().includes(query));
        });

        if (filtered.length === 0) {
            el.postsTableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-tertiary);">
                        <i class="ph ph-folder-open" style="font-size: 2.5rem; display: block; margin-bottom: 0.5rem;"></i>
                        Không tìm thấy bài viết nào phù hợp.
                    </td>
                </tr>
            `;
            return;
        }

        el.postsTableBody.innerHTML = filtered.map(post => {
            const thumbUrl = post.thumbnail || 'images/thumb_cachlienkethoyoverse.jpg';
            return `
                <tr data-slug="${escapeHtml(post.slug)}">
                    <td>
                        <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(post.title)}" class="table-thumb" onerror="this.src='images/thumb_cachlienkethoyoverse.jpg'">
                    </td>
                    <td>
                        <div class="post-table-title">${escapeHtml(post.title)}</div>
                        <div class="post-table-summary">${escapeHtml(post.summary || '')}</div>
                    </td>
                    <td>
                        <span class="category-tag">${escapeHtml(post.category || 'Chung')}</span>
                    </td>
                    <td>
                        <span class="date-text">${escapeHtml(post.publishedAt || '')}</span>
                    </td>
                    <td>
                        <div class="table-actions">
                            <a href="/#/post/${escapeHtml(post.slug)}" target="_blank" class="action-btn" title="Xem trên Blog">
                                <i class="ph ph-arrow-square-out"></i>
                            </a>
                            <button type="button" class="action-btn edit-btn" data-edit-slug="${escapeHtml(post.slug)}" title="Chỉnh sửa">
                                <i class="ph ph-pencil-simple"></i>
                            </button>
                            <button type="button" class="action-btn delete-btn" data-delete-slug="${escapeHtml(post.slug)}" title="Xóa bài viết">
                                <i class="ph ph-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach action events
        el.postsTableBody.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const slug = btn.getAttribute('data-edit-slug');
                const post = state.posts.find(p => p.slug === slug);
                if (post) openEditorModal(post);
            });
        });

        el.postsTableBody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const slug = btn.getAttribute('data-delete-slug');
                handleDeletePost(slug);
            });
        });
    }

    /**
     * Open Editor Modal (Create or Edit)
     */
    function openEditorModal(post) {
        state.currentEditingPost = post;
        switchEditorTab('edit');

        if (post) {
            // Edit Mode
            el.editorModalTitle.textContent = 'Chỉnh sửa bài viết';
            el.editPostOldSlug.value = post.slug;
            el.postTitleInput.value = post.title || '';
            el.postSlugInput.value = post.slug || '';
            el.postCategoryInput.value = post.category || 'Hướng dẫn Game';
            el.postSummaryInput.value = post.summary || '';
            el.thumbUrlInput.value = post.thumbnail || '';
            el.thumbPreviewImg.src = post.thumbnail || 'images/thumb_cachlienkethoyoverse.jpg';
            el.postContentMarkdown.value = post.contentMarkdown || '';
        } else {
            // Create Mode
            el.editorModalTitle.textContent = 'Thêm bài viết mới';
            el.editPostOldSlug.value = '';
            el.postTitleInput.value = '';
            el.postSlugInput.value = '';
            el.postCategoryInput.value = 'Hướng dẫn Game';
            el.postSummaryInput.value = '';
            el.thumbUrlInput.value = 'images/thumb_cachlienkethoyoverse.jpg';
            el.thumbPreviewImg.src = 'images/thumb_cachlienkethoyoverse.jpg';
            el.postContentMarkdown.value = '## Giới thiệu\n\nNội dung bài viết mới...\n\n### Hướng dẫn chi tiết\n\n1. Bước 1: ...\n2. Bước 2: ...\n';
        }

        el.editorModal.classList.remove('d-none');
        el.postTitleInput.focus();
    }

    function closeEditorModal() {
        el.editorModal.classList.add('d-none');
        state.currentEditingPost = null;
    }

    /**
     * Switch Editor Tab (Markdown vs Preview)
     */
    function switchEditorTab(tab) {
        if (tab === 'edit') {
            el.tabEdit.classList.add('active');
            el.tabPreview.classList.remove('active');
            el.postContentMarkdown.classList.remove('d-none');
            el.postContentPreview.classList.add('d-none');
        } else {
            el.tabEdit.classList.remove('active');
            el.tabPreview.classList.add('active');
            el.postContentMarkdown.classList.add('d-none');
            el.postContentPreview.classList.remove('d-none');
            // Render preview
            el.postContentPreview.innerHTML = parseMarkdownToHtml(el.postContentMarkdown.value);
        }
    }

    /**
     * Markdown Toolbar Operations
     */
    function handleToolbarAction(action) {
        const textarea = el.postContentMarkdown;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);

        let replacement = '';
        switch (action) {
            case 'bold':
                replacement = `**${selectedText || 'chữ in đậm'}**`;
                break;
            case 'italic':
                replacement = `*${selectedText || 'chữ in nghiêng'}*`;
                break;
            case 'h1':
                replacement = `\n# ${selectedText || 'Tiêu đề 1'}\n`;
                break;
            case 'h2':
                replacement = `\n## ${selectedText || 'Tiêu đề 2'}\n`;
                break;
            case 'h3':
                replacement = `\n### ${selectedText || 'Tiêu đề 3'}\n`;
                break;
            case 'ul':
                replacement = `\n- ${selectedText || 'Mục danh sách'}\n`;
                break;
            case 'quote':
                replacement = `\n> ${selectedText || 'Trích dẫn quan trọng'}\n`;
                break;
            case 'hr':
                replacement = `\n---\n`;
                break;
            case 'link':
                replacement = `[${selectedText || 'Tên liên kết'}](https://example.com)`;
                break;
        }

        insertTextAtCursor(textarea, replacement);
    }

    function insertTextAtCursor(textarea, text) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        textarea.value = val.substring(0, start) + text + val.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
    }

    /**
     * Upload Image File via API
     */
    async function uploadImageFile(file, onSuccess) {
        if (!file) return;
        if (el.uploadingStatus) el.uploadingStatus.classList.remove('d-none');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                },
                body: formData
            });
            const data = await res.json();
            if (data.success && data.url) {
                onSuccess(data.url);
            } else {
                alert('Tải ảnh thất bại: ' + (data.message || 'Lỗi không xác định'));
            }
        } catch (err) {
            alert('Lỗi tải ảnh lên máy chủ: ' + err.message);
        } finally {
            if (el.uploadingStatus) el.uploadingStatus.classList.add('d-none');
        }
    }

    /**
     * Handle Save Post (Create / Update)
     */
    async function handleSavePost(e) {
        e.preventDefault();

        const oldSlug = el.editPostOldSlug.value;
        const title = el.postTitleInput.value.trim();
        const slug = slugify(el.postSlugInput.value.trim());
        const category = el.postCategoryInput.value;
        const summary = el.postSummaryInput.value.trim();
        const thumbnail = el.thumbUrlInput.value.trim() || 'images/thumb_cachlienkethoyoverse.jpg';
        const contentMarkdown = el.postContentMarkdown.value;

        if (!title || !slug) {
            alert('Vui lòng điền tiêu đề và đường dẫn (slug)!');
            return;
        }

        el.savePostBtn.disabled = true;
        el.savePostBtn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Đang lưu...';

        try {
            let res, data;
            const authHeaders = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            };

            if (oldSlug) {
                // Update
                res = await fetch(`/api/posts/${encodeURIComponent(oldSlug)}`, {
                    method: 'PUT',
                    headers: authHeaders,
                    body: JSON.stringify({
                        title,
                        summary,
                        category,
                        thumbnail,
                        contentMarkdown
                    })
                });
            } else {
                // Create
                res = await fetch('/api/posts', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        title,
                        slug,
                        summary,
                        category,
                        thumbnail,
                        contentMarkdown
                    })
                });
            }

            data = await res.json();
            if (data.success) {
                showToast(data.message || 'Lưu bài viết thành công!');
                closeEditorModal();
                await loadPosts();
            } else {
                alert('Lỗi: ' + data.message);
            }
        } catch (err) {
            alert('Lỗi kết nối máy chủ khi lưu: ' + err.message);
        } finally {
            el.savePostBtn.disabled = false;
            el.savePostBtn.innerHTML = '<i class="ph ph-floppy-disk"></i> Lưu bài viết';
        }
    }

    /**
     * Handle Delete Post
     */
    async function handleDeletePost(slug) {
        const post = state.posts.find(p => p.slug === slug);
        const title = post ? post.title : slug;
        const confirmDelete = confirm(`Bạn có chắc chắn muốn xóa bài viết "${title}" không?\nHành động này không thể hoàn tác!`);
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${state.token}`
                }
            });
            const data = await res.json();
            if (data.success) {
                showToast('Đã xóa bài viết thành công!');
                await loadPosts();
            } else {
                alert('Lỗi khi xóa: ' + data.message);
            }
        } catch (err) {
            alert('Lỗi máy chủ khi xóa: ' + err.message);
        }
    }

    /**
     * Change Password Modal
     */
    function openPasswordModal() {
        el.changePassForm.reset();
        el.passError.classList.add('d-none');
        el.changePassModal.classList.remove('d-none');
    }

    function closePasswordModal() {
        el.changePassModal.classList.add('d-none');
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        el.passError.classList.add('d-none');

        const currentPassword = el.currentPassInput.value;
        const newPassword = el.newPassInput.value;
        const confirmPassword = el.confirmPassInput.value;

        if (newPassword !== confirmPassword) {
            el.passError.textContent = 'Mật khẩu mới và xác nhận mật khẩu không khớp!';
            el.passError.classList.remove('d-none');
            return;
        }

        if (newPassword.length < 4) {
            el.passError.textContent = 'Mật khẩu mới phải có tối thiểu 4 ký tự!';
            el.passError.classList.remove('d-none');
            return;
        }

        try {
            const res = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (data.success) {
                closePasswordModal();
                showToast('Đổi mật khẩu thành công!');
            } else {
                el.passError.textContent = data.message || 'Đổi mật khẩu thất bại!';
                el.passError.classList.remove('d-none');
            }
        } catch (err) {
            el.passError.textContent = 'Lỗi kết nối máy chủ: ' + err.message;
            el.passError.classList.remove('d-none');
        }
    }

    /**
     * Toast Notifications
     */
    let toastTimer = null;
    function showToast(msg) {
        if (!el.adminToast || !el.adminToastMsg) return;
        el.adminToastMsg.textContent = msg;
        el.adminToast.classList.remove('d-none');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            el.adminToast.classList.add('d-none');
        }, 3500);
    }

    /**
     * Utilities
     */
    function slugify(text) {
        if (!text) return '';
        return text
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseMarkdownToHtml(md) {
        if (!md) return '<p><i>Chưa có nội dung xem trước...</i></p>';
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
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
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

    // Run
    init();
})();
