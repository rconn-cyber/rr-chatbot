exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }, body: '' };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Resend key not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { transcript, timestamp } = body;

  const htmlBody = `
    <div style="font-family:Georgia,serif; max-width:600px; margin:0 auto; background:#f5efe3; border:2px solid #C9A84C; border-radius:8px; overflow:hidden;">
      <div style="background:#0d1f3c; padding:16px 20px; border-bottom:2px solid #C9A84C;">
        <h2 style="color:#C9A84C; margin:0; font-size:18px; letter-spacing:0.04em;">🐎 Rough Rider Dispatch — Conversation Transcript</h2>
        <p style="color:#8fa8cc; margin:4px 0 0; font-size:13px; font-style:italic;">${timestamp} (Eastern)</p>
      </div>
      <div style="padding:20px;">
        ${transcript.split('\n\n').map(line => {
          const isVisitor = line.startsWith('VISITOR:');
          const label = isVisitor ? 'VISITOR' : 'TROOPER';
          const text  = line.replace(/^(VISITOR|TROOPER): /, '');
          return `
            <div style="margin-bottom:14px; padding:10px 14px; background:${isVisitor ? '#6B1A1A' : '#fff'}; border-radius:8px; border:1px solid #d4c49a;">
              <div style="font-size:10px; font-weight:bold; letter-spacing:0.1em; color:${isVisitor ? '#f5c87a' : '#6B1A1A'}; margin-bottom:4px;">${label}</div>
              <div style="color:${isVisitor ? '#f5ead6' : '#1a1209'}; font-size:15px; line-height:1.5;">${text}</div>
            </div>`;
        }).join('')}
      </div>
      <div style="background:#071428; padding:8px 20px; text-align:center; font-size:11px; color:#2e4a70; letter-spacing:0.1em; text-transform:uppercase; border-top:1px solid #1a2e50;">
        Est. 1898 · Tampa, Florida · tamparoughriders.org
      </div>
    </div>
  `;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Rough Rider Dispatch <office@tamparoughriders.org>',
        to: ['r.conn@tamparoughriders.org'],
        subject: `Rough Rider Dispatch — Visitor Transcript (${timestamp})`,
        html: htmlBody,
      }),
    });

    const data = await res.json();
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ success: true, id: data.id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
