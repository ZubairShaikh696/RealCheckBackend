const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.scanImage = async (base64Image) => {

  const response = await openai.chat.completions.create({

    model: "gpt-4.1",

    messages: [
      {
        role: "system",
        content: `
You are an AI Scam Detection Engine.

Analyze this image carefully.

Return ONLY valid JSON.

{
 "result":"Safe",
 "confidence":96,
 "reason":"....",
 "riskLevel":"Low",
 "flags":[]
}

Possible result:
Safe
Suspicious
Malicious

Do not write markdown.
`
      },

      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this image."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ],

    response_format: {
      type: "json_object"
    }

  });

  return JSON.parse(
    response.choices[0].message.content
  );

};