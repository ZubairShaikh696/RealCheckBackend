exports.normalizeUrl = (url) => {
  try {
    let input = url.trim();

    if (!/^https?:\/\//i.test(input)) {
      input = "https://" + input;
    }

    const parsed = new URL(input);

    parsed.hostname = parsed.hostname
      .replace(/^www\./i, "")
      .toLowerCase();

    if (
      parsed.pathname.length > 1 &&
      parsed.pathname.endsWith("/")
    ) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    parsed.hash = "";

    return {
      originalUrl: url,
      normalizedUrl: parsed.toString(),
    };
  } catch (error) {
    return null;
  }
};