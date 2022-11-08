const dotenv = require("dotenv").config();
require("dotenv-expand").expand(dotenv);
const express = require("express");
require("express-async-errors");
const morgan = require("morgan");
const connectDB = require("./db/connect");

// morgan
const app = express();
app.use(morgan("dev"));

// routes
const authRouter = require("./routes/auth");
const projectsRouter = require("./routes/projects");
const rolesRouter = require("./routes/roles");
const teamsRouter = require("./routes/teams");

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
    if (req.method === "PATCH") {
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

// test
let stringify = require("json-stringify-safe");

app.get("/api/v1/test", (req, res) => {
  console.log(req.headers.authorization);
  res.send(stringify(req));
});

app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
