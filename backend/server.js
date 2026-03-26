import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 8081);
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const ANON_DAILY_LIMIT = Number(process.env.ANON_DAILY_LIMIT || 5);
const MIN_INTERVAL_SECONDS = Number(process.env.MIN_INTERVAL_SECONDS || 60);
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:8080';

const DATA_DIR = path.join(__dirname, 'data');
const ARCHIVE_FILE = path.join(DATA_DIR, 'archives.json');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

const app = express();
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (_req, res) => {
  res.type('text/plain; charset=utf-8');
  res.send('do-not-behind backend is running on :8081\n\nThis service only exposes /api/* endpoints.\nPlease open frontend at http://localhost:8080');
});

function getClientId(req) {
  const sessionId = req.headers['x-session-id'];
  if (typeof sessionId === 'string' && sessionId.trim()) {
    return `sid:${sessionId.trim()}`;
  }
  const xfwd = req.headers['x-forwarded-for'];
  const ip = typeof xfwd === 'string' && xfwd ? xfwd.split(',')[0].trim() : req.ip;
  return `ip:${ip || 'unknown'}`;
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function readJson(filePath, fallback) {
  try {
    const text = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

async function getUsage() {
  return readJson(USAGE_FILE, []);
}

async function setUsage(rows) {
  await writeJson(USAGE_FILE, rows);
}

async function getQuotaInfo(clientId) {
  const rows = await getUsage();
  const day = todayKey();
  const dayRows = rows.filter((r) => r.clientId === clientId && r.day === day);
  const used = dayRows.length;
  const remaining = Math.max(0, ANON_DAILY_LIMIT - used);
  const latest = dayRows.length ? dayRows[dayRows.length - 1] : null;
  const minIntervalMs = MIN_INTERVAL_SECONDS * 1000;
  const waitMs = latest ? Math.max(0, minIntervalMs - (Date.now() - new Date(latest.at).getTime())) : 0;
  return { used, remaining, limit: ANON_DAILY_LIMIT, waitMs };
}

async function assertQuota(clientId) {
  const info = await getQuotaInfo(clientId);
  if (info.remaining <= 0) {
    const err = new Error('今日免费次数已用完');
    err.code = 429;
    throw err;
  }
  if (info.waitMs > 0) {
    const sec = Math.ceil(info.waitMs / 1000);
    const err = new Error(`请求过于频繁，请 ${sec} 秒后再试`);
    err.code = 429;
    throw err;
  }
}

async function consumeQuota(clientId) {
  const rows = await getUsage();
  rows.push({ clientId, day: todayKey(), at: new Date().toISOString() });
  await setUsage(rows);
}

async function getArchives() {
  return readJson(ARCHIVE_FILE, []);
}

async function setArchives(rows) {
  await writeJson(ARCHIVE_FILE, rows);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'do-not-behind-backend' });
});

app.get('/api/ai/quota', async (req, res) => {
  const clientId = getClientId(req);
  const info = await getQuotaInfo(clientId);
  res.json(info);
});

app.post('/api/archive', async (req, res) => {
  const clientId = getClientId(req);
  const body = req.body || {};
  const archives = await getArchives();
  const row = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    clientId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...body,
  };
  archives.unshift(row);
  await setArchives(archives);
  res.status(201).json(row);
});

app.get('/api/archive', async (req, res) => {
  const clientId = getClientId(req);
  const archives = await getArchives();
  res.json(archives.filter((a) => a.clientId === clientId));
});

app.put('/api/archive/:id', async (req, res) => {
  const clientId = getClientId(req);
  const archives = await getArchives();
  const idx = archives.findIndex((a) => a.id === req.params.id && a.clientId === clientId);
  if (idx < 0) {
    res.status(404).json({ error: 'Archive not found' });
    return;
  }
  archives[idx] = { ...archives[idx], ...req.body, updatedAt: new Date().toISOString() };
  await setArchives(archives);
  res.json(archives[idx]);
});

app.delete('/api/archive/:id', async (req, res) => {
  const clientId = getClientId(req);
  const archives = await getArchives();
  const next = archives.filter((a) => !(a.id === req.params.id && a.clientId === clientId));
  await setArchives(next);
  res.json({ ok: true });
});

app.post('/api/ai/analyze', async (req, res) => {
  const clientId = getClientId(req);

  try {
    await assertQuota(clientId);
  } catch (err) {
    res.status(err.code || 400).json({ error: err.message });
    return;
  }

  if (!DEEPSEEK_API_KEY) {
    res.status(503).json({ error: '服务端未配置 DEEPSEEK_API_KEY' });
    return;
  }

  const summary = String(req.body?.summary || '');
  const rawText = String(req.body?.rawText || '');

  const systemPrompt = `你是一位精通六爻纳甲筮法的资深易学大师。请遵循：先定用神，再看旺衰动变空亡，最后给出清晰结论与应期。`;
  const userPrompt = `请根据以下信息断卦。\n\n【原始卦盘】\n${rawText}\n\n【结构化分析】\n${summary}\n\n请输出：\n1. 卦象概述\n2. 用神分析\n3. 关键爻分析\n4. 综合判断\n5. 应期\n6. 建议`;

  const upstreamResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      stream: true,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!upstreamResp.ok || !upstreamResp.body) {
    const t = await upstreamResp.text();
    res.status(502).json({ error: `上游 AI 调用失败: ${upstreamResp.status}`, detail: t.slice(0, 300) });
    return;
  }

  await consumeQuota(clientId);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = upstreamResp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data: ')) continue;
        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
          continue;
        }

        try {
          const parsed = JSON.parse(payload);
          const content = parsed?.choices?.[0]?.delta?.content || '';
          if (content) {
            res.write(`data: ${JSON.stringify({ type: 'delta', content })}\n\n`);
          }
        } catch {
          // Ignore malformed chunks
        }
      }
    }
  } catch {
    res.write(`data: ${JSON.stringify({ type: 'error', error: '流式传输中断' })}\n\n`);
  }

  const quota = await getQuotaInfo(clientId);
  res.write(`data: ${JSON.stringify({ type: 'quota', remaining: quota.remaining, limit: quota.limit })}\n\n`);
  res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
  res.end();
});

app.listen(PORT, async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  console.log(`Backend running on http://localhost:${PORT}`);
});
