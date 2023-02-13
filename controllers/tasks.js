const { Task, UserTask, Project, User, UserProject } = require("../models");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, NotFoundError } = require("../errors");

const getAllTasks = async (req, res) => {
  const { userId, isAdmin } = req.user;

  if (isAdmin) {
    const tasks = await Task.find();

    res.status(StatusCodes.OK).json(tasks);
    return;
  }

  let userTasks = await UserTask.find({
    userId,
    //isOwner: true,
  }).populate("taskId", null, Task);

  userTasks = userTasks.map((userTask) => {
    const { _id, userId, taskId, isOwner } = userTask;
    return {
      taskId: taskId._id,
      userId,
      isOwner,
      taskName: taskId.name,
      projectId: taskId.projectId,
      description: taskId.description,
      isDone: taskId.isDone,
      status: taskId.status,
      priority: taskId.priority,
      dueDate: taskId.dueDate,
      createdAt: taskId.createdAt,
      updatedAt: taskId.updatedAt,
    };
  });

  res.status(StatusCodes.OK).json(userTasks);
};

const getTask = async (req, res) => {
  const taskId = req.params.id;

  const task = await Task.findById(taskId);

  if (!task) {
    throw new NotFoundError(`No task with id: ${taskId}`);
  }

  res.status(StatusCodes.OK).json(task);
};

const getTaskAssignees = async (req, res) => {
  const taskId = req.params.id;
  const ids = taskId.split(",");
  let tasksAssignees = ids.map((id) => {
    return { [id]: [] };
  });

  const userTasks = await UserTask.find({
    taskId: { $in: ids },
  }).populate([{ path: "userId", select: ["-password", "-__v"] }]);

  if (!userTasks.length) {
    throw new NotFoundError(`No tasks with ids: ${ids.toString()}`);
  }

  userTasks.forEach((task) => {
    let index = tasksAssignees.findIndex((elem) => {
      return Object.keys(elem)[0] === task.taskId.toString();
    });
    if (index !== -1) {
      const obj = tasksAssignees[index];
      tasksAssignees[index][task.taskId].push({
        isOwner: task.isOwner,
        ...task.userId._doc,
      });
    }
  });

  res.status(StatusCodes.OK).json(tasksAssignees);
};

const createTask = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const { name, description, isDone, status, priority, dueDate, projectId } =
    req.body;

  if (name === "") {
    throw new BadRequestError("Task name cannot be empty.");
  }

  //TODO - Create task as admin and assign it to users

  const project = await Project.findById(projectId);

  if (!project) {
    throw new BadRequestError("Task needs a parent Project.");
  }
  //TODO - general no parent project tasks case

  const task = await Task.create({
    name,
    description,
    isDone,
    status,
    priority,
    dueDate,
    projectId,
  });

  const userTask = await UserTask.create({
    userId,
    taskId: task._id,
    isOwner: true,
  });

  res.status(StatusCodes.OK).json({
    taskId: task._id,
    projectId: task.projectId,
    userId: userTask.userId,
    isOwner: userTask.isOwner,
    taskName: task.name,
    description: task.description,
    isDone: task.isDone,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  });
};

const deleteTask = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const taskId = req.params.id;

  //TODO - Delete tasks as admin and clean up

  const userTask = await UserTask.findOneAndRemove({
    userId,
    taskId,
    isOwner: true,
  });

  if (!userTask) {
    throw new NotFoundError(`No owned tasks with id ${taskId}`);
  }
  const task = await Task.findByIdAndRemove(taskId);

  if (!task) {
    throw new NotFoundError(`No tasks with id ${taskId}`);
  }

  res.status(StatusCodes.OK).send("Delete Task");
};

const updateTask = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const taskId = req.params.id;
  const { name, description, isDone, status, priority, dueDate, projectId } =
    req.body;

  //TODO - Can update any task Careful with the clean up

  const userTask = await UserTask.findOne({
    userId,
    taskId,
    isOwner: true,
  });

  if (!userTask) {
    throw new NotFoundError(`No owned tasks with id ${taskId}`);
  }

  const updatedTask = await Task.findByIdAndUpdate(
    taskId,
    {
      name,
      description,
      isDone,
      status,
      priority,
      dueDate,
      projectId,
    },
    { new: true, runValidators: true }
  );

  if (!updatedTask) {
    throw new NotFoundError(`No task with id ${taskId}`);
  }

  res.status(StatusCodes.OK).json({
    taskId: updatedTask._id,
    projectId: updatedTask.projectId,
    userId: userTask.userId,
    isOwner: userTask.isOwner,
    taskName: updatedTask.name,
    description: updatedTask.description,
    isDone: updatedTask.isDone,
    status: updatedTask.status,
    priority: updatedTask.priority,
    dueDate: updatedTask.dueDate,
    createdAt: updatedTask.createdAt,
    updatedAt: updatedTask.updatedAt,
  });
};

const assignUserToTask = async (req, res) => {
  const { userId, isAdmin } = req.user;
  const taskId = req.params.id;
  const { assigneeEmail } = req.body;

  const assignee = await User.findOne({ email: assigneeEmail });

  if (!assignee) {
    throw new NotFoundError(`No User with email ${assigneeEmail} was found`);
  }

  const userTasks = await UserTask.find({ taskId }).populate([
    "userId",
    "taskId",
  ]);

  if (userTasks.length == 0) {
    throw new NotFoundError(`No tasks with id ${taskId}`);
  }

  if (userTasks.find((userTask) => userTask.userId.equals(assignee._id))) {
    throw new BadRequestError(
      `User with email ${assigneeEmail} is already assigned to Task ${taskId}`
    );
  }

  const refTask = userTasks.find((task) => task.isOwner);

  const userProjects = await UserProject.find({
    projectId: refTask.taskId.projectId,
    userId: assignee._id,
  });

  if (userProjects.length == 0) {
    throw new BadRequestError(
      `User with email ${assigneeEmail} is not a member of task's ${taskId} parent project ${refTask.taskId.projectId}`
    );
  }

  const userTask = await UserTask.create({
    userId: assignee._id,
    taskId,
    isOwner: false,
  });

  const result = await UserTask.findById(userTask._id).populate(
    "userId",
    null,
    User
  );

  res.status(StatusCodes.OK).json({
    taskID: result.taskId,
    isOwner: result.isOwner,
    userId: result.userId._id,
    email: result.userId.email,
    name: result.userId.name,
    role: result.userId.role,
    team: result.userId.team,
    avatar: result.userId.avatar,
  });
};

module.exports = {
  getAllTasks,
  getTask,
  createTask,
  deleteTask,
  updateTask,
  assignUserToTask,
  getTaskAssignees,
};
