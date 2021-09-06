const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/ApiFeatures');

//@desc   Delete Resource
exports.deleteHandler = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findByIdAndRemove(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        msg: `No Resource Found With id: ${req.params.id}`
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  });

//@desc   Update Resource
exports.updateHandler = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        msg: `No Resource Found With id: ${req.params.id}`
      });
    }

    const newDoc = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: newDoc
    });
  });

//@desc   Create Resource
exports.createHandler = model =>
  catchAsync(async (req, res, next) => {
    const doc = await model.create(req.body);

    res.status(201).json({
      success: true,
      data: doc
    });
  });

//@desc   Get Single Resource
exports.getSingleHandler = (model, populate) =>
  catchAsync(async (req, res, next) => {
    let query = model.findById(req.params.id);

    if (populate) {
      query = query.populate(populate);
    }
    const doc = await query;

    if (!doc) {
      return next(
        new AppError(`No Resource Found With id: ${req.params.id}`, 404)
      );
    }

    res.status(200).json({
      success: true,
      data: doc
    });
  });

// @desc Get Resource
exports.getHandler = model =>
  catchAsync(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const features = new ApiFeatures(model.find(filter), req.query)
      .filter()
      .sorting()
      .limiting()
      .paginate();
    const doc = await features.model;

    res.status(200).json({
      success: true,
      results: doc.length,
      data: doc
    });
  });
