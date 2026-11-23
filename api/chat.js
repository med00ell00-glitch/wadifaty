const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body || {};
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'الرسالة فارغة' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح API غير مضبوط في Vercel' });
  }

  const systemInstruction = `أنت المساعد الذكي الرسمي لبوابة Wadifaty.ma في المغرب.
مهمتك مساعدة المواطنين المغاربة بالدارجة المغربية المهذبة، الواضحة، والمختصرة.
تخصصاتك:
1. مباريات التوظيف العمومي والقطاع العام (ومرفقا توجيههم لبوابة emploi-public.ma).
2. التعليم، التكوين المهني، المنح، والمدارس والمعاهد (مثل men.gov.ma و ofppt.ma و tawjihi.ma).
3. الإدارة والوثائق الإدارية والمساطر (مثل watiqa.ma و idarati.ma).
- جاوب بالدارجة المغربية المفهومة، واستعمل نقط منظمة عند الحاجة.
- أعطِ دائماً الروابط الرسمية الموثوقة فقط، وما تخترعش روابط أو تواريخ مباريات غير متأكد منها.
- إذا سألك شخص عن مباراة جديدة، قلّيه يتقلب في قائمة المباريات في الصفحة أو في الموقع الرسمي emploi-public.ma.
- خلّي الجواب مفيد ومباشر بلا تطويل ممل.`;

  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const delays = [0, 600];
  let lastError = 'الخدمة مشغولة شوية دابا، عاود جرب من بعد شوية.';

  for (const model of models) {
    for (let i = 0; i < delays.length; i++) {
      if (delays[i] > 0) {
        await sleep(delays[i]);
      }

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: {
                parts: [{ text: systemInstruction }]
              },
              contents: [
                {
                  role: 'user',
                  parts: [{ text: String(message).trim() }]
                }
              ],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 600
              }
            })
          }
        );

        const data = await response.json();

        if (response.ok) {
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.status(200).json({ reply });
          }
          lastError = 'عذراً، ما قدرتش نجاوب دابا. عاود جرب مرة أخرى.';
          continue;
        }

        const apiErr = data?.error?.message || `HTTP ${response.status}`;
        lastError = apiErr;
        console.error(`Gemini error (${model}, status ${response.status}):`, apiErr);

        const isRetryable =
          response.status === 503 ||
          response.status === 429 ||
          response.status === 404 ||
          /high demand|overloaded|temporarily unavailable|try again|not found/i.test(apiErr);

        if (!isRetryable) {
          return res.status(response.status).json({ error: apiErr });
        }
      } catch (err) {
        lastError = err?.message || 'مشكل تقني مؤقت في الاتصال بالسيرفر';
        console.error(`Network error (${model}):`, lastError);
      }
    }
  }

 return res.status(503).json({
  error: lastError || 'الخدمة مشغولة شوية دابا، عاود جرب من بعد شوية.',
  details: lastError
});
}
