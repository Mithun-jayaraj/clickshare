import Url from '../models/Url.js';
import Visit from '../models/Visit.js';
import { generateShortCode, detectDevice, detectBrowser } from '../utils/generateCode.js';

/**
 * GET /api/urls
 * Get all URLs for the authenticated user
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
 * Create a new short URL
 */
export const createUrl = async (req, res, next) => {
  try {
    const { originalUrl, customAlias, expiresAt } = req.body;

    if (!originalUrl) {
      return res.status(400).json({ success: false, message: 'Original URL is required.' });
    }

    // Validate URL format
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ success: false, message: 'Please provide a valid URL (include http:// or https://).' });
    }

    let shortCode;

    if (customAlias) {
      // Validate custom alias format
      if (!/^[a-zA-Z0-9_-]+$/.test(customAlias)) {
        return res.status(400).json({
          success: false,
          message: 'Custom alias can only contain letters, numbers, hyphens, and underscores.',
        });
      }
      if (customAlias.length < 3 || customAlias.length > 30) {
        return res.status(400).json({ success: false, message: 'Custom alias must be 3–30 characters.' });
      }

      const existing = await Url.findOne({ shortCode: customAlias.toLowerCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'This custom alias is already taken.' });
      }
      shortCode = customAlias.toLowerCase();
    } else {
      // Generate unique short code
      let attempts = 0;
      do {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) throw new Error('Could not generate unique short code. Please try again.');
      } while (await Url.findOne({ shortCode }));
    }

    const urlData = {
      userId: req.user._id,
      originalUrl,
      shortCode,
      customAlias: customAlias ? customAlias.toLowerCase() : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    };

    const url = await Url.create(urlData);

    res.status(201).json({
      success: true,
      message: 'Short URL created successfully.',
      url: {
        ...url.toObject(),
        shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/urls/:id
 * Delete a URL (owner only)
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
 * Update destination URL or alias
 */
export const updateUrl = async (req, res, next) => {
  try {
    const { originalUrl, expiresAt, isActive } = req.body;

    const url = await Url.findOne({ _id: req.params.id, userId: req.user._id });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or not authorized.' });
    }

    if (originalUrl) {
      try {
        new URL(originalUrl);
      } catch {
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
      url: { ...url.toObject(), shortUrl: `${process.env.BASE_URL}/${url.shortCode}` },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /:shortCode
 * Public redirect handler
 */
export const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).json({ success: false, message: 'Short URL not found.' });
    }

    if (!url.isActive) {
      return res.redirect(`${process.env.CLIENT_URL}/expired`);
    }

    if (url.expiresAt && new Date() > url.expiresAt) {
      await Url.findByIdAndUpdate(url._id, { isActive: false });
      return res.redirect(`${process.env.CLIENT_URL}/expired`);
    }

    // Log the visit
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';

    await Visit.create({
      urlId: url._id,
      ip,
      userAgent,
      device: detectDevice(userAgent),
      browser: detectBrowser(userAgent),
      country: req.headers['cf-ipcountry'] || 'Unknown',
    });

    await Url.findByIdAndUpdate(url._id, { $inc: { clickCount: 1 } });

    res.redirect(url.originalUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/urls/bulk
 * Bulk create short URLs
 */
export const bulkCreateUrls = async (req, res, next) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ success: false, message: 'An array of URLs is required.' });
    }

    if (urls.length === 0) {
      return res.status(400).json({ success: false, message: 'URL array cannot be empty.' });
    }

    if (urls.length > 100) {
      return res.status(400).json({ success: false, message: 'Bulk upload is limited to 100 URLs per request.' });
    }

    const results = [];

    for (const item of urls) {
      const { originalUrl, customAlias, expiresAt } = item;

      // 1. Validate original URL presence
      if (!originalUrl) {
        results.push({
          originalUrl: originalUrl || '',
          success: false,
          message: 'Destination URL is required.',
        });
        continue;
      }

      // 2. Validate URL format
      try {
        new URL(originalUrl);
      } catch {
        results.push({
          originalUrl,
          success: false,
          message: 'Invalid URL format (must include http:// or https://).',
        });
        continue;
      }

      // 3. Handle custom alias or code generation
      let shortCode;
      let errorOccurred = false;

      if (customAlias) {
        const trimmedAlias = customAlias.trim().toLowerCase();
        // Validate custom alias format
        if (!/^[a-zA-Z0-9_-]+$/.test(trimmedAlias)) {
          results.push({
            originalUrl,
            customAlias,
            success: false,
            message: 'Alias can only contain letters, numbers, hyphens, and underscores.',
          });
          continue;
        }
        if (trimmedAlias.length < 3 || trimmedAlias.length > 30) {
          results.push({
            originalUrl,
            customAlias,
            success: false,
            message: 'Alias must be 3–30 characters.',
          });
          continue;
        }

        // Check if alias is already taken (in db + in this batch)
        const existing = await Url.findOne({ shortCode: trimmedAlias });
        const duplicateInBatch = results.some(r => r.success && r.shortCode === trimmedAlias);

        if (existing || duplicateInBatch) {
          results.push({
            originalUrl,
            customAlias,
            success: false,
            message: 'This custom alias is already taken.',
          });
          continue;
        }
        shortCode = trimmedAlias;
      } else {
        // Generate unique short code
        let attempts = 0;
        let isUnique = false;
        do {
          shortCode = generateShortCode();
          attempts++;
          const existing = await Url.findOne({ shortCode });
          const duplicateInBatch = results.some(r => r.success && r.shortCode === shortCode);
          if (!existing && !duplicateInBatch) {
            isUnique = true;
          }
          if (attempts > 10) {
            results.push({
              originalUrl,
              success: false,
              message: 'Could not generate unique short code. Please try again.',
            });
            errorOccurred = true;
            break;
          }
        } while (!isUnique);

        if (errorOccurred) continue;
      }

      // 4. Validate expiry date if present
      let parsedExpiry = null;
      if (expiresAt) {
        const expiryDate = new Date(expiresAt);
        if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
          results.push({
            originalUrl,
            customAlias,
            success: false,
            message: 'Expiry date must be a valid future date.',
          });
          continue;
        }
        parsedExpiry = expiryDate;
      }

      // 5. Create URL
      try {
        const url = await Url.create({
          userId: req.user._id,
          originalUrl,
          shortCode,
          customAlias: customAlias ? customAlias.trim().toLowerCase() : null,
          expiresAt: parsedExpiry,
        });

        results.push({
          originalUrl,
          customAlias,
          success: true,
          shortCode: url.shortCode,
          shortUrl: `${process.env.BASE_URL}/${url.shortCode}`,
        });
      } catch (err) {
        results.push({
          originalUrl,
          customAlias,
          success: false,
          message: err.message || 'Database error during URL creation.',
        });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    next(error);
  }
};
