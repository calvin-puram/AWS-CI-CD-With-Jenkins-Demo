const express = require('express');

const router = express.Router();

const toursController = require('../controller/tours');
const ReviewRouter = require('./reviews');
const auth = require('../controller/auth');

//router
router.use('/:tourId/reviews', ReviewRouter);

//tours within
router.get('/:distance/center/:latlng/unit/:unit', toursController.toursWithin);
//calc tour distances
router.get('/distance/:latlng/unit/:unit', toursController.getTourDistance);

//top5cheap
router.get('/top5cheap', toursController.top5cheap, toursController.getTours);
//tour stat
router.get('/tourstat', toursController.getTourStats);
router.get(
  '/monthly-plan/:year',
  auth.protect,
  auth.restrictTo('lead-guide', 'admin', 'lead-guide'),
  toursController.getTourMonthlyPlan
);

router
  .route('/')
  .get(toursController.getTours)
  .post(
    auth.protect,
    auth.restrictTo('lead-guide', 'admin'),
    toursController.createTours
  );

router
  .route('/:id')
  .get(toursController.getOneTour)
  .patch(
    auth.protect,
    auth.restrictTo('lead-guide', 'admin'),
    toursController.updateTour
  )
  .delete(
    auth.protect,
    auth.restrictTo('lead-guide', 'admin'),
    toursController.deleteTours
  );

module.exports = router;
