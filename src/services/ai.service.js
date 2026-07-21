const openai = require("../config/openai");
const buildPrompt = require("../utils/aiPrompt");

const generateExplanation = async (scan) => {

  const prompt = buildPrompt(scan);

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",

    messages: [
      {
        role: "system",
        content:
          "You are a cybersecurity expert.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.3,

    response_format: {
      type: "json_object",
    },
  });

  return JSON.parse(
    response.choices[0].message.content
  );
};

module.exports = {
  generateExplanation,
};