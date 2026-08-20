// ============================================================
// 1. DOM REFS
// ============================================================
const hamburger = document.getElementById('hamburger');
const drawer = document.getElementById('mobileDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose = document.getElementById('drawerClose');
const categoryTabs = document.querySelectorAll('.category-tab');
const accountsGrid = document.getElementById('accountsGrid');

// ============================================================
// 2. MOBILE MENU
// ============================================================
function openDrawer() {
    drawer.classList.add('open');
    drawerOverlay.classList.add('visible');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
}
function closeDrawer() {
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('visible');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => {
    drawer.classList.contains('open') ? closeDrawer() : openDrawer();
});
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
});

// ============================================================
// 3. FETCH ACCOUNTS DATA (با پشتیبانی از localStorage)
// ============================================================
const ADMIN_CODE = 'SjziUevsI18bURv';
const STORAGE_KEY = 'gonzoShopAccounts';
const CONFIG_STORAGE_KEY = 'gonzoShopConfig';

function getStoredAccounts() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
}

function saveStoredAccounts(accounts) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

function getStoredConfig() {
    try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch (e) {}
    return null;
}

function saveStoredConfig(config) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
}

async function loadAccounts() {
    // ابتدا از localStorage
    const stored = getStoredAccounts();
    if (stored && stored.length > 0) {
        return stored;
    }
    // در غیر این صورت از فایل JSON
    try {
        const res = await fetch('data/accounts.json');
        if (!res.ok) throw new Error('Failed to load accounts');
        const data = await res.json();
        // ذخیره در localStorage برای دفعات بعد
        saveStoredAccounts(data);
        return data;
    } catch (err) {
        console.warn('Using fallback data.');
        const fallback = [
            { id: "AK-001", title: "اکانت ۱", price: 2500000, mythic: 4, legendary: 16, legendarySkins: "اسکین‌های خاص و ارزشمند", cp: -7500, images: ["assets/images/accounts/1.jpg", "assets/images/accounts/1-2.jpg"] },
            { id: "AK-002", title: "اکانت ۲", price: 1800000, mythic: 1, legendary: 6, legendarySkins: 1, images: ["assets/images/accounts/2.jpg", "assets/images/accounts/2-2.jpg"] },
            { id: "AK-003", title: "اکانت ۳", price: 3800000, witchWarden: true, legendarySkins: 1, images: ["assets/images/accounts/3.jpg", "assets/images/accounts/3-2.jpg"] },
            { id: "AK-004", title: "اکانت ۴", price: 950000, mythic: 1, legendary: 5, images: ["assets/images/accounts/4.jpg", "assets/images/accounts/4-2.jpg"] },
            { id: "AK-005", title: "اکانت ۵", price: 2900000, mythic: 1, legendary: 2, legendarySkins: 2, images: ["assets/images/accounts/5.jpg", "assets/images/accounts/5-2.jpg"] },
            { id: "AK-006", title: "اکانت ۶", price: 4500000, mythic: 6, legendary: 10, mythicSkins: 1, images: ["assets/images/accounts/6.jpg", "assets/images/accounts/6-2.jpg", "assets/images/accounts/6-3.jpg"] }
        ];
        saveStoredAccounts(fallback);
        return fallback;
    }
}

// ============================================================
// 4. RENDER ACCOUNT CARDS
// ============================================================
function renderAccounts(accounts) {
    if (!accounts || accounts.length === 0) {
        accountsGrid.innerHTML = `<p style="text-align:center;color:#666;padding:40px 0;">هیچ اکانتی موجود نیست.</p>`;
        return;
    }
    
    accountsGrid.innerHTML = accounts.map(acc => {
        const imgSrc = (acc.images && acc.images.length > 0) ? acc.images[0] : 'assets/images/accounts/placeholder.webp';
        let statsText = '';
        if (acc.mythic) statsText += `${acc.mythic} متیک`;
        if (acc.legendary) statsText += (statsText ? ' · ' : '') + `${acc.legendary} لجند`;
        if (acc.legendarySkins && typeof acc.legendarySkins === 'number') statsText += (statsText ? ' · ' : '') + `${acc.legendarySkins} اسکین لجند`;
        
        return `
            <article class="account-card" data-account-id="${acc.id}">
                <div class="account-card-image">
                    <img src="${imgSrc}" alt="${acc.title}" loading="lazy" />
                </div>
                <div class="account-card-body">
                    <span class="account-card-id">${acc.id}</span>
                    <h3 class="account-card-title">${acc.title}</h3>
                    ${statsText ? `<div class="account-card-stats">${statsText}</div>` : ''}
                    <a href="#" class="btn btn-primary">مشاهده جزئیات</a>
                </div>
            </article>
        `;
    }).join('');
    
    attachCardClickHandlers();
}

