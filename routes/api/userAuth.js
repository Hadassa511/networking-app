const express = require("express");
const router = express.Router(); //creates routes object

//@route    Get api/users/test
//@desc     Tests users route
//@access   Public
router.get("/test", (req, resp) => resp.json({ msg: "User works" })); //when localhost:5000/api/users/test is called, display the json msg

module.exports = router;
