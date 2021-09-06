const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const Tours = require('./models/Tours');
const Users = require('./models/Users');
const Reviews = require('./models/Reviews');

const connectDB = require('./config/db');

dotenv.config({ path: './.env' });

connectDB();

const toursData = JSON.parse(
  fs.readFileSync(path.join(__dirname, './dev-data/data/tours.json'), 'utf-8')
);

const UsersData = JSON.parse(
  fs.readFileSync(path.join(__dirname, './dev-data/data/users.json'), 'utf-8')
);

const ReviewsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, './dev-data/data/reviews.json'), 'utf-8')
);

const importData = async () => {
  try {
    await Tours.create(toursData);
    await Users.create(UsersData);
    await Reviews.create(ReviewsData);
    console.log('data successfully imported');
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};
const deleteData = async () => {
  try {
    await Tours.deleteMany();
    await Users.deleteMany();
    await Reviews.deleteMany();
    console.log('data successfully removed');
    process.exit();
  } catch (err) {
    console.log(err.message);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
}
