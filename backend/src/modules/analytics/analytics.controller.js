import analyticsService from './analytics.service.js';

// @desc    Get analytics summary
// @route   GET /api/analytics/summary
// @access  Private (Admin/Manager)
export const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await analyticsService.getSummary(startDate, endDate);

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get SLA metrics
// @route   GET /api/analytics/sla
// @access  Private (Admin/Manager)
export const getSLAMetrics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const metrics = await analyticsService.getSLAMetrics(startDate, endDate);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user performance
// @route   GET /api/analytics/performance
// @access  Private (Admin/Manager)
export const getUserPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const performance = await analyticsService.getUserPerformance(startDate, endDate);

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get workflow trends
// @route   GET /api/analytics/trends
// @access  Private (Admin/Manager)
export const getWorkflowTrends = async (req, res, next) => {
  try {
    const { days } = req.query;
    const trends = await analyticsService.getWorkflowTrends(days ? parseInt(days) : 30);

    res.status(200).json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bottlenecks
// @route   GET /api/analytics/bottlenecks
// @access  Private (Admin/Manager)
export const getBottlenecks = async (req, res, next) => {
  try {
    const bottlenecks = await analyticsService.getBottlenecks();

    res.status(200).json({
      success: true,
      data: bottlenecks
    });
  } catch (error) {
    next(error);
  }
};

