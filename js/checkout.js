// ============================================================
// CHECKOUT LOGIC (اصلاح‌شده)
// ============================================================
const orderSummary = document.getElementById('orderSummary');
const termsCheck = document.getElementById('termsCheck');
const proceedBtn = document.getElementById('proceedBtn');
const termsError = document.getElementById('termsError');

function getCheckoutItems() {
    // ۱. از sessionStorage (برای خرید مستقیم)
    const stored = sessionStorage.getItem('checkoutAccount');
    if (stored) {
        try {
            const account = JSON.parse(stored);
            // پاک کردن sessionStorage بعد از خواندن
            sessionStorage.removeItem('checkoutAccount');
            return [account];
        } catch (e) {
            console.warn('خطا در خواندن sessionStorage', e);
        }
    }

    // ۲. از URL (اگر ID در URL باشد)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
        // از allAccounts (که در main.js تعریف شده) استفاده کن
        if (typeof allAccounts !== 'undefined' && allAccounts.length > 0) {
            const account = allAccounts.find(a => a.id === id);
            if (account) return [account];
        }
        // اگر allAccounts در دسترس نبود، از fallback استفاده کن
        const fallback = getAccountFromFallback(id);
        if (fallback) return [fallback];
    }

    // ۳. اگر هیچ‌کدام نبود، خالی برگردان
    return [];
}

function getAccountFromFallback(id) {
    const fallbackData = [
        { id: "AK-001", title: "اکانت ۱", price: 2500000, mythic: 4, legendary: 16, legendarySkins: "اسکین‌های خاص و ارزشمند", cp: -7500, images: ["assets/images/accounts/1.jpg", "assets/images/accounts/1-2.jpg"] },
        { id: "AK-002", title: "اکانت ۲", price: 1800000, mythic: 1, legendary: 6, legendarySkins: 1, images: ["assets/images/accounts/2.jpg", "assets/images/accounts/2-2.jpg"] },
        { id: "AK-003", title: "اکانت ۳", price: 3800000, witchWarden: true, legendarySkins: 1, images: ["assets/images/accounts/3.jpg", "assets/images/accounts/3-2.jpg"] },
        { id: "AK-004", title: "اکانت ۴", price: 950000, mythic: 1, legendary: 5, images: ["assets/images/accounts/4.jpg", "assets/images/accounts/4-2.jpg"] },
        { id: "AK-005", title: "اکانت ۵", price: 2900000, mythic: 1, legendary: 2, legendarySkins: 2, images: ["assets/images/accounts/5.jpg", "assets/images/accounts/5-2.jpg"] },
        { id: "AK-006", title: "اکانت ۶", price: 4500000, mythic: 6, legendary: 10, mythicSkins: 1, images: ["assets/images/accounts/6.jpg", "assets/images/accounts/6-2.jpg", "assets/images/accounts/6-3.jpg"] }
    ];
    return fallbackData.find(a => a.id === id);
}

function renderOrderSummary() {
    const items = getCheckoutItems();
    if (!items || items.length === 0) {
        orderSummary.innerHTML = `
            <div class="empty-order">
                <p>هیچ اکانتی انتخاب نشده است.</p>
                <a href="index.html#accounts-target" class="btn btn-outline">مشاهده اکانت‌ها</a>
            </div>
        `;
        return;
    }

    let html = `<h3>خلاصه سفارش</h3><div class="order-items">`;
    let total = 0;
    items.forEach(item => {
        const price = item.price || 0;
        total += price;
        const img = item.image || (item.images && item.images[0]) || 'assets/images/accounts/placeholder.webp';
        html += `
            <div class="order-item">
                <img src="${img}" alt="${item.title}" />
                <div class="order-item-info">
                    <div class="order-item-id">${item.id}</div>
                    <div class="order-item-title">${item.title}</div>
                    <div class="order-item-price">${price.toLocaleString()} تومان</div>
                </div>
            </div>
        `;
    });
    html += `</div>`;
    html += `
        <div class="order-total">
            <span>مبلغ نهایی:</span>
            <span class="total-amount">${total.toLocaleString()} تومان</span>
        </div>
    `;
    orderSummary.innerHTML = html;

    // ذخیره در sessionStorage برای صفحه payment
    sessionStorage.setItem('checkoutItems', JSON.stringify(items));
    sessionStorage.setItem('checkoutTotal', total);
}

// مدیریت چک‌باکس
termsCheck.addEventListener('change', function() {
    proceedBtn.disabled = !this.checked;
    if (this.checked) {
        termsError.classList.remove('show');
    }
});

proceedBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (!termsCheck.checked) {
        termsError.classList.add('show');
        termsError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }
    window.location.href = 'payment.html';
});

document.addEventListener('DOMContentLoaded', function() {
    renderOrderSummary();
    // در صورت وجود تابع updateCartBadge (برای نمایش تعداد سبد) 
    if (typeof updateCartBadge === 'function') {
        updateCartBadge();
    }
});