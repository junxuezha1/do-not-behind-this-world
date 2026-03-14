/**
 * AI 接入层 — 多模型适配器 + Prompt 构建
 */

// ═══ Provider 适配器 ═══

const PROVIDERS = {
  openai: {
    name: 'OpenAI (GPT)',
    defaultBaseUrl: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
    },
    buildBody(model, systemPrompt, userMessage, stream) {
      return {
        model,
        max_tokens: 4096,
        stream,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    },
    parseStreamChunk(line) {
      if (line.startsWith('data: ')) {
        const json = line.slice(6);
        if (json === '[DONE]') return null;
        try {
          const obj = JSON.parse(json);
          return obj.choices?.[0]?.delta?.content || '';
        } catch { return ''; }
      }
      return '';
    },
  },

  claude: {
    name: 'Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-sonnet-4-20250514',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      };
    },
    buildBody(model, systemPrompt, userMessage, stream) {
      return {
        model,
        max_tokens: 4096,
        stream,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      };
    },
    parseResponse(data) {
      return data.content?.[0]?.text || '';
    },
    parseStreamChunk(line) {
      if (line.startsWith('data: ')) {
        try {
          const obj = JSON.parse(line.slice(6));
          if (obj.type === 'content_block_delta') {
            return obj.delta?.text || '';
          }
        } catch { return ''; }
      }
      return '';
    },
  },

  deepseek: {
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com/v1/chat/completions',
    defaultModel: 'deepseek-chat',
    // DeepSeek 用 OpenAI 兼容接口
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
    },
    buildBody(model, systemPrompt, userMessage, stream) {
      return {
        model,
        max_tokens: 4096,
        stream,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    },
    parseStreamChunk(line) {
      return PROVIDERS.openai.parseStreamChunk(line);
    },
  },

  custom: {
    name: '自定义 (OpenAI兼容)',
    defaultBaseUrl: '',
    defaultModel: '',
    buildHeaders(apiKey) {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
    },
    buildBody(model, systemPrompt, userMessage, stream) {
      return {
        model,
        max_tokens: 4096,
        stream,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      };
    },
    parseResponse(data) {
      return data.choices?.[0]?.message?.content || '';
    },
    parseStreamChunk(line) {
      return PROVIDERS.openai.parseStreamChunk(line);
    },
  },
};

// ═══ System Prompt ═══

function buildSystemPrompt() {
  return `你是一位精通六爻纳甲筮法的资深易学大师，具备数十年实战断卦经验。

## 你的角色
- 严格遵循京房纳甲体系进行断卦
- 以用神为核心，结合日辰月建、动变、空亡等因素综合判断
- 给出明确的吉凶判断和具体的时间应期
- 语言风格：专业严谨但通俗易懂

## 断卦原则
1. 先定用神：根据占问事项确定用神六亲
2. 看用神旺衰：月建日辰对用神的生克
3. 看动爻影响：动爻对用神的生克
4. 看特殊状态：空亡、月破、化绝、化空等
5. 综合判断：世应关系、六神含义、卦宫五行

## 应期推断原则
- 用神旺相，应在生旺之时
- 用神休囚，应在生旺之时（待旺有力时应）
- 用神入墓，应在冲墓之时
- 用神空亡，应在出空填实之时（冲空或过旬）
- 用神被合，应在冲合之时
- 用神动化进神，近应
- 用神动化退神，远应或不应

## 输出格式要求
### 一、卦象概述
简要描述卦象格局特征（卦宫、世应、动变概况）

### 二、用神分析
根据占问确定用神，分析用神旺衰、得失

### 三、关键爻分析
重点分析动爻和关键爻的作用关系

### 四、综合判断
给出明确的吉凶判断，直接回答占问

### 五、应期
推断可能的应期时间

### 六、建议
针对占问给出具体建议`;
}

function buildUserPrompt(summary, rawText) {
  return `以下是一个六爻卦盘的完整信息和规则引擎预分析结果，请根据这些信息进行专业断卦分析。

## 原始卦盘
\`\`\`
${rawText}
\`\`\`

## 结构化分析
${summary}

请按要求格式进行完整的断卦分析，重点回答占问问题，并推算应期。`;
}

// ═══ AI Manager ═══

export class AIManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem('liuguang_ai_config');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      activeProvider: 'openai',
      providers: {
        openai:   { apiKey: '', model: '', baseUrl: '' },
        claude:   { apiKey: '', model: '', baseUrl: '' },
        deepseek: { apiKey: '', model: '', baseUrl: '' },
        custom:   { apiKey: '', model: '', baseUrl: '' },
      },
    };
  }

  saveConfig() {
    localStorage.setItem('liuguang_ai_config', JSON.stringify(this.config));
  }

  setProvider(name, settings) {
    this.config.activeProvider = name;
    if (settings) {
      this.config.providers[name] = { ...this.config.providers[name], ...settings };
    }
    this.saveConfig();
  }

  getActiveProvider() {
    return this.config.activeProvider;
  }

  getProviderConfig(name) {
    return this.config.providers[name || this.config.activeProvider] || {};
  }

  /**
   * 流式调用 AI，逐步回调内容
   */
  async streamAnalyze(summary, rawText, onChunk, onDone, onError) {
    const providerName = this.config.activeProvider;
    const provider = PROVIDERS[providerName];
    const provConfig = this.config.providers[providerName];

    if (!provider) {
      onError?.('未知的 AI 提供商');
      return;
    }
    if (!provConfig.apiKey) {
      onError?.('请先在设置中配置 API Key');
      return;
    }

    const apiKey = provConfig.apiKey;
    const model = provConfig.model || provider.defaultModel;
    const baseUrl = provConfig.baseUrl || provider.defaultBaseUrl;

    if (!baseUrl) {
      onError?.('请配置 API 地址');
      return;
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(summary, rawText);

    try {
      const resp = await fetch(baseUrl, {
        method: 'POST',
        headers: provider.buildHeaders(apiKey),
        body: JSON.stringify(provider.buildBody(model, systemPrompt, userPrompt, true)),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        onError?.(`API 错误 (${resp.status}): ${errText.substring(0, 200)}`);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const chunk = provider.parseStreamChunk(trimmed);
          if (chunk === null) {
            // [DONE]
            break;
          }
          if (chunk) {
            onChunk(chunk);
          }
        }
      }

      onDone?.();
    } catch (err) {
      onError?.(`请求失败: ${err.message}`);
    }
  }

  /**
   * 非流式调用
   */
  async analyze(summary, rawText) {
    const providerName = this.config.activeProvider;
    const provider = PROVIDERS[providerName];
    const provConfig = this.config.providers[providerName];

    if (!provider || !provConfig.apiKey) {
      throw new Error('请先配置 AI 模型和 API Key');
    }

    const apiKey = provConfig.apiKey;
    const model = provConfig.model || provider.defaultModel;
    const baseUrl = provConfig.baseUrl || provider.defaultBaseUrl;

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(summary, rawText);

    const resp = await fetch(baseUrl, {
      method: 'POST',
      headers: provider.buildHeaders(apiKey),
      body: JSON.stringify(provider.buildBody(model, systemPrompt, userPrompt, false)),
    });

    if (!resp.ok) {
      throw new Error(`API 错误 (${resp.status})`);
    }

    const data = await resp.json();
    return provider.parseResponse(data);
  }
}

export { PROVIDERS };
