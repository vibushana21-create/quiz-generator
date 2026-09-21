export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.CREW_API_URL) {
    return res.status(500).json({
      error: 'CREW_API_URL is not configured in Vercel.'
    });
  }

  try {
    const endpoint = process.env.CREW_API_URL.endsWith('/kickoff')
      ? process.env.CREW_API_URL
      : `${process.env.CREW_API_URL}/kickoff`;

    const body = req.body;

    const payload = {
      recipient_email: body.recipient_email,
      study_material_path: body.study_material_path,
      quiz_title: body.quiz_title,
      recipient_name: body.recipient_name
    };

    const missing = Object.keys(payload).filter(
      key => !payload[key]
    );

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`
      });
    }

    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CREW_API_KEY
          ? { Authorization: `Bearer ${process.env.CREW_API_KEY}` }
          : {})
      },
      body: JSON.stringify(payload)
    });

    const text = await upstream.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.status(upstream.status).json(data);

  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Could not contact CrewAI endpoint.'
    });
  }
}
