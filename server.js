//file from which the execution starts
const express = require("express");
const mongoose = require("mongoose");


//manually created modules stored in variables
const userAuth = require("./routes/api/userAuth");
const profiles = require("./routes/api/profiles");
const posts = require("./routes/api/posts");

const app = express();

//DB config
const db = require("./config/keys").mongoURI;

//Connect to MongoDB
mongoose
  .connect(db, { useNewUrlParser: true })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, resp) => resp.send("Hello!")); // response to send when url '/' is hit

//Use routes
app.use("/api/users", userAuth); //when the path /api/users is called, go to userAuth variable and access that ./routes/api/userAuth.js file
app.use("/api/profiles", profiles);
app.use("/api/posts", posts);

const port = process.env.PORT || 5000; //port value present in env variable or 5000 value

app.listen(port, () => console.log(`Server listening on port ${port}`));