// ============================================================
// 5. FILTERING
// ============================================================
let allAccounts = [];

function filterAccounts(filter) {
    let filtered = [...allAccounts];
    if (filter === 'mythic') filtered = filtered.filter(a => a.mythic && a.mythic >= 3);
    else if (filter === 'legendary') filtered = filtered.filter(a => a.legendary && a.legendary >= 8);
    else if (filter === 'highcp') filtered = filtered.filter(a => a.cp && a.cp >= 15000);
    renderAccounts(filtered);
}

// ============================================================
// 6. INIT
// ============================================================
(async function init() {
    allAccounts = await loadAccounts();
    renderAccounts(allAccounts);

    categoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            filterAccounts(tab.dataset.filter);
        });
    });
})();

// ============================================================
// 7. ENTRY HERO → HOME TRANSITION
// ============================================================
const entryHero = document.getElementById('entry-hero');
const mainContent = document.getElementById('main-content');
const showHomeBtn = document.getElementById('showHomeBtn');
let isTransitioning = false;

if (showHomeBtn && entryHero && mainContent) {
    showHomeBtn.addEventListener('click', function(e) {
        e.preventDefault();
        if (isTransitioning) return;
        isTransitioning = true;
        entryHero.classList.add('fade-out');
        mainContent.classList.remove('hidden');
        mainContent.classList.add('showing');
        setTimeout(() => {
            mainContent.classList.add('visible');
            document.body.style.overflow = '';
        }, 550);
        setTimeout(() => {
            entryHero.style.display = 'none';
            isTransitioning = false;
        }, 700);
    });
}

// ============================================================
// 8. prefers-reduced-motion
// ============================================================
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    console.log('♿ prefers-reduced-motion فعال است.');
}

// ============================================================
// 9. ACCOUNT DETAIL MODAL
// ============================================================
const modal = document.getElementById('accountModal');
const modalClose = document.getElementById('modalClose');
const modalGallery = document.getElementById('modalGallery');
const modalInfo = document.getElementById('modalInfo');
const lightbox = document.getElementById('lightbox');
const lightboxClose = document.getElementById('lightboxClose');
const lightboxImage = document.getElementById('lightboxImage');
let isModalOpen = false;
let isLightboxOpen = false;
let lastFocusedElement = null;

function renderGallery(images) {
    if (!images || images.length === 0) {
        return '<p style="color:#666;text-align:center;padding:20px 0;">تصویری موجود نیست</p>';
    }
    const hasThree = images.length === 3;
    const galleryClass = hasThree ? 'modal-gallery has-three' : 'modal-gallery';
    return `<div class="${galleryClass}">${images.map(src => `
        <div class="gallery-item" data-src="${src}">
            <img src="${src}" alt="تصویر اکانت" loading="lazy" />
        </div>
    `).join('')}</div>`;
}

function renderInfo(account) {
    if (!account) return '';
    let html = `<span class="account-id">${account.id}</span><h3 class="account-title">${account.title}</h3><div class="specs-list">`;
    if (account.mythic) html += `<div class="spec-item"><span class="spec-label">متیک:</span><span class="spec-value">${account.mythic}</span></div>`;
    if (account.legendary) html += `<div class="spec-item"><span class="spec-label">لجند:</span><span class="spec-value">${account.legendary}</span></div>`;
    if (account.legendarySkins && typeof account.legendarySkins === 'number') html += `<div class="spec-item"><span class="spec-label">اسکین لجند:</span><span class="spec-value">${account.legendarySkins}</span></div>`;
    if (account.mythicSkins) html += `<div class="spec-item"><span class="spec-label">اسکین متیک:</span><span class="spec-value">${account.mythicSkins}</span></div>`;
    if (account.cp) html += `<div class="spec-item"><span class="spec-label">سیپی:</span><span class="spec-value">${account.cp < 0 ? `-${Math.abs(account.cp)}` : account.cp}</span></div>`;
    html += `</div>`;
    if (account.legendarySkins && typeof account.legendarySkins === 'string') html += `<div class="account-features"><span class="feature-item">${account.legendarySkins}</span></div>`;
    if (account.witchWarden) html += `<div class="account-features"><span class="feature-item">ویچ واردن</span></div>`;
    return html;
}

