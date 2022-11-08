const { Team } = require("../models");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../errors");

const getAllTeams = async (req, res) => {
  const teams = await Team.find({}, "_id, name");

  res.status(StatusCodes.OK).json(teams);
};

const getTeam = async (req, res) => {
  const teamId = req.params.id;

  const team = await Team.findById(teamId, "_id, name");

  if (!team) {
    throw new NotFoundError(`No team with id: ${teamId}`);
  }

  res.status(StatusCodes.OK).json(team);
};

const createTeam = async (req, res) => {
  const { isAdmin } = req.user;
  const { name } = req.body;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can add teams.");
  }

  if (name === "") {
    throw new BadRequestError("Team name cannot be empty.");
  }

  const team = await Team.create({ name });

  res.status(StatusCodes.OK).json({ _id: team._id, name: team.name });
};

const deleteTeam = async (req, res) => {
  const { isAdmin } = req.user;
  const teamId = req.params.id;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can delete teams.");
  }

  const team = await Team.findByIdAndRemove(teamId);

  if (!team) {
    throw new NotFoundError(`No team with id: ${teamId}`);
  }

  res.status(StatusCodes.OK).send("Delete Team");
};

const updateTeam = async (req, res) => {
  const { isAdmin } = req.user;
  const teamId = req.params.id;
  const { name } = req.body;

  if (!isAdmin) {
    throw new UnauthenticatedError("Only admins can update teams.");
  }

  const updatedTeam = await Team.findByIdAndUpdate(
    teamId,
    { name },
    { fields: "_id, name", new: true, runValidators: true }
  );

  if (!updatedTeam) {
    throw new NotFoundError(`No team with id: ${teamId}`);
  }

  res.status(StatusCodes.OK).json(updatedTeam);
};

module.exports = { getAllTeams, getTeam, createTeam, deleteTeam, updateTeam };
