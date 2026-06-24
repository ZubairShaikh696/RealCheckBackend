const axios = require("axios");
const Scan = require("../models/Scan");

const scanUrl = async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const encodedUrl = Buffer.from(url).toString("base64");
    const urlId = encodedUrl.replace(/=/g, "");

    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
        },
      }
    );

    const stats =
      response.data.data.attributes.last_analysis_stats;

    let status = "Safe";

    if (stats.malicious > 0) {
      status = "Malicious";
    } else if (stats.suspicious > 0) {
      status = "Suspicious";
    }

    const savedScan = await Scan.create({
      url,
      maliciousCount: stats.malicious,
      harmlessCount: stats.harmless,
      suspiciousCount: stats.suspicious,
      status,
    });

    res.status(200).json({
      success: true,
      data: savedScan,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    res.status(500).json({
      success: false,
      message: "Scanning failed",
    });
  }
};

module.exports = {
  scanUrl,
};