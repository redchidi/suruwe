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

    // If a reference image is provided, use GPT-4o image generation
    if (referenceImage) {
      return await generateWithReference(prompt.trim(), referenceImage);
    }

    // Otherwise use DALL-E 3 for text-only generation
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
  const enhancedPrompt = `You are a fashion design assistant. The user has provided a reference image (it could be a fabric swatch, a style they like, or an existing garment). Based on this reference image and their description, generate a new fashion design reference image suitable for a tailor.

User's description: ${prompt}

Generate a clear, full-view image of the described garment on a clean background. Use the reference image to inform the style, pattern, fabric, or silhouette as appropriate.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: enhancedPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${referenceImageB64}`,
                detail: 'low',
              },
            },
          ],
        },
      ],
      modalities: ['text', 'image'],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('OpenAI GPT-4o error:', err);

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
  
  // GPT-4o returns images in the content array
  const imageContent = data.choices?.[0]?.message?.content;
  
  if (Array.isArray(imageContent)) {
    const imageBlock = imageContent.find((block: any) => block.type === 'image_url');
    if (imageBlock?.image_url?.url) {
      // Extract base64 from data URL
      const b64Match = imageBlock.image_url.url.match(/base64,(.+)/);
      if (b64Match) {
        return NextResponse.json({
          image: b64Match[1],
          revised_prompt: null,
        });
      }
    }
  }

  // Fallback: check if there's a different response format
  console.error('Unexpected GPT-4o response structure:', JSON.stringify(data).slice(0, 500));
  return NextResponse.json(
    { error: 'No image was returned. Please try again.' },
    { status: 502 }
  );
}
