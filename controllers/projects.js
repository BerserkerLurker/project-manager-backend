const { Project, UserProject } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");
const mongoose = require("mongoose");

const getAllProjects = async (req, res) => {
  const { userId, isAdmin } = req.user;
  //   console.log(userId, isAdmin);
  if (isAdmin) {
    const projects = await Project.find();
    // console.log(projects);
    res.status(StatusCodes.OK).json(projects);
    return;
  }

  let userProjects = await UserProject.find({
    userId: userId,
    isOwner: true,
  }).populate("projectId", null, Project);

  if (userProjects.length == 0) {
    console.log("empty");
  } else {
    // console.log(userProjects);
    userProjects = userProjects.map((userProject) => {
      const { _id, userId, projectId, isOwner } = userProject;
      return {
        projectId: projectId._id,
        userId,
        isOwner,
        projectName: projectId.name,
        description: projectId.description,
        isDone: projectId.isDone,
        status: projectId.status,
        dueDate: projectId.dueDate,
        createdAt: projectId.createdAt,
        updatedAt: projectId.updatedAt,
      };
    });
  }
  res.status(StatusCodes.OK).json(userProjects);
};

const getProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  let projectId = req.params.id;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError(`No project with id: ${projectId}`);
  }

  res.status(StatusCodes.OK).json(project);
};

const createProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { name, description, isDone, status, dueDate } = req.body;

  if (isAdmin) {
    //TODO - Create project and assign participants
  }
  const project = await Project.create({
    name,
    description,
    isDone,
    status,
    dueDate,
  });
  // console.log(project);

  const userProject = await UserProject.create({
    userId: userId,
    projectId: project._id,
    isOwner: true,
  });
  // console.log(userProject);

  res.status(StatusCodes.OK).json(project);
};

const deleteProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const projectId = req.params.id;

  if (isAdmin) {
    //TODO - Can delete any project Careful with the clean up
  }

  const userProject = await UserProject.findOneAndRemove({
    userId,
    projectId,
    isOwner: true,
  });
  console.log(userProject);

  if (!userProject) {
    throw new NotFoundError(`No owned projects with id ${projectId}`);
  }
  const project = await Project.findByIdAndRemove(projectId);
  console.log(project);

  if (!project) {
    throw new NotFoundError(`No projects with id ${projectId}`);
  }

  res.status(StatusCodes.OK).send("Delete Project");
};

const updateProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const projectId = req.params.id;
  const { name, description, isDone, status, dueDate } = req.body;

  if (isAdmin) {
    //TODO - Can update any project Careful with the clean up
  }

  const userProject = await UserProject.findOne({
    userId,
    projectId,
    isOwner: true,
  });

  if (!userProject) {
    throw new NotFoundError(`No owned projects with id ${projectId}`);
  }

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    {
      name,
      description,
      isDone,
      status,
      dueDate,
    },
    { new: true, runValidators: true }
  );

  if (!updatedProject) {
    throw new NotFoundError(`No project with id ${projectId}`);
  }

  res.status(StatusCodes.OK).json(updatedProject);
};

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
};
