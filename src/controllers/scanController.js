const axios = require("axios");

const Scan = require("../models/Scan");
const Device = require("../models/Device");
const ScanHistory = require("../models/ScanHistory");
const { getImageBase64 } = require("../services/imageScan.service");
const { normalizeUrl } = require("../utils/url.helper");

// image scan
const {
  getImageBuffer,
} = require("../services/awsImage.service");
const {
  getImageSignedUrl,
} = require("../services/s3SignedUrl.service");
const {
  scanImage: scanImageAI,
} = require("../services/openaiVision.service");

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours
const { canScan, consumeCredit } = require("../helpers/subscription.helper");

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
    const { url } = req.body;
    const device_id = req.headers["x-device-id"];
    // ==========================================
    // VALIDATION
    // ==========================================

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    if (!req.user && !device_id) {
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

    const { originalUrl, normalizedUrl } = normalized;

    // ==========================================
    // DEVICE
    // ==========================================

    let device = null;

    if (device_id) {
      device = await Device.findOne({
        device_id,
      });

      if (!req.user && !device) {
        return res.status(404).json({
          success: false,
          message: "Device not registered",
        });
      }

      // if (!device) {
      //   return res.status(404).json({
      //     success: false,
      //     message: "Device not registered",
      //   });
      // }
    }
    if (!canScan(req.user, device)) {
      return res.status(403).json({
        success: false,
        message: "No credits remaining.",
      });
    }
    // ==========================================
    // GUEST CREDIT CHECK
    // ==========================================

    // if (!req.user) {

    //   if (device.freeCredits <= 0) {

    //     return res.status(403).json({
    //       success: false,
    //       message:
    //         "Free credits exhausted. Please login and purchase Premium.",
    //     });

    //   }

    // }

    // ==========================================
    // CACHE LOOKUP
    // ==========================================

    const existingScan = await Scan.findOne({
      normalizedUrl,
    });

    if (existingScan) {
      const cacheExpired = existingScan.cacheExpiresAt <= new Date();

      // Cache still valid
      if (!cacheExpired) {
        const account = await consumeCredit(req.user, device);
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

          data: existingScan,
          account,
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
      },
    );

    const stats = response.data.data.attributes.last_analysis_stats;

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

        cacheExpiresAt: new Date(Date.now() + CACHE_DURATION),
      },

      {
        new: true,

        upsert: true,

        setDefaultsOnInsert: true,
      },
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
    const account = await consumeCredit(req.user, device);
    // ==========================================
    // DEDUCT GUEST CREDIT
    // ==========================================

    //     if (!req.user) {

    //     if (device.freeCredits > 0) {

    //         device.freeCredits -= 1;

    //         await device.save();

    //     }

    // }

    // ==========================================
    // SUCCESS RESPONSE
    // ==========================================

    return res.status(200).json({
      success: true,
      cached: false,
      cacheExpired: false,
      lastScannedAt: scan.lastScannedAt,
      data: scan,
      account,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    // ==========================================
    // VIRUSTOTAL ERRORS
    // ==========================================

    if (error.response) {
      switch (error.response.status) {
        case 401:
          return res.status(500).json({
            success: false,
            message: "VirusTotal API key is invalid.",
          });

        case 404:
          return res.status(404).json({
            success: false,
            message: "URL not found on VirusTotal.",
          });

        case 429:
          return res.status(429).json({
            success: false,
            message: "VirusTotal rate limit exceeded.",
          });

        default:
          return res.status(500).json({
            success: false,
            message: "VirusTotal request failed.",
          });
      }
    }

    return res.status(500).json({
      success: false,

      message: "Something went wrong.",
    });
  }
};

