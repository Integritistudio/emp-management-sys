const bcrypt = require("bcryptjs");
const projectManagerModel = require("../models/projectManagerModel");

const BCRYPT_ROUNDS = 12;

const getAll = async (req, res, next) => {
  try {
    const managers = await projectManagerModel.findAll();
    res.json({ data: managers, count: managers.length });
  } catch (error) {
    next(error);
  }
};

const getOptions = async (req, res, next) => {
  try {
    const managers = await projectManagerModel.findAll();
    res.json({
      data: managers.map((m) => ({
        id: m.id,
        full_name: m.full_name,
        email: m.email,
      })),
      count: managers.length,
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const manager = await projectManagerModel.findById(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: "Project manager not found" });
    }
    res.json({ data: manager });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const password_hash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
    const manager = await projectManagerModel.create({
      full_name,
      email,
      password_hash,
    });
    res.status(201).json({ message: "Project manager created", data: manager });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body;
    let password_hash = null;
    if (password) {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters" });
      }
      password_hash = await bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
    }
    const manager = await projectManagerModel.update(req.params.id, {
      full_name,
      email,
      ...(password_hash ? { password_hash } : {}),
    });
    if (!manager) {
      return res.status(404).json({ message: "Project manager not found" });
    }
    res.json({ message: "Project manager updated", data: manager });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const manager = await projectManagerModel.remove(req.params.id);
    if (!manager) {
      return res.status(404).json({ message: "Project manager not found" });
    }
    res.json({ message: "Project manager deleted" });
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
