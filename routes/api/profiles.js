const express = require("express"); 
const router = express.Router(); 

//@route    Get api/profiles/test
//@desc     Tests profile route
//@access   Public

router.get("/test", (req, resp) => resp.json({ msg: "Profile works" }));

module.exports = router;
