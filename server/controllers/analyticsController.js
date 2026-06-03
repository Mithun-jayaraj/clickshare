import Url from '../models/Url.js';
import Visit from '../models/Visit.js';

/**
 * GET /api/analytics/:urlId
 * Get detailed click analytics for a specific URL
 */
export const getUrlAnalytics = async (req, res, next) => {
  try {
    const url = await Url.findOne({ _id: req.params.urlId, userId: req.user._id });
    if (!url) {
      return res.status(404).json({ success: false, message: 'URL not found or not authorized.' });
    }

    const visits = await Visit.find({ urlId: req.params.urlId }).sort({ timestamp: -1 }).limit(500);

    // Clicks over last 7 days
    const now = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const clickTrend = last7Days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = visits.filter(
        (v) => new Date(v.timestamp) >= day && new Date(v.timestamp) < nextDay
      ).length;
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: count,
      };
    });

    // Device breakdown
    const deviceCounts = visits.reduce((acc, v) => {
      acc[v.device] = (acc[v.device] || 0) + 1;
      return acc;
    }, {});
    const deviceBreakdown = Object.entries(deviceCounts).map(([name, value]) => ({ name, value }));

    // Browser breakdown
    const browserCounts = visits.reduce((acc, v) => {
      acc[v.browser] = (acc[v.browser] || 0) + 1;
      return acc;
    }, {});
    const browserBreakdown = Object.entries(browserCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Country breakdown
    const countryCounts = visits.reduce((acc, v) => {
      const c = v.country || 'Unknown';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const topCountries = Object.entries(countryCounts)
      .map(([country, clicks]) => ({ country, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 10);

    // Today clicks
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const clicksToday = visits.filter((v) => new Date(v.timestamp) >= todayStart).length;

    // This week clicks
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const clicksThisWeek = visits.filter((v) => new Date(v.timestamp) >= weekStart).length;

    res.status(200).json({
      success: true,
      analytics: {
        url: { ...url.toObject(), shortUrl: `${process.env.BASE_URL}/${url.shortCode}` },
        totalClicks: url.clickCount,
        clicksToday,
        clicksThisWeek,
        clickTrend,
        deviceBreakdown,
        browserBreakdown,
        topCountries,
        recentVisits: visits.slice(0, 20),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/analytics/overview
 * Aggregate analytics overview for the authenticated user
 */
export const getOverview = async (req, res, next) => {
  try {
    const urls = await Url.find({ userId: req.user._id });
    const urlIds = urls.map((u) => u._id);

    const totalLinks = urls.length;
    const totalClicks = urls.reduce((sum, u) => sum + u.clickCount, 0);
    const activeLinks = urls.filter((u) => u.isActive).length;
    const expiredLinks = urls.filter((u) => u.expiresAt && new Date() > u.expiresAt).length;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Aggregate visits for all user's URLs
    const visits = await Visit.find({ urlId: { $in: urlIds } });
    const clicksToday = visits.filter((v) => new Date(v.timestamp) >= todayStart).length;
    const clicksThisWeek = visits.filter((v) => new Date(v.timestamp) >= weekStart).length;

    // Country breakdown
    const countryCounts = visits.reduce((acc, v) => {
      const c = v.country || 'Unknown';
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Clicks trend (last 7 days across all URLs)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const clickTrend = last7Days.map((day) => {
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      const count = visits.filter(
        (v) => new Date(v.timestamp) >= day && new Date(v.timestamp) < nextDay
      ).length;
      return {
        date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        clicks: count,
      };
    });

    // Top URLs by click count
    const topUrls = urls
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 5)
      .map((u) => ({
        id: u._id,
        shortCode: u.shortCode,
        originalUrl: u.originalUrl,
        clickCount: u.clickCount,
        shortUrl: `${process.env.BASE_URL}/${u.shortCode}`,
      }));

    res.status(200).json({
      success: true,
      overview: {
        totalLinks,
        totalClicks,
        activeLinks,
        expiredLinks,
        clicksToday,
        clicksThisWeek,
        topCountry,
        clickTrend,
        topUrls,
      },
    });
  } catch (error) {
    next(error);
  }
};
