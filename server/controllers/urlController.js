import Url from '../models/Url.js';
import Visit from '../models/Visit.js';
import { generateShortCode, detectDevice, detectBrowser } from '../utils/generateCode.js';

const getCleanBaseUrl = () => {
  return (process.env.BASE_URL || '').trim().replace(/\/+$/, '');
};

/**
 * GET /api/urls
 */
export const getUrls = async (req, res, next) => {
  try {
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: urls.length, urls });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/urls
 */
export const createUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Original URL is required.' });
    }
    try { new URL(originalUrl); } catch {
      return res.status(400).json({ success: false, message: 'Please provide a valid URL (include http:// or https://).' });
    }

    let shortCode;
    if (customAlias) {
      const alias = customAlias.trim().toLowerCase();
      if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
        return res.status(400).json({ success: false, message: 'Custom alias can only contain letters, numbers, hyphens, and underscores.' });
      }
      if (alias.length < 3 || alias.length > 30) {
        return res.status(400).json({ success: false, message: 'Custom alias must be 3–30 characters.' });
      }
      const existing = await Url.findOne({ shortCode: alias });
      if (existing) {
        return res.status(409).json({ success: false, message: 'This custom alias is already taken.' });
      }
      shortCode = alias;
    } else {
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) throw new Error('Could not generate a unique short code. Please try again.');
      } while (await Url.findOne({ shortCode }));
    }

    const url = await Url.create({
      userId: req.user._id,
      originalUrl,
      shortCode,
      customAlias: customAlias ? customAlias.trim().toLowerCase() : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Short URL created successfully.',
      url: {
        ...url.toObject(),
        shortUrl: `${getCleanBaseUrl()}/${url.shortCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/urls/:id
 */
export const deleteUrl = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or not authorized.' });
    }
    await Url.findByIdAndDelete(req.params.id);
    await Visit.deleteMany({ urlId: req.params.id });
    res.status(200).json({ success: true, message: 'URL deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/urls/:id
 */
export const updateUrl = async (req, res, next) => {
  try {
    const { originalUrl, expiresAt, isActive } = req.body;
    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or not authorized.' });
    }
    if (originalUrl) {
      try { new URL(originalUrl); } catch {
        return res.status(400).json({ success: false, message: 'Please provide a valid URL.' });
      }
      url.originalUrl = originalUrl;
    }
    if (expiresAt !== undefined) url.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (typeof isActive === 'boolean') url.isActive = isActive;
    await url.save();
    res.status(200).json({
      success: true,
      message: 'URL updated successfully.',
      url: { ...url.toObject(), shortUrl: `${getCleanBaseUrl()}/${url.shortCode}` },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /:shortCode — Public redirect
 */
export const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Guard against common crawlers hitting reserved paths
    const RESERVED = ['favicon.ico', 'robots.txt', 'sitemap.xml', 'apple-touch-icon.png'];
    if (RESERVED.includes(shortCode)) {
      return res.status(404).json({ success: false, message: 'Not found.' });
    }

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found.' });
    }
    if (!url.isActive) {
      const expiredRedirect = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
      return res.redirect(`${expiredRedirect}/expired`);
    }
    if (url.expiresAt && new Date() > url.expiresAt) {
      await Url.findByIdAndUpdate(url._id, { isActive: false });
      const expiredRedirect = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
      return res.redirect(`${expiredRedirect}/expired`);
    }

    // Log visit asynchronously — don't await so redirect is instant
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

    Visit.create({
      urlId: url._id,
      ip,
      userAgent,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      country: req.headers['cf-ipcountry'] || 'Unknown',
    }).catch((err) => console.error('[Visit log error]', err.message));

    Url.findByIdAndUpdate(url._id, { $inc: { clickCount: 1 } }).catch((err) =>
      console.error('[Click count error]', err.message)
    );

    return res.redirect(302, url.originalUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/urls/bulk — Bulk create short URLs
 */
export const bulkCreateUrls = async (req, res, next) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ success: false, message: 'Request body must contain a "urls" array.' });
    }
    if (urls.length === 0) {
      return res.status(400).json({ success: false, message: 'URL array cannot be empty.' });
    }
    if (urls.length > 100) {
      return res.status(400).json({ success: false, message: 'Bulk upload is limited to 100 URLs per request.' });
    }

    const results = [];
    // Track shortcodes used in this batch to avoid duplicates within the request
    const usedInBatch = new Set();

    for (const item of urls) {
      const { originalUrl, customAlias, expiresAt } = item || {};

      // Validate presence
      if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.trim()) {
        results.push({ originalUrl: originalUrl || '', success: false, message: 'Destination URL is required.' });
        continue;
      }

      // Validate URL format
      try { new URL(originalUrl.trim()); } catch {
        results.push({ originalUrl, success: false, message: 'Invalid URL (must include http:// or https://).' });
        continue;
      }

      let shortCode;

      if (customAlias) {
        const alias = customAlias.trim().toLowerCase();
        if (!/^[a-zA-Z0-9_-]+$/.test(alias)) {
          results.push({ originalUrl, customAlias, success: false, message: 'Alias: only letters, numbers, hyphens, underscores allowed.' });
          continue;
        }
        if (alias.length < 3 || alias.length > 30) {
          results.push({ originalUrl, customAlias, success: false, message: 'Alias must be 3–30 characters.' });
          continue;
        }
        if (usedInBatch.has(alias) || await Url.findOne({ shortCode: alias })) {
          results.push({ originalUrl, customAlias, success: false, message: 'Custom alias is already taken.' });
          continue;
        }
        shortCode = alias;
      } else {
        let attempts = 0;
        let unique = false;
        do {
          shortCode = generateShortCode();
          attempts++;
          if (!usedInBatch.has(shortCode) && !(await Url.findOne({ shortCode }))) {
            unique = true;
          }
        } while (!unique && attempts < 10);

        if (!unique) {
          results.push({ originalUrl, success: false, message: 'Could not generate unique short code. Please retry.' });
          continue;
        }
      }

      // Validate expiry
      let parsedExpiry = null;
      if (expiresAt) {
        const d = new Date(expiresAt);
        if (isNaN(d.getTime()) || d <= new Date()) {
          results.push({ originalUrl, customAlias, success: false, message: 'Expiry date must be a valid future date.' });
          continue;
        }
        parsedExpiry = d;
      }

      // Create
      try {
        usedInBatch.add(shortCode);
        const created = await Url.create({
          userId: req.user._id,
          originalUrl: originalUrl.trim(),
          shortCode,
          customAlias: customAlias ? customAlias.trim().toLowerCase() : null,
          expiresAt: parsedExpiry,
        });
        results.push({
          originalUrl,
          customAlias,
          success: true,
          shortCode: created.shortCode,
          shortUrl: `${getCleanBaseUrl()}/${created.shortCode}`,
        });
      } catch (err) {
        results.push({ originalUrl, customAlias, success: false, message: err.message || 'Database error.' });
      }
    }

    res.status(200).json({
      success: true,
      total: results.length,
      succeeded: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    });
  } catch (error) {
    next(error);
  }
};
