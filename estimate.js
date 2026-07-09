// Vercel serverless function — runs on the server, never in the browser.
// Keeps the Anthropic API key secret (it reads it from an environment variable).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { address } = req.body || {};
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Missing address' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY' });
  }

  const prompt = `You are estimating a rough, ballpark home value. This is for general reference only, not a formal appraisal, so it's fine to reason from general market knowledge, location, property type, and any comps you can find.

Address: ${address}

Return ONLY valid JSON, no other text, in exactly this shape:
{
  "estimated_low": <number>,
  "estimated_high": <number>,
  "note": "one short sentence on what drove this estimate"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
        // Web search lets Claude look up real listings/comps instead of guessing
        // from general knowledge alone. Remove this "tools" block if you'd
        // rather not use it (it's optional, and using it may cost slightly more).
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', errText);
      return res.status(502).json({ error: 'Estimate service unavailable. Try again shortly.' });
    }

    const data = await response.json();

    // With web search enabled, the response can contain several content
    // blocks (search steps, tool results, text). We only care about the
    // text blocks, and the final JSON answer lives inside them.
    const textBlocks = (data.content || [])
      .filter((block) => block.type === 'text')
      .map((block) => block.text);
    const combinedText = textBlocks.join('\n');

    const jsonMatch = combinedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in model output:', combinedText);
      return res.status(502).json({ error: 'Could not generate an estimate for this address.' });
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse model output:', jsonMatch[0]);
      return res.status(502).json({ error: 'Could not generate an estimate for this address.' });
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Estimate error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