function openModal(account) {
    if (!account) return;
    lastFocusedElement = document.activeElement;
    modalGallery.innerHTML = renderGallery(account.images || []);
    modalInfo.innerHTML = renderInfo(account);
    
    const buyBtn = document.getElementById('buyDirectBtn');
    if (buyBtn) buyBtn.onclick = function(e) { e.stopPropagation(); closeModal(); sessionStorage.setItem('checkoutAccount', JSON.stringify(account)); window.location.href = `checkout.html?id=${account.id}`; };
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    isModalOpen = true;
    setTimeout(() => modalClose.focus(), 100);
    document.querySelectorAll('.gallery-item').forEach(item => item.addEventListener('click', function() { const src = this.dataset.src; if (src) openLightbox(src); }));
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    isModalOpen = false;
    if (lastFocusedElement) { lastFocusedElement.focus(); lastFocusedElement = null; }
}

function openLightbox(src) {
    if (!src) return;
    lightboxImage.src = src;
    lightbox.classList.add('active');
    isLightboxOpen = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => lightboxClose.focus(), 100);
}

function closeLightbox() {
    lightbox.classList.remove('active');
    isLightboxOpen = false;
    document.body.style.overflow = isModalOpen ? 'hidden' : '';
    if (isModalOpen) setTimeout(() => modalClose.focus(), 100);
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', function(e) { if (e.target === modal) closeModal(); });
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') { if (isLightboxOpen) closeLightbox(); else if (isModalOpen) closeModal(); }
});
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', function(e) { if (e.target === lightbox) closeLightbox(); });

// ============================================================
// 10. ATTACH CLICK HANDLERS
// ============================================================
function attachCardClickHandlers() {
    document.querySelectorAll('.account-card').forEach(card => {
        if (card.dataset.listener === 'true') return;
        card.dataset.listener = 'true';
        const account = allAccounts.find(a => a.id === card.dataset.accountId);
        if (!account) return;
        card.addEventListener('click', function() { openModal(account); });
        const btn = card.querySelector('.btn-primary');
        if (btn) btn.addEventListener('click', function(e) { e.stopPropagation(); openModal(account); });
    });
}

// ============================================================
// 11. HOME BANNER FADE ON SCROLL
// ============================================================
const homeBanner = document.getElementById('homeBanner');

if (homeBanner) {
    let ticking = false;
    const img = homeBanner.querySelector('.home-banner-image img');

    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                const rect = homeBanner.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const visibleRatio = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight + rect.height)));
                const opacity = Math.max(0, Math.min(1, (visibleRatio - 0.15) / 0.85));
                if (img) {
                    img.style.opacity = opacity;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// ============================================================
// 12. SCROLL TO ACCOUNTS (فروش اکانت)
// ============================================================
document.querySelectorAll('.sell-scroll, .btn-sell-mobile, .footer-nav a[href="#accounts-target"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.getElementById('accounts-target');
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ============================================================
// 13. ADMIN LOGIN
// ============================================================
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminLoginBtnMobile = document.getElementById('adminLoginBtnMobile');
const adminLoginModal = document.getElementById('adminLoginModal');
const adminLoginClose = document.getElementById('adminLoginClose');
const adminCodeInput = document.getElementById('adminCodeInput');
const adminCodeSubmit = document.getElementById('adminCodeSubmit');
const adminLoginError = document.getElementById('adminLoginError');
const adminPanel = document.getElementById('adminPanel');
const adminPanelClose = document.getElementById('adminPanelClose');

function openAdminLogin() {
    adminLoginModal.classList.add('active');
    adminCodeInput.value = '';
    adminLoginError.classList.remove('show');
    adminCodeInput.focus();
}

function closeAdminLogin() {
    adminLoginModal.classList.remove('active');
}

function openAdminPanel() {
    adminPanel.classList.add('active');
    renderAdminAccounts();
    loadAdminConfig();
    document.body.style.overflow = 'hidden';
}

function closeAdminPanel() {
    adminPanel.classList.remove('active');
    document.body.style.overflow = '';
    // بعد از بستن، داده‌ها را دوباره بارگذاری و رندر کن
    (async function() {
        allAccounts = await loadAccounts();
        renderAccounts(allAccounts);
    })();
}

if (adminLoginBtn) adminLoginBtn.addEventListener('click', openAdminLogin);
if (adminLoginBtnMobile) adminLoginBtnMobile.addEventListener('click', openAdminLogin);
if (adminLoginClose) adminLoginClose.addEventListener('click', closeAdminLogin);
if (adminPanelClose) adminPanelClose.addEventListener('click', closeAdminPanel);

// تأیید کد
adminCodeSubmit.addEventListener('click', function() {
    const code = adminCodeInput.value.trim();
    if (code === ADMIN_CODE) {
        closeAdminLogin();
        openAdminPanel();
    } else {
        adminLoginError.textContent = 'کد مدیریت اشتباه است.';
        adminLoginError.classList.add('show');
        adminCodeInput.value = '';
        adminCodeInput.focus();
    }
});

adminCodeInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        adminCodeSubmit.click();
    }
});

