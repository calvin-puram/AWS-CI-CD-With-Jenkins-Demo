const Reviews = require('../models/Reviews');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./factoryHandler');

//@desc   Get All Reviews
//@route  Get api/v1/tours/reviews
//@access public
exports.getReviews = factory.getHandler(Reviews);

//@desc   Get Single Reviews
//@route  Get api/v1/tours/reviews/:id
//@access public
exports.getOneReviews = catchAsync(async (req, res, next) => {
  const review = await Reviews.findById(req.params.id);

  if (!review) {
    return next(
      new AppError(`No resource found with this id: ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

//@desc   Create Reviews
//@route  Get api/v1/tours/:tourId/reviews
//@access private
exports.createReview = catchAsync(async (req, res, next) => {
  req.body.tour = req.params.tourId;
  req.body.user = req.user.id;
  const review = await Reviews.create(req.body);

  res.status(201).json({
    success: true,
    data: review
  });
});

//@desc   update Reviews
//@route  Get api/v1/tours/reviews/:id
//@access private
exports.updateReview = catchAsync(async (req, res, next) => {
  let review = await Reviews.findById(req.params.id);

  if (!review) {
    return next(
      new AppError(`No resource found with this id: ${req.params.id}`, 404)
    );
  }

  if (review.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError(`You are not authorize to perform this action`, 401)
    );
  }

  review = await Reviews.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: review
  });
});

//@desc   delete Reviews
//@route  Get api/v1/tours/reviews/:id
//@access private
exports.deleteReview = catchAsync(async (req, res, next) => {
  let review = await Reviews.findById(req.params.id);

  if (!review) {
    return next(
      new AppError(`No resource found with this id: ${req.params.id}`, 404)
    );
  }
  

  if (review.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(
      new AppError(`You are not authorize to perform this action yes`, 401)
    );
  }

  review = await Reviews.findByIdAndRemove(req.params.id);

  res.status(200).json({
    success: true,
    data: {}
  });
});
