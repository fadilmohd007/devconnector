const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const User = require('../../models/User');
const profile = require('../../models/Profile');

//@route POST api/posts
//@desc create a post
//@access private
router.post(
  '/',
  [
    auth,
    [
      check('text', 'text is requiers')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();
      res.send(post);
    } catch (err) {
      console.error(err.message);
      res.status(500).json('server error');
    }
  }
);

//@route GET api/posts
//@desc get all post
//@access private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('server error');
  }
});

//@route GET api/posts/:id
//@desc get  post by id
//@access private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'post not found ' });
    }
    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'post not found ' });
    }
    console.error(err.message);
    res.status(500).json('server error');
  }
});

//@route DELETE api/posts/:id
//@desc delete a post
//@access private
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'post not found ' });
    }
    //check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not autherised' });
    }

    await post.remove();

    res.json(post);
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'post not found ' });
    }
    console.error(err.message);
    return res.status(500).json('server error');
  }
});

//@route PUT api/posts/like/:id
//@desc like a post
//@access private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'post already liked' });
    }

    post.likes.unshift({ user: req.user.id });
    await post.save();
    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json('server error');
  }
});

//@route PUT api/posts/unlike/:id
//@desc dislike a post
//@access private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //check if the post has already been liked
    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length ===
      0
    ) {
      return res.status(400).json({ msg: 'post not liked to unlike' });
    }
    //GET remove indeex
    const removeIndex = post.likes
      .map(like => like.user.toString())
      .indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    return res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json('server error');
  }
});

//@route POST api/posts/comment/:id
//@desc comment on a post by id
//@access private
router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'text is requierd')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const post = await Post.findById(req.params.id);
      const user = await User.findById(req.user.id);
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      post.comments.unshift(newComment);
      await post.save();
      res.send(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).json('server error');
    }
  }
);

//@route DELETE api/posts/comment/:id/:comment_id
//@desc deelte a comment on a post by id
//@access private
router.delete('/comment/:id/comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    //pull ot the comment ffrom the post
    const comment = post.comments.find(
      comment => comment.id === req.params.comment_id
    );

    if (!comment) {
      return res.status(404).json({ msg: 'comment does not exist' });
    }
    //check user
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'user not authorised' });
    }
    // ||post.user.toString !== req.user.id
    //GET remove indeex
    const removeIndex = post.comments
      .map(comment => comment.user.toString())
      .indexOf(req.user.id);
    post.comments.splice(removeIndex, 1);
    await post.save();
    return res.json(post.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('server error');
  }
});

module.exports = router;
