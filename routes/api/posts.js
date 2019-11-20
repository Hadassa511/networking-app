const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

//Load post model
const Post = require('../../model/Post');
//Profile model
const Profile = require('../../model/Profile');

//Post Validation
const validatePostInput = require('../../validations/post');

//@route    Get api/posts/test
//@desc     Tests post route
//@access   Public
router.get('/test', (req, resp) => resp.json({ msg: 'Posts works' }));

//@route    Get api/posts
//@desc     Get posts
//@access   Public
router.get('/', (req, resp) => {
  Post.find()
    .sort({ date: -1 })
    .then(posts => resp.json(posts))
    .catch(err => resp.status(404));
});

//@route    Get api/posts/:id
//@desc     Get post by id
//@access   Public
router.get('/:id', (req, resp) => {
  Post.findById(req.params.id)
    .sort({ date: -1 })
    .then(post => resp.json(post))
    .catch(err =>
      resp.status(404).json({ post: 'no post found with this id' })
    );
});

//@route    POST api/post
//@desc     Create
//@access   Private

router.post(
  '/',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const { errors, isValid } = validatePostInput(req.body);

    //Check validation
    if (!isValid) {
      //if any errors send 400 with error object
      return resp.status(404).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => resp.json(post));
  }
);

//@route    Delete api/posts/:id
//@desc     Delete post
//@access   Private

router.delete(
  '/:id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner
          if (post.user.toString() !== req.user.id) {
            return resp.status(404).json({
              notauthorized: 'User is not authorized to delete the post'
            });
          }
          //Delete
          post.remove().then(() => resp.json({ success: true }));
        })
        .catch(err =>
          resp.status(404).json({ postnotfound: 'there is no post' })
        );
    });
  }
);

//@route    POST api/posts/like/:id
//@desc     Like post
//@access   Private

router.post(
  '/like/:id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return resp
              .status(400)
              .json({ alreadyliked: 'Post already liked by the user' });
          }

          //Add user id to the likes array
          post.likes.unshift({ user: req.user.id });

          //Save the data to DB
          post.save().then(post => resp.json(post));
        })
        .catch(err => resp.status(404));
    });
  }
);

//@route    POST api/posts/unlike/:id
//@desc     Unlike post
//@access   Private

router.post(
  '/unlike/:id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return resp
              .status(400)
              .json({ notliked: 'Post already unliked by the user' });
          }
          //Get remove index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          //Splice out of likes array
          post.likes.splice(removeIndex, 1);

          //Save the data to DB
          post.save().then(post => resp.json(post));
        })
        .catch(err =>
          resp.status(404).json({ notfound: 'Post not found to unlike' })
        );
    });
  }
);

//@route    POST api/posts/comment/:id
//@desc     Add comment to a post
//@access   Private

router.post(
  '/comment/:id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    const { errors, isValid } = validatePostInput(req.body);
    //Check validation
    if (!isValid) {
      //if any errors send 400 with error object
      return resp.status(404).json(errors);
    }
    Post.findById(req.params.id) //params means we will get the user post id from URL
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        //Add to comments array
        post.comments.unshift(newComment);

        //Save
        post.save().then(post => resp.json(post));
      })
      .catch(err => resp.status(404).json({ postnotfound: 'No post found' }));
  }
);

//@route    DELETE api/posts/comment/:id/:comment_id
//@desc     Delete comment of a post
//@access   Private

router.delete(
  '/comment/:id/:comment_id',
  passport.authenticate('jwt', { session: false }),
  (req, resp) => {
    Post.findById(req.params.id) //params means we will get the user post id from URL
      .then(post => {
        //Check to see if comment exists
        if (
          post.comments.filter(
            comment => comment.id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return resp.status(404).json({ comment: 'Comment doesnt exists' });
        }
        //Get remove index
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        //Splice comment from array
        post.comments.splice(removeIndex, 1);

        //Save it to DB
        post.save().then(post => resp.json(post));
      })
      .catch(err =>
        resp
          .status(404)
          .json({ postnotfound: 'There are no comments for this post' })
      );
  }
);
module.exports = router;
