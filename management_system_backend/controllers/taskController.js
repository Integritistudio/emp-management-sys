const taskModel = require("../models/taskModel");

const getAll = async (req, res, next) => {
  try {
    const tasks = await taskModel.findAll({
      search: req.query.search,
      sort: req.query.sort,
      projectId: req.query.projectId,
      developerId: req.query.developerId,
      status: req.query.status,
      complexity: req.query.complexity,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const task = await taskModel.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const task = await taskModel.create(req.body);
    res.status(201).json({ message: "Task created", data: task });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const task = await taskModel.update(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task updated", data: task });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const task = await taskModel.remove(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task deleted" });
  } catch (error) {
    next(error);
  }
};

const pause = async (req, res, next) => {
  try {
    const task = await taskModel.pause(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task paused", data: task });
  } catch (error) {
    if (error.message.includes("can be paused") || error.message.includes("already paused")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const resume = async (req, res, next) => {
  try {
    const task = await taskModel.resume(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task resumed", data: task });
  } catch (error) {
    if (
      error.message.includes("not paused") ||
      error.message.includes("on-hold")
    ) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const complete = async (req, res, next) => {
  try {
    const result = await taskModel.complete(req.params.id, {
      confirm: req.body.confirm === true,
      actual_hours: req.body.actual_hours,
    });

    if (!result) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (result.requiresConfirmation) {
      return res.status(200).json({
        requiresConfirmation: true,
        message: result.message,
        data: result.task,
        elapsed_hours: result.elapsed_hours,
      });
    }

    res.json({ message: "Task completed", data: result.data });
  } catch (error) {
    if (error.message.includes("already finished")) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

const bulkUpdate = async (req, res, next) => {
  try {
    const { taskIds, action, value, confirm } = req.body;
    const bulkValue = action === "complete" ? confirm === true : value;
    const results = await taskModel.bulkUpdate(taskIds, action, bulkValue);

    const needsConfirmation = results.filter((r) => r.requiresConfirmation);
    res.json({
      message: "Bulk action processed",
      data: results,
      requiresConfirmation: needsConfirmation.length > 0,
      pending: needsConfirmation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  pause,
  resume,
  complete,
  bulkUpdate,
};
