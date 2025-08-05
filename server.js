const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.error('КРИТИЧЕСКАЯ ОШИБКА: Переменная GEMINI_API_KEY не найдена в .env файле.');
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: 'https://bespoke-pithivier-d06a85.netlify.app', 
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/generate', async (req, res) => {
  const { step0, step1, step2 } = req.body;

  if (!step0 || !step1 || !step2 || !Array.isArray(step2)) {
    return res.status(400).json({ error: 'Ошибка валидации: неполные или некорректные данные.' });
  }

  const prompt = `
    Ты — элитный бренд-стратег и провокационный копирайтер, известный своей способностью создавать новые рыночные категории. Твой стиль — острый, лаконичный, смелый и невероятно точный. Твоя задача — проанализировать данные от эксперта и предложить 3 кардинально разных, но одинаково сильных варианта мета-идеи, полностью адаптированных под его контекст.

    ### КОНТЕКСТ ЭКСПЕРТА
    - **Сфера:** ${step0.field}
    - **Целевая аудитория (ЦА):** ${step0.audience}
    - **Решаемая проблема:** ${step0.problem}

    ### ДАННЫЕ ОТ ЭКСПЕРТА
    - **Его главный "враг" в нише (что его раздражает):** "${step1.annoyance}"
    - **Его авторский метод решения проблемы:** "${step1.correctMethod}"
    - **Список того, что его клиенты ненавидят делать:** ${step2.join(', ')}.

    ### ЗАДАЧА
    Для каждого из 3-х вариантов предоставь четкую структуру:

    ### Идея: [Название идеи]
    > [Цепляющий слоган или ключевая мысль в виде цитаты]
    
    **Концепция:** Детально опиши суть идеи, ее философию.
    **Отстройка от рынка:** Объясни, как эта идея конкретно противопоставляет эксперта его "врагу" и рынку в целом.
    **Оффер для аудитории:** Сформулируй предложение для клиентов, которое напрямую решает их "нелюбимые дела".

    Отформатируй свой ответ, используя Markdown.
    ВАЖНО: После каждого из 3-х вариантов ставь разделитель в виде трех дефисов на новой строке: ---
  `;

  let retries = 3;
  while (retries > 0) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      return res.json({ ideas: text });
    } catch (error) {
      retries--;
      console.error(`Ошибка при вызове AI, осталось попыток: ${retries}. Ошибка: ${error.message}`);
      if (retries === 0) {
        return res.status(500).json({ error: 'Внутренняя ошибка сервера: Модель AI перегружена или недоступна.' });
      }
      await sleep(1000);
    }
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
