const { Team, User } = require("../models");
const { StatusCodes } = require("http-status-codes");
const {
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
} = require("../errors");

const getAllTeams = async (req, res) => {
  const teams = await Team.find().populate({
    path: "members.memberId",
    select: "-password",
  });

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
  const { userId, isAdmin } = req.user;
  const { name } = req.body;

  if (!isAdmin) {
    // throw new UnauthenticatedError("Only admins can add teams.");
  }

  if (name === "") {
    throw new BadRequestError("Team name cannot be empty.");
  }

  const team = await Team.create({ name });
  team.members.push({ memberId: userId, status: "accepted" });
  await team.save();

  res.status(StatusCodes.OK).json(team);
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
  const { userId, isAdmin } = req.user;
  const teamId = req.params.id;
  const { name, memberStatus } = req.body;

  if (!isAdmin) {
    // throw new UnauthenticatedError("Only admins can update teams.");
  }

  const updatedTeam = await Team.findById({ _id: teamId });
  if (!updatedTeam) {
    throw new NotFoundError(`No team with id: ${teamId}`);
  }

  if (memberStatus === undefined) {
    // update team name
    updatedTeam.name = name;
    await updatedTeam.save();
  } else {
    // respond to invite
    const memberIndex = updatedTeam.members.findIndex((member) =>
      member.memberId.equals(userId)
    );

    if (memberIndex === -1) {
      throw new BadRequestError(
        `User ${userId} didn't receive an invite to join team ${teamId}`
      );
    }

    updatedTeam.members[memberIndex].status = memberStatus;
    await updatedTeam.save();
  }

  res.status(StatusCodes.OK).json(updatedTeam);
};

const addTeamMember = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const teamId = req.params.id;
  const { inviteeEmail } = req.body;

  const invitee = await User.findOne({ email: inviteeEmail }).select(
    "-password"
  );

  if (!invitee) {
    throw new NotFoundError(`No User with email ${inviteeEmail} was found`);
  }

  const team = await Team.findById({ _id: teamId }).populate({
    path: "members.memberId",
    select: "-password",
  });

  if (!team) {
    throw new NotFoundError(`No Team with id ${teamId} was found`);
  }

  const found = team.members.find(
    (member) => member.memberId.email === inviteeEmail
  );

  if (found) {
    if (found.status === "accepted") {
      throw new BadRequestError(
        `User with email ${inviteeEmail} already a member of this team`
      );
    }
    if (found.status === "pending") {
      throw new BadRequestError(
        `User with email ${inviteeEmail} already received an invite to join this team`
      );
    }
  }

  team.members.push({ memberId: invitee, status: "pending" });
  await team.save();

  res.status(StatusCodes.OK).json(team);
};

module.exports = {
  getAllTeams,
  getTeam,
  createTeam,
  deleteTeam,
  updateTeam,
  addTeamMember,
};
