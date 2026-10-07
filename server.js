const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, 'public');
const fileEnv = loadEnvFile();
const PORT = Number(process.env.PORT || fileEnv.PORT || 3000);
const API_KEY = process.env.FACTCHAT_API_KEY || fileEnv.FACTCHAT_API_KEY;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || fileEnv.ALLOWED_ORIGIN;
const FACTCHAT_ENDPOINT = 'https://factchat-cloud.mindlogic.ai/v1/gateway/chatbots/51559/chat/completions';

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return {};

  return Object.fromEntries(
    fs.readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line.trim() && !line.trim().startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=');
        if (separator < 0) return [line.trim(), ''];
        const key = line.slice(0, separator).trim();
        const value = line.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2');
        return [key, value];
      })
  );
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.setEncoding('utf8');

    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error('요청이 너무 큽니다.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        reject(new Error('올바른 JSON 요청이 아닙니다.'));
      }
    });
    request.on('error', reject);
  });
}

function getContent(responseBody) {
  const content = responseBody?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((part) => part?.text || '').join('');
  }
  return '';
}

async function handleChat(request, response) {
  if (!API_KEY) {
    return sendJson(response, 503, {
      error: '아직 대화 서버 연결이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
    });
  }

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    return sendJson(response, 400, { error: error.message });
  }

  const messages = Array.isArray(body.messages)
    ? body.messages.filter(
        (message) =>
          message &&
          ['user', 'assistant'].includes(message.role) &&
          typeof message.content === 'string' &&
          message.content.trim()
      )
    : [];

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return sendJson(response, 400, { error: '사용자 메시지가 필요합니다.' });
  }

  try {
    const apiResponse = await fetch(FACTCHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'chatbot',
        messages,
      }),
      signal: AbortSignal.timeout(80000),
    });

    const rawText = await apiResponse.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { error: rawText || 'API가 올바른 JSON을 반환하지 않았습니다.' };
    }

    if (!apiResponse.ok) {
      const detail = typeof data.error === 'string' ? data.error : data.error?.message;
      return sendJson(response, apiResponse.status, {
        error: detail || `Mindlogic API 요청 실패 (${apiResponse.status})`,
      });
    }

    const content = getContent(data);
    if (!content) {
      return sendJson(response, 502, { error: 'API 응답에서 답변 내용을 찾지 못했습니다.' });
    }

    return sendJson(response, 200, { content });
  } catch (error) {
    return sendJson(response, 502, {
      error: 'Mindlogic API에 연결하지 못했습니다. 네트워크 또는 API 설정을 확인하세요.',
    });
  }
}

function serveStatic(request, response) {
  const requestedPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = path.resolve(PUBLIC_DIR, `.${requestedPath}`);

  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    return sendJson(response, 404, { error: 'Not found' });
  }

  fs.readFile(filePath, (error, file) => {
    if (error) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return response.end('페이지를 찾을 수 없습니다.');
    }

    const extension = path.extname(filePath);
    const contentTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
    };
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    response.end(file);
  });
}

const server = http.createServer((request, response) => {
  if (ALLOWED_ORIGIN && request.headers.origin === ALLOWED_ORIGIN) {
    response.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS' && request.url === '/api/chat') {
    response.writeHead(204);
    return response.end();
  }
  if (request.method === 'GET' && request.url === '/api/health') {
    return sendJson(response, 200, { ready: Boolean(API_KEY) });
  }
  if (request.method === 'POST' && request.url === '/api/chat') {
    return handleChat(request, response);
  }

  if (request.method === 'GET') {
    return serveStatic(request, response);
  }

  sendJson(response, 405, { error: '허용되지 않은 요청입니다.' });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`테스트 페이지: http://localhost:${PORT}`);
  });
}
module.exports = server;
