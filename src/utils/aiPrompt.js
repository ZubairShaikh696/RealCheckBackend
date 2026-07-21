const buildPrompt = (scan) => {
  return `
You are an expert cybersecurity analyst.

Analyze the following VirusTotal report.

Rules:

- Explain in very simple English.
- Never use difficult cybersecurity terms without explanation.
- Keep response under 250 words.
- Do not mention OpenAI.
- If the URL looks safe, explain why.
- If malicious, explain exactly why.
- Mention suspicious vendors if any.

Return ONLY valid JSON.

{
  "riskLevel":"",
  "summary":"",
  "explanation":"",
  "recommendation":"",
  "confidence":""
}

VirusTotal Report:

${JSON.stringify(scan.fullResponse)}
`;
};

module.exports = buildPrompt;