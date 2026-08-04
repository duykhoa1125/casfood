import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROMPT_FILE = path.join(__dirname, '../prompts/menuParserPrompt.txt');

// GET current system prompt
router.get('/prompt', (req, res) => {
  try {
    if (fs.existsSync(PROMPT_FILE)) {
      const prompt = fs.readFileSync(PROMPT_FILE, 'utf-8');
      return res.json({ success: true, prompt });
    }
    return res.json({ success: true, prompt: '' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// UPDATE system prompt
router.put('/prompt', (req, res) => {
  try {
    const { prompt } = req.body;
    fs.mkdirSync(path.dirname(PROMPT_FILE), { recursive: true });
    fs.writeFileSync(PROMPT_FILE, prompt, 'utf-8');
    return res.json({ success: true, message: 'Đã cập nhật System Prompt thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/parse-menu-ai
router.post('/', async (req, res) => {
  try {
    const { text, apiKey, provider = 'deepseek', model, customPrompt } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Văn bản thực đơn không được để trống' });
    }

    // Determine API Key from req or process.env
    const effectiveApiKey = apiKey || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;

    if (!effectiveApiKey) {
      return res.status(400).json({
        success: false,
        message: 'Chưa cài đặt API Key cho AI. Vui lòng nhập API Key trong phần Cài Đặt hoặc file .env (DEEPSEEK_API_KEY / OPENAI_API_KEY).'
      });
    }

    // Get system prompt
    let systemPrompt = customPrompt;
    if (!systemPrompt && fs.existsSync(PROMPT_FILE)) {
      systemPrompt = fs.readFileSync(PROMPT_FILE, 'utf-8');
    }
    if (!systemPrompt) {
      systemPrompt = 'Trích xuất thực đơn tiếng Việt từ văn bản sau thành định dạng JSON { categories: [{ category: string, items: [{ name: string, price: number }] }] }';
    }

    // Determine API Endpoint based on provider / model
    let endpoint = 'https://api.deepseek.com/v1/chat/completions';
    let chosenModel = model || 'deepseek-chat';

    if (provider === 'openai') {
      endpoint = 'https://api.openai.com/v1/chat/completions';
      chosenModel = model || 'gpt-4o-mini';
    } else if (provider === 'gemini') {
      endpoint = `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`;
      chosenModel = model || 'gemini-1.5-flash';
    }

    console.log(`🤖 Calling AI Parser (${provider} / ${chosenModel})...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveApiKey}`
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Hãy trích xuất thực đơn sau:\n\n${text}` }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`AI API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawAiOutput = data.choices?.[0]?.message?.content;

    if (!rawAiOutput) {
      throw new Error('AI không trả về kết quả.');
    }

    // Clean JSON markdown codeblocks if present
    const cleanJsonString = rawAiOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedObj = JSON.parse(cleanJsonString);

    // Normalize output structure
    const categories = parsedObj.categories || parsedObj.menu || [];

    // Format output with unique item IDs
    const formattedCategories = categories.map((cat, catIdx) => ({
      category: cat.category || cat.name || 'Món Ăn',
      items: (cat.items || []).map((item, itemIdx) => ({
        id: `ai_item_${Date.now()}_${catIdx}_${itemIdx}`,
        name: item.name || item.itemName || 'Món ăn',
        price: typeof item.price === 'number' ? item.price : parseInt(item.price) || 30000,
        description: item.description || '',
        options: []
      }))
    }));

    return res.json({
      success: true,
      menuData: formattedCategories,
      isMixMenu: parsedObj.isMixMenu || false,
      mixRules: parsedObj.mixRules || null,
      rawAiOutput
    });

  } catch (error) {
    console.error('AI Menu Parsing error:', error);
    res.status(500).json({ success: false, message: 'Lỗi AI phân tích: ' + error.message });
  }
});

export default router;
