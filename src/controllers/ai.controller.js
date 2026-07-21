const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const Scan = require("../models/Scan");
const buildPrompt = require("../helpers/aiPrompt.helper");
const { normalizeUrl } = require("../utils/url.helper");

exports.explain = async (req, res) => {

  try {

    const { url } = req.body;

if (!url) {
  return res.status(400).json({
    success: false,
    message: "URL is required",
  });
}

const normalized = normalizeUrl(url);

if (!normalized) {
  return res.status(400).json({
    success: false,
    message: "Invalid URL",
  });
}

const { normalizedUrl } = normalized;
    console.log("normalizedUrl",normalizedUrl)
    const scan = await Scan.findOne({
      normalizedUrl,
    });
    console.log("scan",scan)
    if (!scan) {
      return res.status(404).json({
        success: false,
        message: "Please scan this URL first.",
      });
    }

    // ===========================
    // AI Cache
    // ===========================

    if (
      scan.aiExplanation &&
      scan.aiGeneratedAt &&
      scan.aiGeneratedAt >= scan.lastScannedAt
    ) {

      return res.json({
        success: true,
        cached: true,
        data: JSON.parse(scan.aiExplanation),
      });

    }

    // ===========================
    // Generate Prompt
    // ===========================

    const prompt = buildPrompt(scan);

    const completion =
      await client.chat.completions.create({

        model: "gpt-4.1-mini",

        messages: [
          {
            role: "system",
            content:
              "You are an expert cybersecurity analyst.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.2,

        response_format: {
          type: "json_object",
        },
      });

    const aiResponse =
      completion.choices[0].message.content;

    scan.aiExplanation = aiResponse;

    scan.aiGeneratedAt = new Date();

    await scan.save();

    return res.json({
      success: true,
      cached: false,
      data: JSON.parse(aiResponse),
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to generate explanation.",
    });

  }

};