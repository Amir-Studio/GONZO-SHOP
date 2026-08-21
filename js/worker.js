// ============================================================
// GONZO SHOP — Cloudflare Worker (با امنیت و احراز هویت)
// ============================================================

// ============================================================
// تنظیمات پایه
// ============================================================
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'GONZO-SHOP';
const BRANCH = 'main';

// ============================================================
// توابع کمکی برای GitHub API (با UTF-8 استاندارد)
// ============================================================

/**
 * تبدیل رشته به Base64 با UTF-8
 */
function utf8ToBase64(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = '';
    data.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}

/**
 * تبدیل Base64 به رشته با UTF-8
 */
function base64ToUtf8(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

/**
 * دریافت محتوای یک فایل از GitHub
 */
async function getFileContent(path, token) {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`;
    const response = await fetch(url, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (response.status === 404) {
        return null;
    }
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    
    return await response.json();
}

/**
 * به‌روزرسانی یا ایجاد یک فایل در GitHub
 */
async function updateFileContent(path, content, token, commitMessage) {
    const existing = await getFileContent(path, token);
    const sha = existing ? existing.sha : null;
    
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
        message: commitMessage || `Update ${path}`,
        content: utf8ToBase64(content),
        branch: BRANCH
    };
    if (sha) body.sha = sha;
    
    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error (${response.status}): ${error}`);
    }
    return await response.json();
}

/**
 * خواندن محتوای فایل به‌صورت String
 */
async function getFileContentString(path, token) {
    const data = await getFileContent(path, token);
    if (!data) return null;
    return base64ToUtf8(data.content);
}

// ============================================================
// مدیریت توکن‌های احراز هویت
// ============================================================
// ذخیره توکن‌های فعال در حافظه Worker
const activeTokens = new Map();

function generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function isValidToken(token, secret) {
    if (!token) return false;
    // بررسی وجود توکن در حافظه
    const stored = activeTokens.get(token);
    if (!stored) return false;
    // بررسی انقضا (۱ ساعت)
    if (Date.now() - stored.createdAt > 3600000) {
        activeTokens.delete(token);
        return false;
    }
    return true;
}

// ============================================================
// CORS Headers
// ============================================================

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
}

function errorResponse(message, status = 500) {
    return new Response(JSON.stringify({ success: false, error: message }), {
        status: status,
        headers: corsHeaders()
    });
}

function successResponse(data, message = 'Success') {
    return new Response(JSON.stringify({ success: true, data, message }), {
        status: 200,
        headers: corsHeaders()
    });
}

// ============================================================
// هندلرهای API
// ============================================================

async function handleAdminLogin(body, env) {
    try {
        const { code } = body;
        const secret = env.ADMIN_SECRET;
        if (!secret) {
            return errorResponse('ADMIN_SECRET not configured', 500);
        }
        if (code !== secret) {
            return errorResponse('Invalid admin code', 401);
        }
        // تولید توکن و ذخیره در حافظه
        const token = generateToken();
        activeTokens.set(token, {
            createdAt: Date.now(),
            expiresAt: Date.now() + 3600000
        });
        return successResponse({ token }, 'Login successful');
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleGetAccounts(token) {
    try {
        const content = await getFileContentString('data/accounts.json', token);
        if (!content) {
            return errorResponse('accounts.json not found', 404);
        }
        const data = JSON.parse(content);
        return successResponse(data);
    } catch (e) {
        if (e.message.includes('404')) {
            return errorResponse('accounts.json not found', 404);
        }
        return errorResponse(e.message);
    }
}

async function handleUpdateAccounts(body, token, authToken) {
    try {
        // بررسی احراز هویت
        if (!isValidToken(authToken, null)) {
            return errorResponse('Unauthorized', 401);
        }
        if (!body.data) {
            return errorResponse('Missing data field', 400);
        }
        const content = JSON.stringify(body.data, null, 2);
        await updateFileContent('data/accounts.json', content, token, 'Update accounts data via admin panel');
        return successResponse(null, 'Accounts updated successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleGetConfig(token) {
    try {
        const content = await getFileContentString('js/config.js', token);
        if (!content) {
            return errorResponse('config.js not found', 404);
        }
        const configMatch = content.match(/const CONFIG = ({[\s\S]*?});/);
        if (!configMatch) {
            return errorResponse('CONFIG not found in config.js', 500);
        }
        const config = new Function('return ' + configMatch[1])();
        return successResponse(config);
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleUpdateConfig(body, token, authToken) {
    try {
        // بررسی احراز هویت
        if (!isValidToken(authToken, null)) {
            return errorResponse('Unauthorized', 401);
        }
        if (!body.data) {
            return errorResponse('Missing data field', 400);
        }
        const config = body.data;
        const content = `// ============================================================
// CONFIG — تنظیمات قابل تغییر توسط صاحب سایت
// ============================================================
const CONFIG = ${JSON.stringify(config, null, 2)};
`;
        await updateFileContent('js/config.js', content, token, 'Update config via admin panel');
        return successResponse(null, 'Config updated successfully');
    } catch (e) {
        return errorResponse(e.message);
    }
}

// ============================================================
// Main Handler
// ============================================================

export default {
    async fetch(request, env) {
        const token = env.GITHUB_TOKEN;
        if (!token) {
            return errorResponse('GITHUB_TOKEN secret is not set in Cloudflare Worker', 500);
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // ===== POST /api/admin/login =====
            if (path === '/api/admin/login' && request.method === 'POST') {
                const body = await request.json();
                return await handleAdminLogin(body, env);
            }

            // ===== GET /api/health =====
            if (path === '/api/health' && request.method === 'GET') {
                return successResponse({
                    status: 'ok',
                    timestamp: new Date().toISOString(),
                    repository: `${REPO_OWNER}/${REPO_NAME}`,
                    branch: BRANCH
                });
            }

            // ===== GET /api/accounts =====
            if (path === '/api/accounts' && request.method === 'GET') {
                return await handleGetAccounts(token);
            }

            // ===== PUT /api/accounts =====
            if (path === '/api/accounts' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
                return await handleUpdateAccounts(body, token, authToken);
            }

            // ===== GET /api/config =====
            if (path === '/api/config' && request.method === 'GET') {
                return await handleGetConfig(token);
            }

            // ===== PUT /api/config =====
            if (path === '/api/config' && request.method === 'PUT') {
                const body = await request.json();
                const authHeader = request.headers.get('Authorization');
                const authToken = authHeader ? authHeader.replace('Bearer ', '') : null;
                return await handleUpdateConfig(body, token, authToken);
            }

            return errorResponse(`Endpoint ${path} not found`, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse(error.message || 'Internal server error');
        }
    }
};