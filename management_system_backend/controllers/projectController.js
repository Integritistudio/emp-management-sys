const projectModel = require("../models/projectModel");
const taskModel = require("../models/taskModel");
const {
  isAdmin,
  isProjectAdmin,
  isMember,
  managerId,
  canAccessProject,
} = require("../middleware/authMiddleware");

const getAll = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const query = {
      search: req.query.search,
      sort: req.query.sort,
      status: req.query.status,
      quality: req.query.quality,
      leadDeveloperId: req.query.leadDeveloperId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };

    if (isProjectAdmin(req)) {
      query.managerId = managerId(req);
    }

    const projects = await projectModel.findAll(query);
    res.json({ data: projects, count: projects.length });
  } catch (error) {
    next(error);
  }
};

const getOptions = async (req, res, next) => {
  try {
    const projects = await projectModel.findOptions(
      isProjectAdmin(req) ? managerId(req) : null
    );
    res.json({ data: projects, count: projects.length });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const [tasks, collaborators] = await Promise.all([
      taskModel.findByProjectId(req.params.id),
      projectModel.listCollaborators(req.params.id),
    ]);
    res.json({ data: { ...project, tasks, collaborators } });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const payload = { ...req.body };
    if (isProjectAdmin(req)) {
      payload.owner_id = managerId(req);
    } else if (isAdmin(req) && !payload.owner_id) {
      payload.owner_id = null;
    }

    const project = await projectModel.create(payload);
    res.status(201).json({ message: "Project created", data: project });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const payload = { ...req.body };
    // Only super-admin may reassign ownership
    if (!isAdmin(req)) {
      delete payload.owner_id;
    }

    const project = await projectModel.update(req.params.id, payload);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project updated", data: project });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    if (isMember(req)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const project = await projectModel.remove(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted" });
  } catch (error) {
    next(error);
  }
};

const getCollaborators = async (req, res, next) => {
  try {
    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }
    const collaborators = await projectModel.listCollaborators(req.params.id);
    res.json({ data: collaborators, count: collaborators.length });
  } catch (error) {
    next(error);
  }
};

const addCollaborator = async (req, res, next) => {
  try {
    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { project_manager_id } = req.body;
    if (!project_manager_id) {
      return res.status(400).json({ message: "project_manager_id is required" });
    }

    const project = await projectModel.findById(req.params.id);
    if (project?.owner_id === project_manager_id) {
      return res
        .status(400)
        .json({ message: "Owner is already on the project" });
    }

    const collaborators = await projectModel.addCollaborator(
      req.params.id,
      project_manager_id
    );
    res.status(201).json({
      message: "Collaborator added",
      data: collaborators,
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(404).json({ message: "Project manager not found" });
    }
    next(error);
  }
};

const removeCollaborator = async (req, res, next) => {
  try {
    if (!(await canAccessProject(req.user, req.params.id))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const removed = await projectModel.removeCollaborator(
      req.params.id,
      req.params.managerId
    );
    if (!removed) {
      return res.status(404).json({ message: "Collaborator not found" });
    }
    res.json({ message: "Collaborator removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getOptions,
  getById,
  create,
  update,
  remove,
  getCollaborators,
  addCollaborator,
  removeCollaborator,
};