// بستن با Escape برای مودال‌ها
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        if (adminLoginModal.classList.contains('active')) closeAdminLogin();
        if (adminPanel.classList.contains('active')) closeAdminPanel();
    }
});

// ============================================================
// 14. ADMIN PANEL LOGIC
// ============================================================
const adminAccountsList = document.getElementById('adminAccountsList');
const adminAddAccountBtn = document.getElementById('adminAddAccountBtn');

// تنظیمات
const adminCardNumber = document.getElementById('adminCardNumber');
const adminSoroushId = document.getElementById('adminSoroushId');
const adminSaveCard = document.getElementById('adminSaveCard');
const adminSaveSoroush = document.getElementById('adminSaveSoroush');

function loadAdminConfig() {
    const config = getStoredConfig() || {};
    adminCardNumber.value = config.cardNumber || CONFIG.cardNumber || '5022 2915 2835 2154';
    adminSoroushId.value = config.adminSoroushId || CONFIG.adminSoroushId || '@ID_KYAN';
}

adminSaveCard.addEventListener('click', function() {
    const config = getStoredConfig() || {};
    config.cardNumber = adminCardNumber.value.trim();
    saveStoredConfig(config);
    // به‌روزرسانی CONFIG
    CONFIG.cardNumber = config.cardNumber;
    alert('شماره کارت ذخیره شد.');
});

adminSaveSoroush.addEventListener('click', function() {
    const config = getStoredConfig() || {};
    config.adminSoroushId = adminSoroushId.value.trim();
    saveStoredConfig(config);
    CONFIG.adminSoroushId = config.adminSoroushId;
    document.getElementById('supportAdminId').textContent = config.adminSoroushId;
    alert('آیدی سروش‌پلاس ذخیره شد.');
});

// رندر لیست اکانت‌ها در پنل
function renderAdminAccounts() {
    const accounts = getStoredAccounts() || allAccounts;
    if (!accounts || accounts.length === 0) {
        adminAccountsList.innerHTML = '<p style="color:var(--color-text-muted);padding:12px 0;">هیچ اکانتی وجود ندارد.</p>';
        return;
    }
    adminAccountsList.innerHTML = accounts.map(acc => `
        <div class="admin-account-item" data-id="${acc.id}">
            <div class="admin-account-info">
                <span class="admin-account-id">${acc.id}</span>
                <span class="admin-account-title">${acc.title}</span>
                <span class="admin-account-price">${(acc.price || 0).toLocaleString()} تومان</span>
            </div>
            <div class="admin-account-actions">
                <button class="admin-edit-btn" data-id="${acc.id}">✏️ ویرایش</button>
                <button class="admin-delete-btn" data-id="${acc.id}">🗑️ حذف</button>
            </div>
        </div>
    `).join('');

    // رویدادهای ویرایش و حذف
    document.querySelectorAll('.admin-edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            openAdminForm(id);
        });
    });

    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            if (confirm(`آیا از حذف اکانت ${id} مطمئن هستید؟`)) {
                deleteAccount(id);
            }
        });
    });
}

// حذف اکانت
function deleteAccount(id) {
    let accounts = getStoredAccounts() || allAccounts;
    accounts = accounts.filter(a => a.id !== id);
    saveStoredAccounts(accounts);
    allAccounts = accounts;
    renderAccounts(accounts);
    renderAdminAccounts();
}

