import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MAX_GENERATIONS_PER_ORDER = 3;

export async function POST(request: NextRequest) {
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'Image generation is not configured' },
      { status: 500 }
    );
  }

  try {
    const { prompt, generationCount, referenceImage } = await request.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please describe what you want made' },
        { status: 400 }
      );
    }

    if (prompt.trim().length > 500) {
      return NextResponse.json(
        { error: 'Description is too long. Keep it under 500 characters.' },
        { status: 400 }
      );
    }

    if (generationCount >= MAX_GENERATIONS_PER_ORDER) {
      return NextResponse.json(
        { error: 'Generation limit reached for this order' },
        { status: 429 }
      );
    }

    if (referenceImage) {
      return await generateWithReference(prompt.trim(), referenceImage);
    }

    return await generateTextOnly(prompt.trim());
  } catch (error) {
    console.error('Generate image error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

async function generateTextOnly(prompt: string) {
  const enhancedPrompt = `Fashion design reference image: ${prompt}. Show the garment on a clean background, full view, suitable as a reference image for a tailor. Professional fashion illustration style.`;

  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('OpenAI DALL-E error:', err);

    if (response.status === 400 && err?.error?.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'That description was flagged by the image generator. Try rephrasing it.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Image generation failed. Please try again.' },
      { status: 502 }
    );
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    return NextResponse.json(
      { error: 'No image was returned. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    image: b64,
    revised_prompt: data.data[0]?.revised_prompt || null,
  });
}

async function generateWithReference(prompt: string, referenceImageB64: string) {
  const enhancedPrompt = `Fashion design reference image based on the uploaded reference. ${prompt}. Create a new garment design inspired by the reference image. Show the garment on a clean background, full view, suitable as a reference image for a tailor.`;

  // Convert base64 to a Blob for the multipart form
  const imageBytes = Buffer.from(referenceImageB64, 'base64');
  const imageBlob = new Blob([imageBytes], { type: 'image/png' });

  const formData = new FormData();
  formData.append('model', 'gpt-image-1');
  formData.append('prompt', enhancedPrompt);
  formData.append('image[]', imageBlob, 'reference.png');
  formData.append('size', '1024x1024');
  formData.append('quality', 'medium');

  const response = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('OpenAI gpt-image-1 edits error:', err);

    if (err?.error?.code === 'content_policy_violation') {
      return NextResponse.json(
        { error: 'That image or description was flagged. Try a different reference or rephrase your description.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Image generation failed. Please try again.' },
      { status: 502 }
    );
  }

  const data = await response.json();
  const b64 = data.data?.[0]?.b64_json;

  if (!b64) {
    return NextResponse.json(
      { error: 'No image was returned. Please try again.' },
      { status: 502 }
    );
  }

  return NextResponse.json({
    image: b64,
    revised_prompt: null,
  });
}
