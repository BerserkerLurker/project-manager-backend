const { Role } = require("../models");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../errors");

const getAllRoles = async (req, res) => {
  // const { userId, isAdmin } = req.user;

  const roles = await Role.find({}, "_id, name");

  res.status(StatusCodes.OK).json(roles);
};

const getRole = async (req, res) => {
  const roleId = req.params.id;

  const role = await Role.findById(roleId, "_id, name");

  if (!role) {
    throw new NotFoundError(`No role with id: ${roleId}`);
  }

  res.status(StatusCodes.OK).json(role);
};

const createRole = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { name } = req.body;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can add roles.");
  }

  if (name === "") {
    throw new BadRequestError("Role name cannot be empty.");
  }

  const role = await Role.create({ name });

  res.status(StatusCodes.OK).json(role);
};

const deleteRole = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const roleId = req.params.id;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can delete roles.");
  }

  const role = await Role.findByIdAndRemove(roleId);

  if (!role) {
    throw new NotFoundError(`No role with id: ${roleId}.`);
  }

  res.status(StatusCodes.OK).send("Delete Role");
};

const updateRole = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const roleId = req.params.id;
  const { name } = req.body;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can update roles.");
  }

  const updatedRole = await Role.findByIdAndUpdate(
    roleId,
    { name },
    { fields: "_id, name", new: true, runValidators: true }
  );

  if (!updatedRole) {
    throw new NotFoundError(`No role with id: ${roleId}`);
  }

  res.status(StatusCodes.OK).json(updatedRole);
};

module.exports = { getAllRoles, getRole, createRole, deleteRole, updateRole };
