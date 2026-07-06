const axios = require("axios");

const Scan = require("../models/Scan");
const Device = require("../models/Device");
const ScanHistory = require("../models/ScanHistory");

const { normalizeUrl } = require("../utils/url.helper");

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

// =======================================================
// SAVE / UPDATE HISTORY
// =======================================================

const saveHistory = async ({
  user,
  device_id,
  scan,
  originalUrl,
  normalizedUrl,
  result,
}) => {

  const query = user
    ? {
        user: user._id,
        normalizedUrl,
      }
    : {
        device_id,
        normalizedUrl,
      };

  const history = await ScanHistory.findOne(query);

  if (history) {

    history.scan = scan._id;
    history.originalUrl = originalUrl;
    history.result = result;
    history.scanCount += 1;
    history.lastViewedAt = new Date();

    await history.save();

    return;
  }

  await ScanHistory.create({
    user: user ? user._id : null,
    device_id,
    scan: scan._id,
    originalUrl,
    normalizedUrl,
    result,
  });

};

// =======================================================
// NORMAL SCAN
// =======================================================

const scanUrl = async (req, res) => {

  try {

    const { url, device_id } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    if (!device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    // ==========================================
    // NORMALIZE URL
    // ==========================================

    const normalized = normalizeUrl(url);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    const {
      originalUrl,
      normalizedUrl,
    } = normalized;

    // ==========================================
    // DEVICE
    // ==========================================

    const device = await Device.findOne({
      device_id,
    });

    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not registered",
      });
    }

    // ==========================================
    // GUEST CREDIT CHECK
    // ==========================================

    if (!req.user) {

      if (device.freeCredits <= 0) {

        return res.status(403).json({
          success: false,
          message:
            "Free credits exhausted. Please login and purchase Premium.",
        });

      }

    }

    // ==========================================
    // CACHE LOOKUP
    // ==========================================

    const existingScan = await Scan.findOne({
      normalizedUrl,
    });

    if (existingScan) {

    const cacheExpired =
      existingScan.cacheExpiresAt <= new Date();

    // Cache still valid
    if (!cacheExpired) {

        await saveHistory({
            user: req.user,
            device_id,
            scan: existingScan,
            originalUrl,
            normalizedUrl,
            result: existingScan.result,
        });

        return res.status(200).json({

            success: true,

            cached: true,

            cacheExpired: false,

            lastScannedAt: existingScan.lastScannedAt,

            data: existingScan

        });

    }

    // Cache expired
    // Continue to VirusTotal below
}
    // ==========================================
    // VIRUSTOTAL SCAN
    // ==========================================

    const encodedUrl = Buffer.from(originalUrl).toString("base64");
    const urlId = encodedUrl.replace(/=/g, "");

    const response = await axios.get(
      `https://www.virustotal.com/api/v3/urls/${urlId}`,
      {
        headers: {
          "x-apikey": process.env.VIRUSTOTAL_API_KEY,
        },
        timeout: 15000,
      }
    );

    const stats =
      response.data.data.attributes.last_analysis_stats;

    let result = "Safe";

    if (stats.malicious > 0) {
      result = "Malicious";
    } else if (stats.suspicious > 0) {
      result = "Suspicious";
    }

    // ==========================================
    // UPSERT SCAN
    // ==========================================

   const scan = await Scan.findOneAndUpdate(

    {
        normalizedUrl
    },

    {
        originalUrl,

        normalizedUrl,

        scanId: response.data.data.id,

        result,

        stats,

        fullResponse: response.data,

        lastScannedAt: new Date(),

        cacheExpiresAt: new Date(
            Date.now() + CACHE_DURATION
        )
    },

    {
        new: true,

        upsert: true,

        setDefaultsOnInsert: true
    }

);

    // ==========================================
    // SAVE HISTORY
    // ==========================================

    await saveHistory({
      user: req.user,
      device_id,
      scan,
      originalUrl,
      normalizedUrl,
      result,
    });

    // ==========================================
    // DEDUCT GUEST CREDIT
    // ==========================================

    if (!req.user) {

    if (device.freeCredits > 0) {

        device.freeCredits -= 1;

        await device.save();

    }

}

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({

      success: true,

      cached: false,

      cacheExpired: false,

      remainingCredits: req.user
        ? null
        : device.freeCredits,
      
      lastScannedAt: scan.lastScannedAt,
      
      data: scan,

    });

  } catch (error) {

    console.log(
      error.response?.data || error.message
    );

    // ==========================================
    // VIRUSTOTAL ERRORS
    // ==========================================

    if (error.response) {

      switch (error.response.status) {

        case 401:
          return res.status(500).json({
            success: false,
            message:
              "VirusTotal API key is invalid.",
          });

        case 404:
          return res.status(404).json({
            success: false,
            message:
              "URL not found on VirusTotal.",
          });

        case 429:
          return res.status(429).json({
            success: false,
            message:
              "VirusTotal rate limit exceeded.",
          });

        default:
          return res.status(500).json({
            success: false,
            message:
              "VirusTotal request failed.",
          });

      }

    }

    return res.status(500).json({

      success: false,

      message: "Something went wrong.",

    });

  }

};

// reanalyze
const reanalyzeUrl = async (req, res) => {
  try {
    const { url, device_id } = req.body;

    if (!url || !device_id) {
      return res.status(400).json({
        success: false,
        message: "url and device_id are required",
      });
    }

    const normalized = normalizeUrl(url);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }

    const { originalUrl, normalizedUrl } = normalized;

    const encodedUrl = Buffer.from(originalUrl).toString("base64");
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

    let result = "Safe";

    if (stats.malicious > 0) {
      result = "Malicious";
    } else if (stats.suspicious > 0) {
      result = "Suspicious";
    }

    const scan = await Scan.findOneAndUpdate(
      {
        normalizedUrl,
      },
      {
        originalUrl,
        normalizedUrl,
        scanId: response.data.data.id,
        result,
        stats,
        fullResponse: response.data,
        lastScannedAt: new Date(),
        cacheExpiresAt: new Date(
          Date.now() + CACHE_DURATION
        ),
      },
      {
        new: true,
      }
    );

    await saveHistory({
      user: req.user,
      device_id,
      scan,
      originalUrl,
      normalizedUrl,
      result,
    });

    return res.status(200).json({
      success: true,
      message: "URL reanalyzed successfully.",
      data: scan,
    });

  } catch (error) {

    console.log(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Reanalysis failed.",
    });

  }
};

// history
const getHistory = async (req, res) => {
  try {

    const { device_id } = req.query;

    let query = {};

    if (req.user) {

      query.user = req.user._id;

    } else {

      if (!device_id) {
        return res.status(400).json({
          success: false,
          message: "device_id is required",
        });
      }

      query.device_id = device_id;

    }

    const history = await ScanHistory.find(query)
      .populate("scan")
      .sort({
        lastViewedAt: -1,
      });

    return res.status(200).json({
      success: true,
      total: history.length,
      data: history,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch history.",
    });

  }
};

// delete
const deleteHistory = async (req, res) => {
  try {

    const { id } = req.params;

    let query = {
      _id: id,
    };

    if (req.user) {

      query.user = req.user._id;

    } else {

      query.device_id = req.query.device_id;

    }

    const history = await ScanHistory.findOne(query);

    if (!history) {

      return res.status(404).json({
        success: false,
        message: "History not found.",
      });

    }

    await history.deleteOne();

    return res.status(200).json({
      success: true,
      message: "History deleted successfully.",
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete history.",
    });

  }
};

module.exports = {
  scanUrl,
  reanalyzeUrl,
  getHistory,
  deleteHistory,
};