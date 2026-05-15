export default async function handler(req, res) {
  const apiKey = process.env.GEMINI_API_KEY;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  );

  const data = await response.json();

  const usable = data.models
    ?.filter(m => m.supportedGenerationMethods?.includes("generateContent"))
    .map(m => m.name);

  res.json({ usable, all: data.models?.map(m => m.name) });
}