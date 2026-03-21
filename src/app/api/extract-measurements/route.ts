import { NextRequest, NextResponse } from 'next/server';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Measurement extraction is not configured' },
      { status: 500 }
    );
  }

  try {
    const { image, mediaType } = await request.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const type = validTypes.includes(mediaType) ? mediaType : 'image/jpeg';

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-5',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: type,
                  data: image,
                },
              },
              {
                type: 'text',
                text: `You are a measurement extraction assistant for a tailoring app. 
                
Extract all body measurements from this image. The image may be a handwritten measurements sheet, a typed document, a screenshot, or a photo of a tailor's record.

Return ONLY a valid JSON object with no preamble, no markdown, no explanation. The keys must match these exact field names where the measurement is present:

Male fields: torso_length, chest, shoulder, neck, armhole, belly, back_width, nape_to_waist, sleeve, long_sleeve, bicep, wrist, outseam, waist, hips, thigh, knee, ankle, inseam, crotch_depth

Female fields: bodice_length, bust, underbust, shoulder, armhole, belly, back_width, bust_point, back_waist_length, sleeve, long_sleeve, bicep, wrist, across_front, across_back, shoulder_to_waist, shoulder_to_floor, waist, high_hip, hips, thigh, knee, ankle, inseam, crotch_depth, bottom_length

Rules:
- Only include fields where you can confidently read a numeric value
- Values must be numbers only (no units, no strings)
- If a measurement label is ambiguous, use your best judgment to map it to the closest field name
- If the unit appears to be cm, include a "unit" field with value "cm". If inches, use "inches". If unclear, omit the unit field.
- If no measurements are found, return {}

Example output:
{"chest": 42, "waist": 36, "hips": 40, "shoulder": 17, "unit": "inches"}`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', err);
      return NextResponse.json(
        { error: 'Extraction failed. Please try again.' },
        { status: 502 }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    let extracted: Record<string, number | string> = {};
    try {
      const clean = text.replace(/```json|```/g, '').trim();
      extracted = JSON.parse(clean);
    } catch {
      console.error('Failed to parse extraction result:', text);
      return NextResponse.json(
        { error: 'Could not read measurements from this image. Try a clearer photo.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ measurements: extracted });
  } catch (error) {
    console.error('Extract measurements error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
