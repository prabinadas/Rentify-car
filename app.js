const express = require('express');
const app = express();
const morgan = require('morgan');
const userModel = require('./models/userform');
const dbconnection = require('./config/dbfrom');
const path = require('path');
const session = require('express-session');
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
require('./config/passport')(passport);
const MongoStore = require('connect-mongo');
const loginModel = require('./models/loginModel'); // Assuming you have a login model
const bookingRoutes = require('./routes/booking.routes');



app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, "public")));
app.use('/bookings', bookingRoutes);
//express session
app.use(session({
    secret: 'secretKey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/carwebsite' })
}));

//passport middleware
app.use(passport.initialize());
app.use(passport.session());

// page for rendering in web
app.get('/', (req, res) => {
    res.render('gudu', { user: req.user });
});
app.get('/gudu', (req, res) => {
    res.render('gudu', { user: req.user });
});
app.get('/gudi', (req, res) => {
    res.render('index');
});
app.get('/login', (req, res) => {
    // Get message from query string if present
    const message = req.query.message || null;
    res.render('login', { message });
});

app.get('/signup', (req, res) => {
    res.render('signup');
});

//logout route
app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/gudu');
    });
});

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}


// redirect profile page
app.get('/profile', ensureAuthenticated, async (req, res) => {
    const userBookings = await bookingModel.find({ userId: req.user._id });
    const message = req.query.message || null;
    res.render('profile', { user: req.user, userBookings, message });
});


// Signup route
app.post('/users/signup', async (req, res) => {
    const { username, email,phnumber, password } = req.body;
    // Check if user already exists
    const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        return res.render('signup', { message: 'Username or email already exists!' });
    }
    await userModel.create({ username, email,phnumber, password });
    // res.render('signup', { message: 'User registered successfully!' });
    // console.log('go to the loginpage:', '/login');

    res.redirect('/login?message=User registered successfully!');
});

// Login route
app.post('/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await userModel.findOne({ username });
    if (!user || user.password !== password) {
        return res.render('login', { message: 'Invalid username or password!' });
    }
    // Log the user in (using passport or session)
    req.login(user, function (err) {
        if (err) { return res.render('login', { message: 'Login error!' }); }
        return res.redirect('/gudu');
    });
});
// ...existing code...

// Middleware to protect routes
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login');
}

// Profile route (shows logged-in user's info)
app.get('/profile', ensureAuthenticated, async (req, res) => {
    const userBookings = await bookingModel.find({ userId: req.user._id });
    const message = req.query.message || null;
    res.render('profile', { user: req.user, userBookings, message });
});


//pass booking car
app.get('/book', ensureAuthenticated, (req, res) => {
    const carName = req.query.carName;
    res.render('booking', { user: req.user, carName });
});
//Booking detail routes
const bookingModel = require('./models/booking');
app.post('/book', ensureAuthenticated, async (req, res) => {
    const { carName, deliveryType, pickingDate, droppingDate } = req.body;
    // Check if car is already booked for the selected dates (optional)
    await bookingModel.create({
        carName,
        userId: req.user._id,
        deliveryType,
        pickingDate,
        droppingDate,
        status: 'pending'
    });
    res.redirect('/payment?carName=' + encodeURIComponent(carName));
});
// cancel ride



//Scanner page
app.get('/payment', ensureAuthenticated, (req, res) => {
    const carName = req.query.carName;
    res.render('payment', { user: req.user, carName });
});
//razopay on
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
    key_id: 'YOUR_KEY_ID',
    key_secret: 'YOUR_KEY_SECRET'
});
//delete in mongodb
// app.delete('/booking.routes/cancel-booking/:id', async (req, res) => {
//   try {
//     const booking = await Booking.findByIdAndDelete(req.params.id);
//     if (!booking) return res.status(404).send('Booking not found');
//     res.status(200).send('Booking cancelled');
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });
app.post('/create-order', async (req, res) => {
    const { amount } = req.body; // amount in paise (e.g., 100 = ₹1)
    const options = {
        amount: amount,
        currency: "INR",
        receipt: "order_rcptid_11"
    };
    try {
        const order = await razorpay.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).send("Error creating order");
    }
});

// Book a car

app.post('/get-from-data', (req, res) => {
    console.log(req.body);
    res.send('data received');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000 http://localhost:3000');
});