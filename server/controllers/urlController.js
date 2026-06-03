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
