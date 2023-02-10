const { Task, UserTask, Project } = require("../models");
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

module.exports = { getAllTasks, getTask, createTask, deleteTask, updateTask };
