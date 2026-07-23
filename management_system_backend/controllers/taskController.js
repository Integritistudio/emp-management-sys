const taskModel = require("../models/taskModel");
const {
  isMember,
  isProjectAdmin,
  memberId,
  canAccessProject,
  getAccessibleProjectIds,
} = require("../middleware/authMiddleware");

const assertTaskAccess = async (req, res) => {
  const task = await taskModel.findById(req.params.id);
  if (!task) {
    res.status(404).json({ message: "Task not found" });
    return null;
  }

  if (isMember(req)) {
    if (task.assigned_to !== memberId(req)) {
      res.status(403).json({ message: "You can only access your own tasks" });
      return null;
    }
    return task;
  }

  if (isProjectAdmin(req)) {
    if (!(await canAccessProject(req.user, task.project_id))) {
      res.status(403).json({
        message: "You can only manage tasks on your projects",
      });
      return null;
    }
  }

  return task;
};

const getAll = async (req, res, next) => {
  try {
    const filters = {
      search: req.query.search,
      sort: req.query.sort,
      projectId: req.query.projectId,
      developerId: req.query.developerId,
      status: req.query.status,
      complexity: req.query.complexity,
      priority: req.query.priority,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    if (isMember(req)) {
      filters.developerId = memberId(req);
    } else if (isProjectAdmin(req)) {
      const ids = await getAccessibleProjectIds(req.user);
      if (filters.projectId) {
        if (!ids.includes(filters.projectId)) {
          return res.json({ data: [], count: 0 });
        }
      } else {
        filters.projectIds = ids;
      }
    }

    const tasks = await taskModel.findAll(filters);
    res.json({ data: tasks, count: tasks.length });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const task = await assertTaskAccess(req, res);
    if (!task) return;
    res.json({ data: task });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const payload = { ...req.body };

    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot create tasks" });
    }

    if (isProjectAdmin(req)) {
      if (!(await canAccessProject(req.user, payload.project_id))) {
        return res.status(403).json({
          message: "You can only create tasks on your projects",
        });
      }
    }

    const task = await taskModel.create(payload);
    res.status(201).json({ message: "Task created", data: task });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const existing = await assertTaskAccess(req, res);
    if (!existing) return;

    const payload = { ...req.body };

    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot update tasks" });
    }

    if (isProjectAdmin(req) && payload.project_id) {
      if (!(await canAccessProject(req.user, payload.project_id))) {
        return res.status(403).json({
          message: "You can only move tasks within your projects",
        });
      }
    }

    const task = await taskModel.update(req.params.id, payload);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json({ message: "Task updated", data: task });
  } catch (error) {
    if (error.requiresConfirmation) {
      return res.status(200).json({
        requiresConfirmation: true,
        message: error.message,
        elapsed_hours: error.elapsed_hours,
        data: error.task,
      });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot delete tasks" });
    }
    if (!(await assertTaskAccess(req, res))) return;

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
    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot modify tasks" });
    }
    if (!(await assertTaskAccess(req, res))) return;

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
    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot modify tasks" });
    }
    if (!(await assertTaskAccess(req, res))) return;

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
    if (isMember(req)) {
      return res.status(403).json({ message: "Members cannot modify tasks" });
    }
    if (!(await assertTaskAccess(req, res))) return;

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
    if (isMember(req)) {
      return res
        .status(403)
        .json({ message: "Bulk actions are not available for team members" });
    }

    const { taskIds, action, value, confirm, actual_hours } = req.body;

    if (isProjectAdmin(req)) {
      const accessible = await getAccessibleProjectIds(req.user);
      for (const id of taskIds) {
        const task = await taskModel.findById(id);
        if (!task || !accessible.includes(task.project_id)) {
          return res.status(403).json({
            message: "Bulk actions are limited to your projects",
          });
        }
      }
      if (action === "move_project" && value) {
        if (!(await canAccessProject(req.user, value))) {
          return res.status(403).json({
            message: "You can only move tasks within your projects",
          });
        }
      }
    }

    const bulkValue =
      action === "complete"
        ? { confirm: confirm === true, actual_hours }
        : value;
    const { results, summary } = await taskModel.bulkUpdate(
      taskIds,
      action,
      bulkValue
    );

    const needsConfirmation = results.filter((r) => r.requiresConfirmation);
    const parts = [];
    if (summary.updated) parts.push(`${summary.updated} updated`);
    if (summary.skipped) parts.push(`${summary.skipped} skipped`);
    if (summary.failed) parts.push(`${summary.failed} failed`);
    if (summary.pending) parts.push(`${summary.pending} need confirmation`);

    res.json({
      message:
        parts.length > 0
          ? `Bulk action processed: ${parts.join(", ")}.`
          : "Bulk action processed.",
      data: results,
      summary,
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
