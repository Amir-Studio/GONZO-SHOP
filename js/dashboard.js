// ============================================================
// DASHBOARD PAGE
// ============================================================

// ===== تنظیمات (قابل تغییر توسط صاحب سایت) =====
const SUPPORT_PHONE = '۰۹۰۲۵۱۳۱۵۰۶';
// =======================================================

document.getElementById('dashboardSupportPhone').textContent = SUPPORT_PHONE;

document.getElementById('dashboardSupportBtn').addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'tel:+989025131506';
});