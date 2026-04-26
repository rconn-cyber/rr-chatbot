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

  const { name, email, notes, timestamp } = body;

  const htmlBody = `
    <div style="font-family:Georgia,serif; max-width:600px; margin:0 auto; background:#f5efe3; border:2px solid #C9A84C; border-radius:8px; overflow:hidden;">
      <div style="background:#0d1f3c; padding:16px 20px; border-bottom:2px solid #C9A84C;">
        <h2 style="color:#C9A84C; margin:0; font-size:18px; letter-spacing:0.04em;">✉ Rough Rider Dispatch — Admin Office Message</h2>
        <p style="color:#8fa8cc; margin:4px 0 0; font-size:13px; font-style:italic;">Received ${timestamp} (Eastern)</p>
      </div>
      <div style="padding:20px;">
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <tr>
            <td style="padding:8px 12px; background:#fff; border:1px solid #d4c49a; border-radius:4px 0 0 0; font-size:11px; font-weight:bold; letter-spacing:0.08em; color:#6B1A1A; text-transform:uppercase; width:100px;">Name</td>
            <td style="padding:8px 12px; background:#fff; border:1px solid #d4c49a; font-size:15px; color:#1a1209;">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px; background:#fff; border:1px solid #d4c49a; font-size:11px; font-weight:bold; letter-spacing:0.08em; color:#6B1A1A; text-transform:uppercase;">Email</td>
            <td style="padding:8px 12px; background:#fff; border:1px solid #d4c49a; font-size:15px; color:#1a1209;"><a href="mailto:${email}" style="color:#0d1f3c;">${email}</a></td>
          </tr>
        </table>
        <div style="background:#fff; border:1px solid #d4c49a; border-radius:6px; padding:14px;">
          <div style="font-size:11px; font-weight:bold; letter-spacing:0.08em; color:#6B1A1A; text-transform:uppercase; margin-bottom:8px;">Message / Notes</div>
          <div style="font-size:15px; color:#1a1209; line-height:1.6; white-space:pre-wrap;">${notes}</div>
        </div>
        <div style="margin-top:16px; padding:10px 14px; background:#e8dfc8; border-radius:6px; font-size:13px; color:#6b5a3a; font-style:italic;">
          To reply to this visitor, email them directly at <a href="mailto:${email}" style="color:#6B1A1A;">${email}</a>
        </div>
      </div>
      <div style="background:#071428; padding:8px 20px; text-align:center; font-size:11px; color:#2e4a70; letter-spacing:0.1em; text-transform:uppercase; border-top:1px solid #1a2e50;">
        Sent via Rough Rider Dispatch · tamparoughriders.org
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
        to: ['office@tamparoughriders.org'],
        reply_to: email,
        subject: `Rough Rider Dispatch — Message from ${name}`,
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
