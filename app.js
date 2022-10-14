const dotenv = require("dotenv").config();
require("dotenv-expand").expand(dotenv);
const express = require("express");
const morgan = require("morgan");
const connectDB = require("./db/connect");

// morgan
const app = express();
app.use(morgan("dev"));

// routes
const authRouter = require("./routes/auth");

app.get("/", (req, res) => {
  res.send("Project Manager");
});

app.use(express.json());
// routes
app.use("/api/v1/auth", authRouter);

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
