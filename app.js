require("console-stamp")(console);
const dotenv = require("dotenv").config();
require("dotenv-expand").expand(dotenv);
const express = require("express");
const cors = require("cors");
const cookieparser = require("cookie-parser");
require("express-async-errors");
const morgan = require("morgan");
const connectDB = require("./db/connect");
const socketio = require("socket.io");
const { socketOps } = require("./socket/socketOps");
const { wrapAuth } = require("./socket/middleware/wrapper");

// morgan
const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieparser(process.env.SIGNED_COOKIE_SECRET));
app.use(morgan("dev"));

// routes
const authRouter = require("./routes/auth");
const projectsRouter = require("./routes/projects");
const rolesRouter = require("./routes/roles");
const teamsRouter = require("./routes/teams");
const tasksRouter = require("./routes/tasks");
const chatRouter = require("./routes/chat");

// not found
const notFoundMiddleware = require("./middleware/notFound");
// error handler
const errorHandlerMiddleware = require("./middleware/errorHandler");

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Project Manager");
});

// routes
// Authentication Middleware
const auth = require("./middleware/authentication");
// Authentication
app.use(
  "/api/v1/auth",
  function (req, res, next) {
    if (
      req.method === "PATCH" ||
      req.method === "DELETE" ||
      req.path === "/checkemail"
    ) {
      auth(req, res, next);
    } else {
      next();
    }
  },
  authRouter
);

// Projects
app.use("/api/v1/projects", auth, projectsRouter);

// Roles
app.use("/api/v1/roles", auth, rolesRouter);

// Teams
app.use("/api/v1/teams", auth, teamsRouter);

// Tasks
app.use("/api/v1/tasks", auth, tasksRouter);

// Chat
app.use("/api/v1/chat", auth, chatRouter);

// test
let stringify = require("json-stringify-safe");

app.get("/api/v1/test", (req, res) => {
  // console.log(req.headers.authorization);
  // res.send(stringify(req));
  // Cookies that have not been signed
  // console.log("Cookies: ", req.cookies);

  // Cookies that have been signed
  // console.log("Signed Cookies: ", req.signedCookies);

  res.send("ok");
});

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    const server = app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
    global.io = socketio(server, {
      cors: {
        origin: "http://localhost:5173",
        credentials: true,
      },
      path: "/chat/",
    });

    global.io.use(wrapAuth(auth));

    socketOps();
  } catch (error) {
    console.log(error);
  }
};

start();
