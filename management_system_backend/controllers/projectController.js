const projectModel = require("../models/projectModel");
const taskModel = require("../models/taskModel");

const getAll = async (req, res, next) => {
  try {
    const projects = await projectModel.findAll({
      search: req.query.search,
      sort: req.query.sort,
      status: req.query.status,
      quality: req.query.quality,
      leadDeveloperId: req.query.leadDeveloperId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });
    res.json({ data: projects, count: projects.length });
  } catch (error) {
    next(error);
  }
};

const getOptions = async (req, res, next) => {
  try {
    const projects = await projectModel.findOptions();
    res.json({ data: projects, count: projects.length });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const project = await projectModel.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    const tasks = await taskModel.findByProjectId(req.params.id);
    res.json({ data: { ...project, tasks } });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const project = await projectModel.create(req.body);
    res.status(201).json({ message: "Project created", data: project });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const project = await projectModel.update(req.params.id, req.body);
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
    const project = await projectModel.remove(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted" });
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
};
