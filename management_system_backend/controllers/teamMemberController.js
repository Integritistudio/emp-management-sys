const bcrypt = require("bcryptjs");
const teamMemberModel = require("../models/teamMemberModel");

const BCRYPT_ROUNDS = 12;

const hashPasswordIfProvided = async (password) => {
  if (!password || typeof password !== "string" || !password.trim()) {
    return null;
  }
  return bcrypt.hash(password.trim(), BCRYPT_ROUNDS);
};

const getAll = async (req, res, next) => {
  try {
    const [members, titles] = await Promise.all([
      teamMemberModel.findAll({
        search: req.query.search,
        sort: req.query.sort,
        title: req.query.title,
        efficiencyRange: req.query.efficiencyRange,
      }),
      teamMemberModel.findDistinctTitles(),
    ]);
    res.json({ data: members, count: members.length, titles });
  } catch (error) {
    next(error);
  }
};

const getTitles = async (req, res, next) => {
  try {
    const titles = await teamMemberModel.findDistinctTitles();
    res.json({ data: titles });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const member = await teamMemberModel.findDetailById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ data: member });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    if (password && password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const password_hash = await hashPasswordIfProvided(password);
    const member = await teamMemberModel.create({ ...rest, password_hash });
    res.status(201).json({ message: "Team member created", data: member });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { password, ...rest } = req.body;
    if (password && password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    const password_hash = await hashPasswordIfProvided(password);
    const member = await teamMemberModel.update(req.params.id, {
      ...rest,
      ...(password_hash ? { password_hash } : {}),
    });
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ message: "Team member updated", data: member });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Email already exists" });
    }
    next(error);
  }
};

const updateMatrixRating = async (req, res, next) => {
  try {
    const member = await teamMemberModel.updateMatrixRating(req.params.id, req.body);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ message: "Matrix rating updated", data: member });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const member = await teamMemberModel.remove(req.params.id);
    if (!member) {
      return res.status(404).json({ message: "Team member not found" });
    }
    res.json({ message: "Team member deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getTitles,
  getById,
  create,
  update,
  updateMatrixRating,
  remove,
};
