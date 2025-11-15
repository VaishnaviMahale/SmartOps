import taskService from './tasks.service.js';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res, next) => {
  try {
    const result = await taskService.getTasks(req.query, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      data: result.tasks,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res, next) => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve task
// @route   POST /api/tasks/:id/approve
// @access  Private
export const approveTask = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const task = await taskService.approveTask(req.params.id, req.user.id, comment);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task approved successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject task
// @route   POST /api/tasks/:id/reject
// @access  Private
export const rejectTask = async (req, res, next) => {
  try {
    const { comment } = req.body;
    const task = await taskService.rejectTask(req.params.id, req.user.id, comment);

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task rejected successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add comment to task
// @route   POST /api/tasks/:id/comment
// @access  Private
export const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      });
    }

    const task = await taskService.addComment(req.params.id, req.user.id, comment);

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    next(error);
  }
};

