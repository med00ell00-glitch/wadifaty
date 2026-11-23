export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message) {
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

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
              parts: [{ text: message }]
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

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'وقع خطأ في الاتصال' });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'عذراً، ما قدرتش نجاوب دابا. عاود جرب مرة أخرى.';

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'مشكل تقني في السيرفر' });
  }
}
