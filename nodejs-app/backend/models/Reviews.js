const mongoose = require('mongoose');

const { Schema } = mongoose;

const ReviewsSchma = new Schema({
  review: {
    type: String,
    required: [true, 'a review is required']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  tour: {
    type: Schema.Types.ObjectId,
    ref: 'Tours',
    required: true
  }
});

ReviewsSchma.index({ tour: 1, user: 1 }, { unique: true });

ReviewsSchma.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

// calulate average ratings
ReviewsSchma.statics.calcRating = async function(tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId }
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        ratingsAverage: { $avg: '$rating' }
      }
    }
  ]);
  if (stats.length > 0) {
    await this.model('Tours').findByIdAndUpdate(tourId, {
      ratingsAverage: stats[0].ratingsAverage,
      ratingsQuantity: stats[0].nRating
    });
  } else {
    await this.model('Tours').findByIdAndUpdate(tourId, {
      ratingsAverage: 4.5,
      ratingsQuantity: 0
    });
  }
};

ReviewsSchma.post('save', function() {
  this.constructor.calcRating(this.tour);
});

//update ratings average
ReviewsSchma.pre(/^findOneAnd/, async function(next) {
  this.r = await this.findOne();
  next();
});

ReviewsSchma.post(/^findOneAnd/, async function() {
  await this.r.constructor.calcRating(this.r.tour);
});

const Reviews = mongoose.model('Reviews', ReviewsSchma);
module.exports = Reviews;
