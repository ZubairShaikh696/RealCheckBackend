const axios = require("axios");

const API = "https://www.virustotal.com/api/v3";

const headers = {
  "x-apikey": process.env.VIRUSTOTAL_API_KEY,
};

const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

const getUrlId = (url) =>
  Buffer.from(url)
    .toString("base64")
    .replace(/=/g, "");

async function getExistingReport(urlId) {

  const response = await axios.get(
    `${API}/urls/${urlId}`,
    {
      headers,
    }
  );

  return response.data;

}

async function submitUrl(url) {

  const response = await axios.post(
    `${API}/urls`,
    new URLSearchParams({
      url,
    }),
    {
      headers: {
        ...headers,
        "Content-Type":
          "application/x-www-form-urlencoded",
      },
    }
  );

  return response.data.data.id;

}

async function waitForAnalysis(analysisId) {

  for (let i = 0; i < 15; i++) {

    const response = await axios.get(
      `${API}/analyses/${analysisId}`,
      {
        headers,
      }
    );

    const status =
      response.data.data.attributes.status;

    console.log("VT Status:", status);

    if (status === "completed") {
      return true;
    }

    await sleep(2000);

  }

  throw new Error(
    "VirusTotal analysis timeout."
  );

}

exports.getVirusTotalReport = async (url) => {

  const urlId = getUrlId(url);

  try {

    return await getExistingReport(urlId);

  }

  catch (err) {

    if (
      err.response &&
      err.response.status === 404
    ) {

      console.log(
        "URL not found. Submitting..."
      );

      const analysisId =
        await submitUrl(url);

      await waitForAnalysis(analysisId);

      return await getExistingReport(urlId);

    }

    throw err;

  }

};