// ============================================================
// 15. ADMIN ADD/EDIT FORM
// ============================================================
const adminFormOverlay = document.getElementById('adminAccountForm');
const adminFormClose = document.getElementById('adminFormClose');
const adminFormTitle = document.getElementById('adminFormTitle');
const adminFormEditId = document.getElementById('adminFormEditId');
const adminFormId = document.getElementById('adminFormId');
const adminFormTitleInput = document.getElementById('adminFormTitleInput');
const adminFormPrice = document.getElementById('adminFormPrice');
const adminFormMythic = document.getElementById('adminFormMythic');
const adminFormLegendary = document.getElementById('adminFormLegendary');
const adminFormLegendarySkins = document.getElementById('adminFormLegendarySkins');
const adminFormCp = document.getElementById('adminFormCp');
const adminFormImage1 = document.getElementById('adminFormImage1');
const adminFormImage2 = document.getElementById('adminFormImage2');
const adminFormImage3 = document.getElementById('adminFormImage3');
const adminFormSave = document.getElementById('adminFormSave');
const adminFormCancel = document.getElementById('adminFormCancel');

function openAdminForm(editId = null) {
    adminFormOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (editId) {
        adminFormTitle.textContent = 'ویرایش اکانت';
        const accounts = getStoredAccounts() || allAccounts;
        const acc = accounts.find(a => a.id === editId);
        if (acc) {
            adminFormEditId.value = acc.id;
            adminFormId.value = acc.id;
            adminFormId.disabled = true;
            adminFormTitleInput.value = acc.title || '';
            adminFormPrice.value = acc.price || '';
            adminFormMythic.value = acc.mythic || '';
            adminFormLegendary.value = acc.legendary || '';
            adminFormLegendarySkins.value = acc.legendarySkins || '';
            adminFormCp.value = acc.cp || '';
            adminFormImage1.value = (acc.images && acc.images[0]) || '';
            adminFormImage2.value = (acc.images && acc.images[1]) || '';
            adminFormImage3.value = (acc.images && acc.images[2]) || '';
        }
    } else {
        adminFormTitle.textContent = 'افزودن اکانت جدید';
        adminFormEditId.value = '';
        adminFormId.disabled = false;
        adminFormId.value = '';
        adminFormTitleInput.value = '';
        adminFormPrice.value = '';
        adminFormMythic.value = '';
        adminFormLegendary.value = '';
        adminFormLegendarySkins.value = '';
        adminFormCp.value = '';
        adminFormImage1.value = '';
        adminFormImage2.value = '';
        adminFormImage3.value = '';
    }
}

function closeAdminForm() {
    adminFormOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

adminAddAccountBtn.addEventListener('click', function() {
    openAdminForm();
});

adminFormClose.addEventListener('click', closeAdminForm);
adminFormCancel.addEventListener('click', closeAdminForm);

adminFormSave.addEventListener('click', function() {
    const id = adminFormId.value.trim();
    if (!id) {
        alert('لطفاً آیدی اکانت را وارد کنید.');
        return;
    }
    const title = adminFormTitleInput.value.trim() || 'اکانت جدید';
    const price = parseInt(adminFormPrice.value) || 0;
    const mythic = parseInt(adminFormMythic.value) || 0;
    const legendary = parseInt(adminFormLegendary.value) || 0;
    const legendarySkins = adminFormLegendarySkins.value.trim() || '';
    const cp = adminFormCp.value.trim() || '';
    const image1 = adminFormImage1.value.trim() || '';
    const image2 = adminFormImage2.value.trim() || '';
    const image3 = adminFormImage3.value.trim() || '';

    const images = [];
    if (image1) images.push(image1);
    if (image2) images.push(image2);
    if (image3) images.push(image3);

    const accountData = {
        id: id,
        title: title,
        price: price,
        mythic: mythic,
        legendary: legendary,
        images: images.length > 0 ? images : ['assets/images/accounts/placeholder.webp']
    };
    if (legendarySkins) accountData.legendarySkins = legendarySkins;
    if (cp) accountData.cp = cp;

    let accounts = getStoredAccounts() || allAccounts;
    const editId = adminFormEditId.value;
    if (editId) {
        // ویرایش
        const index = accounts.findIndex(a => a.id === editId);
        if (index !== -1) {
            // اگر آی‌دی تغییر کرده، اکانت قدیمی حذف و جدید اضافه می‌شود
            if (editId !== id) {
                accounts = accounts.filter(a => a.id !== editId);
                accounts.push(accountData);
            } else {
                accounts[index] = accountData;
            }
        }
    } else {
        // اضافه کردن جدید
        if (accounts.find(a => a.id === id)) {
            alert('این آیدی قبلاً وجود دارد!');
            return;
        }
        accounts.push(accountData);
    }

    saveStoredAccounts(accounts);
    allAccounts = accounts;
    renderAccounts(accounts);
    renderAdminAccounts();
    closeAdminForm();
});

console.log('✅ GONZO SHOP loaded.');