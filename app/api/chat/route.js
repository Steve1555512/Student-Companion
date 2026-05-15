import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiKey: process.env.GEMINI_API_KEY
  });
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // Handle PDF file upload - send directly to Gemini
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const apiKey = process.env.GEMINI_API_KEY;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64
                  }
                },
                {
                  text: 'Please analyze these academic notes and provide: 1) A concise summary of key concepts, 2) 5 potential exam questions based on the content.'
                }
              ]
            }]
          })
        }
      );

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error(data.error?.message || "No response from model");
      }

      return NextResponse.json({ text });
    }

    // Handle regular chat question (not used anymore but kept as fallback)
    const { question } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: question }] }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return NextResponse.json({ answer: text || "No response from model" });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}