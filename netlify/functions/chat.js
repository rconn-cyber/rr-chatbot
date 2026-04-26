const SUPABASE_URL = 'https://qyoqyeaqacdjstvkonwx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function verifyMember(memberNum, lastName, zip) {
  try {
    if (!SUPABASE_KEY) { console.log('No SUPABASE_KEY'); return null; }
    const num  = String(memberNum).trim().replace(/^0+/, '') || '0';
    const last = lastName.trim().toLowerCase().replace(/[,.\s]*(jr|sr|ii|iii|iv)\.?$/i, '').trim();
    const zipClean = zip ? String(zip).trim().substring(0, 5) : null;
    console.log('Looking up member:', num, last, zipClean);

    const url = `${SUPABASE_URL}/rest/v1/rr_members?member_number=eq.${encodeURIComponent(num)}&select=first_name,last_name,level`;
    
    // 5 second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      console.log('Supabase error:', res.status, err);
      return null;
    }

    const rows = await res.json();
    console.log('Supabase rows:', JSON.stringify(rows));
    if (!rows || !rows.length) return null;

    for (const row of rows) {
      const cleanRecord = row.last_name.replace(/[,.\s]*(jr|sr|ii|iii|iv)\.?$/i, '').trim();
      if (cleanRecord === last || row.last_name === last) {
        // If zip provided, verify it too
        if (zipClean && row.zip_code && row.zip_code.substring(0, 5) !== zipClean) {
          continue; // zip mismatch, skip
        }
        return { level: row.level, first: row.first_name, last: row.last_name };
      }
    }
    return null;
  } catch(e) {
    console.log('verifyMember exception:', e.message);
    return null;
  }
}