// image scan
const scanImage = async (req, res) => {
  try {

    const { imageKey } = req.body;
    const device_id = req.headers["x-device-id"];

    //------------------------------------------------
    // Validation
    //------------------------------------------------

    if (!imageKey) {
      return res.status(400).json({
        success: false,
        message: "imageKey required",
      });
    }

    if (!req.user && !device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    //------------------------------------------------
    // Device
    //------------------------------------------------

    let device = null;

    if (device_id) {

      device = await Device.findOne({
        device_id,
      });

      if (!req.user && !device) {
        return res.status(404).json({
          success: false,
          message: "Device not registered",
        });
      }

    }

    //------------------------------------------------
    // Credits
    //------------------------------------------------

    if (!canScan(req.user, device)) {
      return res.status(403).json({
        success: false,
        message: "No credits remaining.",
      });
    }

    //------------------------------------------------
    // Read Image
    //------------------------------------------------

    const imageBuffer =
      await getImageBuffer(imageKey);

    const base64 =
      imageBuffer.toString("base64");

    //------------------------------------------------
    // OpenAI Scan
    //------------------------------------------------

    const ai =
      await scanImageAI(base64);

    //------------------------------------------------
    // Save Scan
    //------------------------------------------------

    const scan =
      await Scan.create({

        originalUrl: imageKey,

        normalizedUrl: imageKey,

        imageKey,

        scanType: "image",

        result: ai.result,

        confidence: ai.confidence,

        stats: {

          harmless:
            ai.result === "Safe" ? 1 : 0,

          malicious:
            ai.result === "Malicious" ? 1 : 0,

          suspicious:
            ai.result === "Suspicious" ? 1 : 0,

          undetected: 0,

          timeout: 0,

        },

        fullResponse: ai,

        cacheExpiresAt:
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),

      });

    //------------------------------------------------
    // History
    //------------------------------------------------

    await saveHistory({

      user: req.user,

      device_id,

      scan,

      originalUrl: imageKey,

      normalizedUrl: imageKey,

      result: ai.result,

    });

    //------------------------------------------------
    // Consume Credit
    //------------------------------------------------

    const account =
      await consumeCredit(req.user, device);

    //------------------------------------------------
    // Response
    //------------------------------------------------

    return res.json({

      success: true,

      cached: false,

      cacheExpired: false,

      lastScannedAt: scan.lastScannedAt,

      data: scan,

      account,

    });

  }

  catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,

      message: "Image scan failed",

    });

  }

};

// reanalyze
const reanalyzeUrl = async (req, res) => {
  try {
    const { url } = req.body;

    const device_id = req.headers["x-device-id"];
    let device = null;

    if (device_id) {
      device = await Device.findOne({
        device_id,
      });

      if (!req.user && !device) {
        return res.status(404).json({
          success: false,
          message: "Device not registered",
        });
      }
    }

    if (!req.user && !device_id) {
      return res.status(400).json({
        success: false,
        message: "device_id is required",
      });
    }

    const normalized = normalizeUrl(url);
    if (!normalized) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL",
      });
    }
    if (!req.user && !device) {
      return res.status(404).json({
        success: false,
        message: "Device not registered",
      });
    }
    if (!canScan(req.user, device)) {
      return res.status(403).json({
        success: false,
        message: "No credits remaining.",
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
        timeout: 15000,
      },
    );

    const stats = response.data.data.attributes.last_analysis_stats;

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
        cacheExpiresAt: new Date(Date.now() + CACHE_DURATION),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    await saveHistory({
      user: req.user,
      device_id,
      scan,
      originalUrl,
      normalizedUrl,
      result,
    });
    const account = await consumeCredit(req.user, device || null);

    return res.status(200).json({
      success: true,
      message: "URL reanalyzed successfully.",
      data: scan,
      account,
    });
  } catch (error) {
    console.log(error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: "Reanalysis failed.",
    });
  }
};

// ==========================
// History (Pagination)
// ==========================
const getHistory = async (req, res) => {
  try {

    const device_id = req.headers["x-device-id"];

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

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

    //------------------------------------------------

    const total =
      await ScanHistory.countDocuments(query);

    //------------------------------------------------

    const history =
      await ScanHistory.find(query)
      // .populate("scan")
        .populate({
  path: "scan",
  select:
    "scanType result originalUrl imageKey createdAt stats",
})
        .sort({ lastViewedAt: -1 })
        .skip(skip)
        .limit(limit);
        const result = [];
for (const item of history) {
  const obj = item.toObject();

  if (
    obj.scan &&
    obj.scan.scanType === "image" &&
    obj.scan.imageKey
  ) {
    obj.scan.imagePreviewUrl = await getImageSignedUrl(obj.scan.imageKey);
  }

  result.push(obj);
}
    //------------------------------------------------

    return res.status(200).json({
      success: true,

      page,

      limit,

      total,

      totalPages: Math.ceil(total / limit),

      hasMore: page < Math.ceil(total / limit),

      data: result,
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
      const device_id = req.headers["x-device-id"];

      query.device_id = device_id;
      // query.device_id = req.query.device_id;
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

// const scanImage = async (req, res) => {
//   try {
//     const { imageKey } = req.body;

//     if (!imageKey) {
//       return res.status(400).json({
//         success: false,

//         message: "imageKey required",
//       });
//     }

//     const base64 = await getImageBase64(imageKey);

//     return res.json({
//       success: true,

//       size: base64.length,
//     });
//   } catch (err) {
//     console.log("err", err);

//     return res.status(500).json({
//       success: false,

//       message: "Unable to read image.",
//     });
//   }
// };

module.exports = {
  scanUrl,
  reanalyzeUrl,
  getHistory,
  deleteHistory,
  scanImage,
};
