const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//to ignore the deprecation warning
mongoose.set('useFindAndModify', false);

//Load validation
const validateProfileInput = require('../../validations/profile');
const validateExperienceInput = require('../../validations/experience');
const validateEducationInput = require('../../validations/education');

//Load profile model
const Profile = require('../../model/Profile');

//Load User Profile
const User = require('../../model/User');

//@route    Get api/profiles/test
//@desc     Tests profile route
//@access   Public

router.get('/test', (req, resp) => resp.json({ msg: 'Profile works' }));

//@route    Get api/profile/all
//@desc     Get all profiles
//@access   Public

router.get('/all', (req, resp) => {
  const errors = {};
  Profile.find()
    .populate('user', ['name', 'avatar'])
    .then(profiles => {
      if (!profiles) {
        errors.noprofiles = 'There are no profiles';
        resp.status(404).json(errors);
      }
      resp.json(profiles);
    })
    .catch(err => resp.status(404).json({ profiles: 'There are no profiles' }));
});

//@route    Get api/profile/handle/:handle
//@desc     Get profile by handle
//Handle is for backend purpose
//@access   Public

router.get('/handle/:handle', (req, resp) => {
  const errors = {};

  Profile.findOne({ handle: req.params.handle })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.handle = 'There is no profile for this handle';
        resp.status(404).json(errors);
      }
      resp.json(profile);
    })
    .catch(err => resp.status(404).json(err));
});

//@route    Get api/profile/user/:user_id
//@desc     Get profile by user_id
//@access   Public

router.get('/user/:user_id', (req, resp) => {
  const errors = {};

  Profile.findOne({ user: req.params.user_id })
    .populate('user', ['name', 'avatar'])
    .then(profile => {
      if (!profile) {
        errors.handle = 'There is no profile for this handle';
        resp.status(404).json(errors);
      }
      resp.json(profile);
    })
    .catch(err =>
      resp.status(404).json({ profile: 'There is no profile for this user' })
    );
});

//@route    Get api/profile
//@desc     Get Current users profile
//@access   Private

router.get(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const errors = {};

    Profile.findOne({ user: req.user.id })
      .populate('user', ['name', 'avatar'])
      .then(profile => {
        if (!profile) {
          errors.noprofile = 'There is no profile for this user';
          return resp.status(404).json(errors);
        }
        resp.json(profile);
      })
      .catch(err => resp.status(404).json(err));
  }
);

//@route    POST api/profile
//@desc     Create or edit user profile
//@access   Private

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const { errors, isValid } = validateProfileInput(req.body);

    //Check validation
    if (!isValid) {
      //Return any errors with 400 status
      return resp.status(400).json(errors);
    }
    //Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.handle) profileFields.handle = req.body.handle;
    if (req.body.company) profileFields.company = req.body.company;
    if (req.body.website) profileFields.website = req.body.website;
    if (req.body.location) profileFields.location = req.body.location;
    if (req.body.bio) profileFields.bio = req.body.bio;
    if (req.body.status) profileFields.status = req.body.status;
    if (req.body.githubusername)
      profileFields.githubusername = req.body.githubusername;

    //Skills spilt into array
    if (typeof req.body.skills !== 'undefined') {
      profileFields.skills = req.body.skills.split(',');
    }

    //Social
    profileFields.social = {};
    if (req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if (req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if (req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if (req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if (req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        //Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        ).then(profile => resp.json(profile));
      } else {
        //Create

        //Check if handle exists
        Profile.findOne({ handle: profileFields.handle }).then(profile => {
          if (profile) {
            errors.handle = 'The handle already exists';
            resp.status(400).json(errors);
          }

          //Save Profile
          new Profile(profileFields).save().then(profile => resp.json(profile));
        });
      }
    });
  }
);

//@route    POST api/profile/experience
//@desc     Post experience to profile
//@access   Private

router.post(
  '/experience',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const { errors, isValid } = validateExperienceInput(req.body);

    //Check Validation
    if (!isValid) {
      //return any errors with 400 status
      return resp.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }) // req.user.id comes from the token
      .then(profile => {
        const newExp = {
          title: req.body.title,
          company: req.body.company,
          location: req.body.location,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        //Add to experience array
        profile.experience.unshift(newExp); // unshift method adds elements to beginning of the array & returns new length

        profile.save().then(profile => resp.json(profile));
      })
      .catch(err => resp.status(404).json(err));
  }
);

//@route    POST api/profile/education
//@desc     Add education to profile
//@access   Private

router.post(
  '/education',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const { errors, isValid } = validateEducationInput(req.body);

    //Check Validation
    if (!isValid) {
      //return any errors with 400 status
      return resp.status(400).json(errors);
    }
    Profile.findOne({ user: req.user.id }) // req.user.id comes from the token
      .then(profile => {
        const newEdu = {
          school: req.body.school,
          degree: req.body.degree,
          fieldofstudy: req.body.fieldofstudy,
          from: req.body.from,
          to: req.body.to,
          current: req.body.current,
          description: req.body.description
        };

        //Add to experience array
        profile.education.unshift(newEdu);
        profile.save().then(profile => resp.json(profile));
      });
  }
);

//@route    DELETE api/profile/experience/id
//@desc     Delete experience from profile
//@access   Private

router.delete(
  '/experience/:exp_id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Get remove index
        const removeIndex = profile.experience
          .map(item => item.id)
          .indexOf(req.params.exp_id);

        //Splice out of array
        profile.experience.splice(removeIndex, 1);

        //Save the
        profile.save().then(profile => resp.json(profile));
      })
      .catch(err => resp.status(404).json(err));
  }
);

//@route    DELETE api/profile/education/id
//@desc     Delete education from profile
//@access   Private

router.delete(
  '/education/:edu_id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOne({ user: req.user.id })
      .then(profile => {
        //Get remove index
        const removeIndex = profile.education
          .map(item => item.id)
          .indexOf(req.params.edu_id);

        //Splice out of array
        profile.education.splice(removeIndex, 1);

        //Save the
        profile.save().then(profile => resp.json(profile));
      })
      .catch(err => resp.status(404).json(err));
  }
);

//@route    DELETE api/profile/
//@desc     Delete user and profile
//@access   Private

router.delete(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        resp.json({ success: true });
      });
    });
  }
);

module.exports = router;
