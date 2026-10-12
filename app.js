/**
 * Hoyo Blog - Personal Gaming Blog Application
 * Modern Vanilla JS SPA with Hash Routing, Search, Filters & Lightbox
 */

(function () {
    'use strict';

    // State
    const state = {
        posts: window.BLOGS_DATA || [],
        currentCategory: 'ALL',
        searchQuery: '',
        currentPost: null
    };

    // DOM Elements
    const elements = {
        listView: document.getElementById('listView'),
        detailView: document.getElementById('detailView'),
        postsGrid: document.getElementById('postsGrid'),
        postsCount: document.getElementById('postsCount'),
        emptyState: document.getElementById('emptyState'),
        searchInput: document.getElementById('searchInput'),
        clearSearchBtn: document.getElementById('clearSearchBtn'),
        categoryPills: document.getElementById('categoryFilter'),
        resetFilterBtn: document.getElementById('resetFilterBtn'),
        headerSearchBtn: document.getElementById('headerSearchBtn'),
        readingProgress: document.getElementById('readingProgress'),
        
        // Detail Elements
        crumbCategory: document.getElementById('crumbCategory'),
        crumbTitle: document.getElementById('crumbTitle'),
        postCategoryBadge: document.getElementById('postCategoryBadge'),
        postReadingTime: document.getElementById('postReadingTime'),
        postTitle: document.getElementById('postTitle'),
        postDate: document.getElementById('postDate'),
        postCoverWrapper: document.getElementById('postCoverWrapper'),
        postCover: document.getElementById('postCover'),
        postContent: document.getElementById('postContent'),
        postTagSpan: document.getElementById('postTagSpan'),
        copyLinkBtn: document.getElementById('copyLinkBtn'),
        shareFbBtn: document.getElementById('shareFbBtn'),
        scrollToTopBtn: document.getElementById('scrollToTopBtn'),
        relatedGrid: document.getElementById('relatedGrid'),

        // Lightbox & Toast
        lightbox: document.getElementById('imageLightbox'),
        lightboxImg: document.getElementById('lightboxImg'),
        lightboxCaption: document.getElementById('lightboxCaption'),
        closeLightboxBtn: document.getElementById('closeLightboxBtn'),
        toast: document.getElementById('toast'),
        toastMessage: document.getElementById('toastMessage')
    };

    /**
     * Initialize Application
     */
    async function init() {
        bindEvents();
        // Try fetching freshest posts from CMS API
        try {
            const res = await fetch('/api/posts');
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                    state.posts = json.data;
                }
            }
        } catch (e) {
            // Fallback to window.BLOGS_DATA already in state
        }
        handleRoute();
        window.addEventListener('hashchange', handleRoute);
        window.addEventListener('scroll', updateReadingProgress);
    }

    /**
     * Bind DOM Event Listeners
     */
    function bindEvents() {
        // Search Input
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim().toLowerCase();
                elements.clearSearchBtn.classList.toggle('d-none', !state.searchQuery);
                renderPostsList();
            });
        }

        // Clear Search
        if (elements.clearSearchBtn) {
            elements.clearSearchBtn.addEventListener('click', () => {
                elements.searchInput.value = '';
                state.searchQuery = '';
                elements.clearSearchBtn.classList.add('d-none');
                elements.searchInput.focus();
                renderPostsList();
            });
        }

        // Reset Filter on Empty State
        if (elements.resetFilterBtn) {
            elements.resetFilterBtn.addEventListener('click', () => {
                state.currentCategory = 'ALL';
                state.searchQuery = '';
                elements.searchInput.value = '';
                elements.clearSearchBtn.classList.add('d-none');
                updateCategoryActivePill();
                renderPostsList();
            });
        }

        // Category Pills Click
        if (elements.categoryPills) {
            elements.categoryPills.addEventListener('click', (e) => {
                const btn = e.target.closest('.pill-btn');
                if (!btn) return;
                const cat = btn.dataset.category;
                if (cat) {
                    state.currentCategory = cat;
                    updateCategoryActivePill();
                    renderPostsList();
                }
            });
        }

        // Header Search Trigger
        if (elements.headerSearchBtn) {
            elements.headerSearchBtn.addEventListener('click', () => {
                if (window.location.hash.startsWith('#/post')) {
                    window.location.hash = '#/';
                    setTimeout(() => {
                        elements.searchInput?.focus();
                    }, 100);
                } else {
                    elements.searchInput?.focus();
                }
            });
        }

        // Footer Category Links
        document.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const cat = link.dataset.category;
                if (cat) {
                    state.currentCategory = cat;
                    updateCategoryActivePill();
                    if (window.location.hash !== '#/' && window.location.hash !== '#') {
                        window.location.hash = '#/';
                    }
                    renderPostsList();
                }
            });
        });

        // Copy Share Link
        if (elements.copyLinkBtn) {
            elements.copyLinkBtn.addEventListener('click', () => {
                navigator.clipboard.writeText(window.location.href).then(() => {
                    showToast('Đã sao chép liên kết bài viết vào clipboard!');
                }).catch(() => {
                    showToast('Không thể sao chép liên kết');
                });
            });
        }

        // Share Facebook
        if (elements.shareFbBtn) {
            elements.shareFbBtn.addEventListener('click', () => {
                const url = encodeURIComponent(window.location.href);
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
            });
        }

        // Scroll to Top
        if (elements.scrollToTopBtn) {
            elements.scrollToTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Lightbox Close
        if (elements.closeLightboxBtn) {
            elements.closeLightboxBtn.addEventListener('click', closeLightbox);
        }
        if (elements.lightbox) {
            elements.lightbox.querySelector('.lightbox-backdrop').addEventListener('click', closeLightbox);
        }

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeLightbox();
            }
            if (e.key === '/' && document.activeElement !== elements.searchInput) {
                e.preventDefault();
                elements.searchInput?.focus();
            }
        });
    }

    /**
     * Handle Hash-based SPA routing
     */
    function handleRoute() {
        const hash = window.location.hash || '#/';
        
        // Reset scroll position on route change
        window.scrollTo({ top: 0, behavior: 'instant' });

        if (hash.startsWith('#/post/')) {
            const slug = hash.replace('#/post/', '').trim();
            const post = state.posts.find(p => p.slug === slug);
            if (post) {
                showDetailView(post);
            } else {
                window.location.hash = '#/';
            }
        } else {
            showListView();
        }
    }

    /**
     * Show List View
     */
    function showListView() {
        elements.listView.classList.remove('d-none');
        elements.detailView.classList.add('d-none');
        elements.readingProgress.style.width = '0%';
        document.title = 'Blog Hướng Dẫn & Tin Tức Game Hoyoverse';
        renderPostsList();
    }

    /**
     * Update active category button style
     */
    function updateCategoryActivePill() {
        if (!elements.categoryPills) return;
        elements.categoryPills.querySelectorAll('.pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === state.currentCategory);
        });
    }

    /**
     * Render filtered posts list into grid
     */
    function renderPostsList() {
        let filtered = state.posts;

        // Filter by Category
        if (state.currentCategory !== 'ALL') {
            filtered = filtered.filter(p => p.category === state.currentCategory);
        }

        // Filter by Search Query
        if (state.searchQuery) {
            filtered = filtered.filter(p => {
                const title = (p.title || '').toLowerCase();
                const summary = (p.summary || '').toLowerCase();
                const md = (p.contentMarkdown || '').toLowerCase();
                return title.includes(state.searchQuery) ||
                       summary.includes(state.searchQuery) ||
                       md.includes(state.searchQuery);
            });
        }

        // Update count badge
        elements.postsCount.textContent = `${filtered.length} bài`;

        // Check empty state
        if (filtered.length === 0) {
            elements.postsGrid.innerHTML = '';
            elements.emptyState.classList.remove('d-none');
            return;
        }

        elements.emptyState.classList.add('d-none');

        // Render Cards
        elements.postsGrid.innerHTML = filtered.map(post => {
            const thumb = post.thumbnail || 'images/blog_20260826004706374_83d885bf.png';
            return `
                <a href="#/post/${post.slug}" class="post-card">
                    <div class="card-thumb-wrap">
                        <img src="${thumb}" alt="${escapeHtml(post.title)}" class="card-thumb" loading="lazy">
                        <span class="card-badge">${escapeHtml(post.category)}</span>
                    </div>
                    <div class="card-body">
                        <div class="card-meta">
                            <span><i class="ph ph-calendar"></i> ${post.publishedAt}</span>
                            <span><i class="ph ph-clock"></i> ${post.readingTime}</span>
                        </div>
                        <h3 class="card-title">${escapeHtml(post.title)}</h3>
                        <p class="card-excerpt">${escapeHtml(post.summary || '')}</p>
                        <div class="card-footer">
                            <span>Đọc tiếp</span>
                            <i class="ph ph-arrow-right"></i>
                        </div>
                    </div>
                </a>
            `;
        }).join('');
    }

    /**
     * Show Post Detail View
     */
    function showDetailView(post) {
        state.currentPost = post;
        elements.listView.classList.add('d-none');
        elements.detailView.classList.remove('d-none');

        // Update Title & Breadcrumbs
        document.title = `${post.title} | Hoyo Blog`;
        elements.crumbCategory.textContent = post.category;
        elements.crumbTitle.textContent = post.title;
        elements.postCategoryBadge.textContent = post.category;
        elements.postReadingTime.innerHTML = `<i class="ph ph-clock"></i> ${post.readingTime}`;
        elements.postTitle.textContent = post.title;
        elements.postDate.textContent = post.publishedAt;
        elements.postTagSpan.textContent = post.category;

        // Cover Image
        if (post.thumbnail || post.detailImage) {
            elements.postCover.src = post.thumbnail || post.detailImage;
            elements.postCover.alt = post.title;
            elements.postCoverWrapper.classList.remove('d-none');
        } else {
            elements.postCoverWrapper.classList.add('d-none');
        }

        // Render Clean Content
        // Ensure image links inside content point to local files correctly
        let bodyHtml = post.contentHtml || '';
        // If contentHtml has '../images/' or remote URL, normalize
        bodyHtml = bodyHtml.replace(/https?:\/\/[^\/]*ronshop[^\/]*\/Content\/images\/blogs\//gi, 'images/');
        bodyHtml = bodyHtml.replace(/\.\.\/images\//gi, 'images/');

        elements.postContent.innerHTML = bodyHtml;

        // Add Lightbox to all images in content
        elements.postContent.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => {
                openLightbox(img.src, img.alt || post.title);
            });
        });

        // Render Related Posts
        renderRelatedPosts(post);
    }

    /**
     * Render Related Posts at bottom of article
     */
    function renderRelatedPosts(currentPost) {
        if (!elements.relatedGrid) return;
        const related = state.posts
            .filter(p => p.slug !== currentPost.slug)
            .slice(0, 3);

        elements.relatedGrid.innerHTML = related.map(p => `
            <a href="#/post/${p.slug}" class="post-card">
                <div class="card-thumb-wrap">
                    <img src="${p.thumbnail}" alt="${escapeHtml(p.title)}" class="card-thumb" loading="lazy">
                    <span class="card-badge">${escapeHtml(p.category)}</span>
                </div>
                <div class="card-body">
                    <div class="card-meta">
                        <span><i class="ph ph-calendar"></i> ${p.publishedAt}</span>
                    </div>
                    <h4 class="card-title" style="font-size: 1.05rem;">${escapeHtml(p.title)}</h4>
                    <div class="card-footer" style="padding-top: 0.5rem;">
                        <span>Xem bài</span>
                        <i class="ph ph-arrow-right"></i>
                    </div>
                </div>
            </a>
        `).join('');
    }

    /**
     * Update Reading Progress Bar
     */
    function updateReadingProgress() {
        if (elements.detailView.classList.contains('d-none')) {
            elements.readingProgress.style.width = '0%';
            return;
        }
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) {
            elements.readingProgress.style.width = '0%';
            return;
        }
        const progress = (window.scrollY / totalHeight) * 100;
        elements.readingProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    /**
     * Lightbox Modal
     */
    function openLightbox(src, caption) {
        elements.lightboxImg.src = src;
        elements.lightboxCaption.textContent = caption || '';
        elements.lightbox.classList.remove('d-none');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        elements.lightbox.classList.add('d-none');
        document.body.style.overflow = '';
    }

    /**
     * Toast Feedback
     */
    let toastTimeout = null;
    function showToast(message) {
        elements.toastMessage.textContent = message;
        elements.toast.classList.remove('d-none');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            elements.toast.classList.add('d-none');
        }, 3000);
    }

    /**
     * Utility: Escape HTML
     */
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Run app on DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