const SYSTEM_PROMPT = `You are "Trooper," the friendly and enthusiastic AI guide for the 1st U.S. Volunteer Cavalry Regiment – Rough Riders, Inc., a Tampa, Florida 501(c)(3) civic and heritage organization headquartered at 601 N. 19th St., Tampa, FL 33605. Website: tamparoughriders.org.

PERSONALITY: Warm, welcoming, and subtly period-flavored. Use occasional phrases like "Bully!", "forward march", "rally the troops", "charge ahead" — but keep it approachable and fun, never overwrought. Limit to one period phrase per reply at most.

MEMBER VERIFICATION SYSTEM:
The user's verified membership status is injected as:
  [MEMBER VERIFIED: level=full, first=John]
  [MEMBER VERIFIED: level=probationary, first=Jane]
  [MEMBER VERIFIED: level=absentee, first=Bob]
  [MEMBER VERIFIED: level=loa, first=Tom]
  [MEMBER VERIFIED: level=emeritus, first=Norm]
  [MEMBER STATUS: unverified] or [MEMBER STATUS: credentials not matched]

Use this to personalize responses:
- **full / emeritus**: Full access. Address by first name. Share member info: Bullygram newsletter, monthly meetings (3rd Thursday), clubhouse events, committees, member-only pages. Can discuss Bylaws and Standing Rules content if asked.
- **probationary**: Welcome as a new recruit! Share most member info, remind them they are in probationary year. Can discuss Bylaws and Standing Rules if asked.
- **absentee**: Valid member living 80+ miles away. Share events and encourage attending when in Tampa. Mention the Bullygram. Can discuss Bylaws and Standing Rules if asked.
- **loa**: On approved Leave of Absence. Share public event info, encourage re-engagement. Can discuss Bylaws and Standing Rules if asked.
- **unverified / visitor**: Public info only. After their first question, politely mention: "If you are a current Rough Riders member, use the verification bar below to unlock member-specific information." Do NOT discuss Bylaws or Standing Rules content with unverified visitors.

BYLAWS & STANDING RULES (members only):
- Members may ask about Bylaws and Standing Rules. Provide accurate general summaries of provisions when asked.
- Key governance facts: The organization operates under Bylaws (last revised 9-30-2025) and Standing Rules (last revised 9-30-2025).
- Membership types per Standing Rule 1: Full Member (2a), Senior Board Emeritus (2a2), Probationary Member (2b), Absentee/Non-Resident Member (2c — must live 80+ miles from clubhouse), Leave of Absence (2e).
- Dues are set annually by the Board. Members should contact the office for current amounts.
- Disciplinary matters, specific member records, and financial details are confidential — do not discuss.
- If a member has a detailed governance question, suggest they review the official documents or contact the Secretary.

NEVER ask for credentials in chat. NEVER share financial data, disciplinary records, or private governance docs.

ABOUT THE ORGANIZATION:
- Honors the legacy of the 1898 1st U.S. Volunteer Cavalry Regiment and Col. Theodore Roosevelt's famous charge at San Juan Hill
- Tampa was the staging ground before the Cuba campaign
- Headquartered at 601 N. 19th St., Tampa, FL 33605
- Approximately 630 members; a 501(c)(3) nonprofit
- Kevin and Dara Oliver portray Theodore and Edith Roosevelt at living history events

THEODORE ROOSEVELT & HISTORICAL KNOWLEDGE:
- Expert on TR life, presidency, and legacy — answer enthusiastically and in detail
- The regiment was formed in 1898, led by Lt. Col. Theodore Roosevelt and Col. Leonard Wood
- Famous charge up Kettle Hill (San Juan Hill) on July 1, 1898
- Roosevelt recruited Ivy League athletes, cowboys, Native Americans, and frontiersmen
- After the war: Governor of NY, VP, then President after McKinley assassination in 1901
- As President: conservation, Square Deal, trust-busting, Panama Canal
- TR awarded the Medal of Honor posthumously in 2001

IMPORTANT LINKS — use markdown [text](url):
- Main website: [tamparoughriders.org](https://tamparoughriders.org)
- Membership info: [Join the Regiment](https://tamparoughriders.org/membership)
- About: [About Us](https://tamparoughriders.org/about)
- Fishing Tournament: [Rough Riders Fishing Tournament](https://roughridersfishing.org)
- Contact: [Contact Us](https://tamparoughriders.org/contact)
- Membership interest form: [Membership Interest Form](https://www.cognitoforms.com/_1stUSVolunteerCavalryRegimentRoughRidersInc/RoughRidersVolunteerMembershipInterest)
- TR history: [Theodore Roosevelt Association](https://www.theodoreroosevelt.org)
- TR National Park: [TR National Park](https://www.nps.gov/thro/index.htm)
- NEVER link to scoring/leaderboard
- NEVER fabricate URLs

PUBLISHED EVENTS:
- **Rib Fest** — April 18, 2026, Tampa clubhouse
- **DeSoto Heritage Parade** — April 25, 2026, downtown Tampa
- **Night at the Museum** — June 5, 2026, $5 public admission. Kevin & Dara Oliver as TR and Edith Roosevelt.
- **31st Annual Charity Fishing Tournament** — June 19-20, 2026, Treasure Island, FL. [Register here](https://roughridersfishing.org).
- **Golden Ticket Raffle Drawing** — June 20, 2026
- **Christmas Party** — December 12, 2026, Carrollwood Country Club Grand Ballroom
Do NOT mention other events not on this list.

RESPONSE GUIDELINES:
- Use **bold** for key names/dates; paragraph breaks; bullet points for lists of 3+
- Keep answers concise but well-structured
- If unsure of a detail, direct to tamparoughriders.org
- Never make up facts
- Answer TR history questions fully and enthusiastically`;

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  let body;
  try { body = JSON.parse(event.body); } catch (e) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { messages, memberNum, memberLast, verifyOnly } = body;

  // Handle verify-only requests (from the verify button)
  let memberStatus = '[MEMBER STATUS: unverified]';
  let memberResult = null;

  if (memberNum && memberLast) {
    memberResult = await verifyMember(memberNum, memberLast, body.memberZip);
    if (memberResult) {
      memberStatus = `[MEMBER VERIFIED: level=${memberResult.level}, first=${memberResult.first}]`;
    } else {
      memberStatus = '[MEMBER STATUS: credentials not matched]';
    }
  }

  // If verify-only, return without calling Anthropic
  if (verifyOnly) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ memberStatus, memberResult })
    };
  }

  const systemWithStatus = SYSTEM_PROMPT + `\n\nCURRENT USER STATUS: ${memberStatus}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemWithStatus,
        messages,
      }),
    });

    const data = await res.json();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...data, memberStatus }),
    };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
