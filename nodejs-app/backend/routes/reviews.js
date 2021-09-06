const express = require('express');

const router = express.Router({ mergeParams: true });

const reviewController = require('../controller/reviews');
const auth = require('../controller/auth');

router.use(auth.protect);

router
  .route('/')
  .get(reviewController.getReviews)
  .post(auth.restrictTo('user'), reviewController.createReview);

router
  .route('/:id')
  .get(reviewController.getOneReviews)
  .patch(auth.restrictTo('user', 'admin'), reviewController.updateReview)
  .delete(auth.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;
