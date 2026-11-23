const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: 'الرسالة فارغة' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'مفتاح API غير مضبوط في Vercel' });
  }

  const systemInstruction = `
أنت المساعد الذكي الرسمي لبوابة Wadifaty.ma في المغرب.
مهمتك مساعدة المواطنين المغاربة بالدارجة المغربية المهذبة، الواضحة، والمختصرة.
تخصصاتك:
1. مباريات التوظيف العمومي والقطاع العام (توجيههم لبوابة emploi-public.ma وموقعنا).
2. التعليم، التكوين المهني، المنح، والمدارس والمعاهد (مثل men.gov.ma و ofppt.ma و tawjihi.ma).
3. الإدارة والوثائق الإدارية والمساطر (مثل watiqa.ma و idarati.ma).
4. برامج الدعم الاجتماعي والحقوق (مثل rsu.ma و asd.ma).

قواعد صارمة:
- جاوب بالدارجة المغربية المفهومة، واستعمل نقط منظمة عند الحاجة.
- اعطي دائماً الروابط الرسمية الموثوقة فقط، وما تخترعش روابط أو تواريخ مباريات غير متأكد منها.
- إذا سألك شخص عن مباراة جديدة، قليه يقلب في قائمة المباريات في الصفحة أو في الموقع الرسمي emploi-public.ma.
- خلي الجواب مفيد ومباشر بلا تطويل ممل.
`;

  const model = 'gemini-3.8-flash';
  const delays = [0, 600, 1200];
  let lastError = 'المساعد كيعرف ضغط مؤقت دابا، عاود جرب من بعد ثواني.';

  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) {
      await sleep(delays[i]);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        const reply =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          'عذراً، ما قدرتش نجاوب دابا. عاود جرب مرة أخرى.';
        return res.status(200).json({ reply });
      }

      const apiErr = data.error?.message || lastError;
      lastError = apiErr;

      const isTransientDemand =
        response.status === 503 ||
        response.status === 429 ||
        /high demand|overloaded|temporarily unavailable|try again/i.test(apiErr);

      if (!isTransientDemand) {
        return res.status(500).json({ error: apiErr });
      }
    } catch (err) {
      lastError = 'مشكل تقني مؤقت في الاتصال بالسيرفر، عاود جرب من بعد شوية.';
    }
  }

  return res.status(503).json({
    error: 'الموديل كيعرف ضغط مؤقت دابا من عند Google، عاود صيفط الرسالة من بعد شوية.'
  });
}
