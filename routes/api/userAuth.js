const express = require("express");
const router = express.Router(); //creates routes object
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");

//create User model
const User = require("../../model/Users");

//@route    Get api/users/test
//@desc     Tests users route
//@access   Public
router.get("/test", (req, resp) => resp.json({ msg: "User works" })); //when localhost:5000/api/users/test is called, display the json msg

//@route    POST api/users/register
//@desc     Register User
//@access   Public
router.post("/register", (req, resp) => {
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return resp.status(400).json({ email: "Email already exists" });
    } else {
      const avatar = gravatar.url(req.body.email, {
        s: "200", //size
        r: "pg", //rating
        d: "mm" //default
      });
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        avatar,
        password: req.body.password
      });
    }
  });
});

module.exports = router;
