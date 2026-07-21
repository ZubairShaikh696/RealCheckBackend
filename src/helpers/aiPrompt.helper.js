function buildPrompt(scan) {

  const stats = scan.stats || {};

  const engines =
    scan.fullResponse?.data?.attributes?.last_analysis_results || {};

  const maliciousEngines = Object.entries(engines)
    .filter(([_, engine]) => engine.category === "malicious")
    .map(([name, engine]) => `${name}: ${engine.result}`)
    .slice(0, 10);

  return `
You are a cybersecurity expert.

Analyze the following VirusTotal scan.

URL:
${scan.originalUrl}

Overall Result:
${scan.result}

VirusTotal Statistics

Harmless: ${stats.harmless || 0}
Malicious: ${stats.malicious || 0}
Suspicious: ${stats.suspicious || 0}
Undetected: ${stats.undetected || 0}

Malicious Engines:

${maliciousEngines.join("\n") || "None"}

Respond ONLY as JSON.

{
  "title":"",
  "summary":"",
  "riskLevel":"",
  "whyFlagged":"",
  "recommendation":""
}

Rules:

- summary maximum 120 words.
- recommendation maximum 60 words.
- Use simple English.
- Do not use markdown.
- Do not use bullet points.
- Never mention VirusTotal score numbers.
`;
}

module.exports = buildPrompt;