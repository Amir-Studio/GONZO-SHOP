// ============================================================
// GONZO SHOP — Cloudflare Worker (مدیریت محتوای سایت)
// ============================================================

// ============================================================
// تنظیمات پایه
// ============================================================
const REPO_OWNER = 'Amir-Studio';
const REPO_NAME = 'GONZO-SHOP';
const BRANCH = 'main';

// ============================================================
// توابع کمکی برای GitHub API
// ============================================================

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
    // ۱. دریافت SHA فایل فعلی (برای به‌روزرسانی)
    const existing = await getFileContent(path, token);
    const sha = existing ? existing.sha : null;
    
    // ۲. ارسال درخواست به‌روزرسانی/ایجاد
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`;
    const body = {
        message: commitMessage || `Update ${path}`,
        content: btoa(unescape(encodeURIComponent(content))),
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
    // محتوای فایل Base64 است
    const content = data.content;
    return decodeURIComponent(escape(atob(content)));
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

async function handleUpdateAccounts(body, token) {
    try {
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
        // استخراج CONFIG از محتوای فایل
        const configMatch = content.match(/const CONFIG = ({[\s\S]*?});/);
        if (!configMatch) {
            return errorResponse('CONFIG not found in config.js', 500);
        }
        // استفاده از Function به جای eval برای امنیت بیشتر
        const config = new Function('return ' + configMatch[1])();
        return successResponse(config);
    } catch (e) {
        return errorResponse(e.message);
    }
}

async function handleUpdateConfig(body, token) {
    try {
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
        // دریافت توکن از environment
        const token = env.GITHUB_TOKEN;
        if (!token) {
            return errorResponse('GITHUB_TOKEN secret is not set in Cloudflare Worker', 500);
        }

        // مدیریت CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders() });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
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
                return await handleUpdateAccounts(body, token);
            }

            // ===== GET /api/config =====
            if (path === '/api/config' && request.method === 'GET') {
                return await handleGetConfig(token);
            }

            // ===== PUT /api/config =====
            if (path === '/api/config' && request.method === 'PUT') {
                const body = await request.json();
                return await handleUpdateConfig(body, token);
            }

            // ===== 404 =====
            return errorResponse(`Endpoint ${path} not found`, 404);

        } catch (error) {
            console.error('Worker error:', error);
            return errorResponse(error.message || 'Internal server error');
        }
    }
};