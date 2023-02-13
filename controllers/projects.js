const { Project, UserProject, User, UserTask, Task } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllProjects = async (req, res) => {
  const { userId, isAdmin } = req.user;
  //   console.log(userId, isAdmin);
  if (isAdmin) {
    let projects = await Project.find();
    // console.log(projects);
    projects = projects.map((project) => {
      return {
        projectId: project._id,
        projectName: project.name,
        description: project.description,
        isDone: project.isDone,
        status: project.status,
        dueDate: project.dueDate,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      };
    });
    res.status(StatusCodes.OK).json(projects);
    return;
  }

  let userProjects = await UserProject.find({
    userId: userId,
    // isOwner: true,
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

  res.status(StatusCodes.OK).json({
    projectId: project._id,
    projectName: project.name,
    description: project.description,
    isDone: project.isDone,
    status: project.status,
    dueDate: project.dueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
};

const createProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { name, description, isDone, status, dueDate } = req.body;

  if (name === "") {
    throw new BadRequestError("Project name cannot be empty.");
  }

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

  res.status(StatusCodes.OK).json({
    projectId: project._id,
    projectName: project.name,
    description: project.description,
    isDone: project.isDone,
    status: project.status,
    dueDate: project.dueDate,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  });
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
  // console.log(userProject);

  if (!userProject) {
    throw new NotFoundError(`No owned projects with id ${projectId}`);
  }
  const project = await Project.findByIdAndRemove(projectId);
  // console.log(project);

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

  res.status(StatusCodes.OK).json({
    projectId: updatedProject._id,
    projectName: updatedProject.name,
    description: updatedProject.description,
    isDone: updatedProject.isDone,
    status: updatedProject.status,
    dueDate: updatedProject.dueDate,
    createdAt: updatedProject.createdAt,
    updatedAt: updatedProject.updatedAt,
  });
};

const getProjectAssignees = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const projectId = req.params.id;

  let userProjects = await UserProject.find({
    projectId,
  }).populate("userId", null, User);

  if (userProjects.length == 0) {
    throw new NotFoundError(`No projects with id ${projectId}`);
  }

  const assigneesList = userProjects.map((userProject) => {
    return {
      projectId: userProject.projectId,
      isOwner: userProject.isOwner,
      userId: userProject.userId._id,
      email: userProject.userId.email,
      name: userProject.userId.name,
      role: userProject.userId.role,
      team: userProject.userId.team,
      avatar: userProject.userId.avatar,
    };
  });

  res.status(StatusCodes.OK).json(assigneesList);
};

const assignUserToProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const projectId = req.params.id;
  const { newMemberEmail } = req.body;

  const newMember = await User.findOne({ email: newMemberEmail });

  if (!newMember) {
    throw new NotFoundError(`No User with email ${newMemberEmail} was found`);
  }

  const userProjects = await UserProject.find({ projectId }).populate(
    "userId",
    null,
    User
  );

  if (userProjects.length == 0) {
    throw new NotFoundError(`No projects with id ${projectId}`);
  }

  if (
    userProjects.find((userProject) => userProject.userId.equals(newMember._id))
  ) {
    throw new BadRequestError(
      `User with email ${newMemberEmail} is already assigned to Project ${projectId}`
    );
  }

  const userProject = await UserProject.create({
    userId: newMember._id,
    projectId,
    isOwner: false,
  });

  const result = await UserProject.findById(userProject._id).populate(
    "userId",
    null,
    User
  );

  res.status(StatusCodes.OK).json({
    projectId: result.projectId,
    isOwner: result.isOwner,
    userId: result.userId._id,
    email: result.userId.email,
    name: result.userId.name,
    role: result.userId.role,
    team: result.userId.team,
    avatar: result.userId.avatar,
  });
};

const unassignUserFromProject = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const projectId = req.params.id;
  const { memberUserId, memberEmail } = req.body;

  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError(`No Project with id ${projectId}`);
  }

  let member = undefined;

  if (memberUserId !== "" && memberUserId !== undefined) {
    member = await User.findById({
      _id: memberUserId,
    });
  } else if (memberEmail !== "" && memberEmail !== undefined) {
    member = await User.findOne({
      email: memberEmail,
    });
  }

  if (!member) {
    if (memberUserId !== "") {
      throw new NotFoundError(`No User with id ${memberUserId} was found`);
    } else if (memberEmail !== "") {
      throw new NotFoundError(`No User with email ${memberEmail} was found`);
    }
    throw new BadRequestError(`Must provide an Email or a UserId`);
  }

  let userProject = await UserProject.findOne({
    projectId: projectId,
    userId: userId,
  });

  if (!userProject.isOwner) {
    throw new BadRequestError(`Only project owners can unassign member`);
  }

  userProject = await UserProject.findOne({
    projectId,
    userId: member._id,
  });

  if (!userProject) {
    throw new NotFoundError(
      `User ${member._id} is not a member of project ${projectId}`
    );
  }

  const userTasks = await Task.find({
    projectId,
  }).populate({
    path: "userTasks",
    match: {
      userId: member._id,
    },
  });

  let memberTasks = [];
  userTasks.forEach((elem) => {
    if (elem.userTasks.length !== 0) {
      // Collect tasks assigned to this user
      memberTasks.push(elem.userTasks);
    }
  });
  memberTasks = memberTasks.flat();
  // console.log(memberTasks);

  // iterate memberTasks
  // if he isOwner update userTask _id with new userId of Project Owner
  // if he !isOwner check if taskId owner exists if true delete userTask _id entry else update userId to be project owner id and isOwner to true

  memberTasks.forEach(async (task) => {
    if (task.isOwner) {
      const userTask = await UserTask.findOneAndUpdate(
        { _id: task._id },
        { userId: userId }
      );
    } else {
      const taskOwner = await UserTask.findOne({
        taskId: task.taskId,
        isOwner: true,
      });
      if (taskOwner) {
        const userTask = await UserTask.findOneAndDelete({ _id: task._id });
      } else {
        const userTask = await UserTask.findOneAndUpdate(
          { _id: task._id },
          { userId: userId, isOwner: true }
        );
      }
    }
  });

  const unassigned = await UserProject.findOneAndDelete({
    _id: userProject._id,
  });

  res.status(StatusCodes.OK).json({
    msg: `User ${member._id} not longer a member of Project ${projectId}`,
  });
};

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  deleteProject,
  updateProject,
  getProjectAssignees,
  assignUserToProject,
  unassignUserFromProject,
};
