const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const jwtDecode = require('jwt-decode');
const gravatar = require('gravatar');
const normalize = require('normalize-url');

const Users = require('../models/Users');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/email');
const getFacebookUserData = require('../utils/getfacebookuserdata');
const getAccessTokenFromCode = require('../utils/getFacebookAccessToken');

const sendToken = (user, res, statusCode) => {
  const token = user.sendJWT();

  user.password = undefined;
  res.status(statusCode).json({
    success: true,
    token
  });
};

//@desc   Register Users
//@route  Get api/v1/users/signup
//@access public
exports.signup = catchAsync(async (req, res, next) => {
  const {
    name,
    email,
    password,
    passwordConfirm,
    passwordChangeAt,
    role,
    passwordResetExpires,
    passwordResetToken
  } = req.body;

  const checkUser = await Users.findOne({ email });

  if (checkUser) {
    return res.status(400).json({
      success: false,
      msg: 'user already in the database'
    });
  }

  const avatar = normalize(
    gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    }),
    { forceHttps: true }
  );

  const user = await Users.create({
    name,
    email,
    password,
    photo: avatar,
    passwordConfirm,
    passwordChangeAt,
    role,
    passwordResetExpires,
    passwordResetToken
  });

  sendToken(user, res, 201);
});

//@desc   login Users
//@route  Get api/v1/users/login
//@access public
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      msg: 'email and password are required'
    });
  }

  const user = await Users.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password, user.password))) {
    return res.status(401).json({
      success: false,
      msg: 'Invalid credential'
    });
  }

  sendToken(user, res, 201);
});

//@desc   social login
//@route  Get api/v1/auth/social
//@access public
exports.social = catchAsync(async (req, res, next) => {
  const userdata = {
    client_id: req.body.client_id,
    redirect_uri: req.body.redirect_uri,
    code: req.body.code
  };

  if (req.params.provider === 'google') {
    userdata.client_secret = process.env.GOOGLE_CLIENT_SECRET;
    userdata.grant_type = 'authorization_code';

    try {
      const { data } = await axios.post(
        'https://oauth2.googleapis.com/token',
        userdata
      );
      const user = jwtDecode(data.id_token);
      const checkUser = await Users.findOne({ email: user.email });

      if (!checkUser) {
        const newUser = await Users.create({
          name: user.name,
          email: user.email,
          photo: user.picture,
          password: user.at_hash,
          passwordConfirm: user.at_hash
        });

        return sendToken(newUser, res, 201);
      }

      sendToken(checkUser, res, 201);
    } catch (err) {
      if (err) {
        return next(new AppError(err.response.data.error_description, 400));
      }
    }
  }

  if (req.params.provider === 'facebook') {
    userdata.client_secret = process.env.FACEBOOK_CLIENT_SECRET;

    try {
      const accessToken = await getAccessTokenFromCode(userdata);

      const user = await getFacebookUserData(accessToken);
      console.log(user);
      if (!user.email) {
        return next(new AppError('user email not found', 400));
      }

      const checkUser = await Users.findOne({ email: user.email });

      if (!checkUser) {
        const newUser = await Users.create({
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          photo: user.picture.data.url,
          password: user.id,
          passwordConfirm: user.id
        });

        return sendToken(newUser, res, 201);
      }

      sendToken(checkUser, res, 201);
    } catch (err) {
      if (err) {
        return next(new AppError(err.response.data.error.message, 400));
      }
    }
  }
});

//@desc   protect route
//@route  middleware
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      msg: 'you are not logged in'
    });
  }

  const decode = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // check if user exist
  const currentUser = await Users.findById(decode.id);

  if (!currentUser) {
    return res.status(401).json({
      success: false,
      msg: 'user no longer exist'
    });
  }

  if (currentUser.checkpassword(decode.iat)) {
    return res.status(401).json({
      success: false,
      msg: 'this user recently changed his password. login again'
    });
  }

  req.user = currentUser;

  //authorize user
  next();
});

//@desc  user role access
//@route middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(401).json({
        success: false,
        msg: 'You are not authorize to perform this action'
      });
    }
    next();
  };
};

//@desc   Forgot Password
//@route  POST api/v1/users/forgotPassword
//@access public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({
      success: false,
      msg: 'email field is required'
    });
  }

  const user = await Users.findOne({ email: req.body.email });

  if (!user) {
    return res.status(401).json({
      success: false,
      msg: 'this email is not registered'
    });
  }

  const resetToken = user.forgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const reply = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/resetToken/${resetToken}`;

  const message = `You recently requested for a password reset. You can submit a PATCH request to this URL \n ${reply}. If you don't know anything about this please ignore`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token <expires in 10mins time',
      message
    });

    res.status(200).json({
      success: true,
      msg: 'your password reset token has been sent to your email'
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('your reset token could not be sent. Please try again', 500)
    );
  }
});

//@desc   reset Password
//@route  PATCH api/v1/users/resetPassword
//@access public
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update()
    .digest('hex');

  const user = await Users.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Invalid Credentials', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendToken(user, res, 200);
});

//@desc   update Password
//@route  PATCH api/v1/users/updatePassword
//@access private
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      msg: 'all fields are required'
    });
  }

  const user = await Users.findById(req.user.id).select('+password');

  if (!user || !(await user.comparePassword(currentPassword, user.password))) {
    return res.status(401).json({
      success: false,
      msg: 'Invalid Credentials'
    });
  }

  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  sendToken(user, res, 200);
});
