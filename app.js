require('dotenv').config();
const express = require('express');
const app = express();
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const MongoStore = require('connect-mongo').default || require('connect-mongo');
const Razorpay = require('razorpay');

// Models & DB
const userModel = require('./models/userform');
const bookingModel = require('./models/booking');
const bookingRoutes = require('./routes/booking.routes');
const connectDB = require('./config/dbfrom');

// Connect Database
connectDB();

// Passport configuration
require('./config/passport')(passport);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'rentifySecretKey2026',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Mount Bookings Router
app.use('/bookings', bookingRoutes);

// Helper: Ensure Default Admin User exists
async function ensureAdminUser() {
    try {
        const adminUsername = 'adminrentify';
        const adminEmail = 'adminrentify2@gmail.com';
        const adminPassword = 'rentifycar';

        let admin = await userModel.findOne({
            $or: [{ username: adminUsername }, { email: adminEmail }]
        });

        if (!admin) {
            admin = await userModel.create({
                username: adminUsername,
                email: adminEmail,
                password: adminPassword,
                phnumber: 9999999999,
                role: 'admin'
            });
            console.log('✅ Admin account initialized:', adminUsername);
        } else {
            let needsSave = false;
            if (admin.role !== 'admin') {
                admin.role = 'admin';
                needsSave = true;
            }
            if (admin.password !== adminPassword) {
                admin.password = adminPassword;
                needsSave = true;
            }
            if (needsSave) {
                await admin.save();
            }
            console.log('✅ Admin account verified:', adminUsername);
        }
    } catch (err) {
        console.error('Error verifying admin account:', err.message);
    }
}
ensureAdminUser();

// Helper: Match Car Images
function getCarImage(carName) {
    if (!carName) return '/Thar_Roxx_602x339.png';
    const name = String(carName).toLowerCase();
    if (name.includes('roxx') || name.includes('thar')) return '/Thar_Roxx_602x339.png';
    if (name.includes('scorpio')) return '/scerpion_day.png';
    if (name.includes('700')) return '/xuv700.png';
    if (name.includes('3xo')) return '/xuv 3xo.png';
    if (name.includes('safari')) return '/safari-navigation.png';
    if (name.includes('harrier')) return '/harrier-navigation.png';
    if (name.includes('punch')) return '/punch-navigation.png';
    if (name.includes('curvv')) return '/Curvv-pv.png';
    if (name.includes('bolero')) return '/Bolero_602x339.png';
    if (name.includes('cx-5') || name.includes('cx5')) return '/deals-7.png';
    if (name.includes('cx-30')) return '/deals-8.png';
    if (name.includes('cx-9')) return '/deals-9.png';
    if (name.includes('corolla')) return '/deals-10.png';
    if (name.includes('innova')) return '/deals-11.png';
    if (name.includes('fortuner')) return '/deals-12.png';
    if (name.includes('amaze')) return '/deals-13.png';
    if (name.includes('elevate')) return '/deals-14.png';
    if (name.includes('city')) return '/deals-15.png';
    return '/Thar_Roxx_602x339.png';
}

// Master Fleet Cars Definition for Admin
const masterFleet = [
    { name: 'Thar Roxx', category: 'Off-Road 4x4 SUV', price: 900, image: '/Thar_Roxx_602x339.png', seats: 5, fuel: 'Diesel', trans: 'Manual' },
    { name: 'Scorpio N', category: 'Rugged 7-Seater SUV', price: 600, image: '/scerpion_day.png', seats: 7, fuel: 'Diesel', trans: 'Manual' },
    { name: 'Xuv 700', category: 'Luxury Tech SUV', price: 700, image: '/xuv700.png', seats: 7, fuel: 'Petrol/Diesel', trans: 'Automatic' },
    { name: 'Safari', category: 'Flagship Premium SUV', price: 1000, image: '/safari-navigation.png', seats: 7, fuel: 'Diesel', trans: 'Automatic' },
    { name: 'Harrier', category: 'Dynamic Mid SUV', price: 1500, image: '/harrier-navigation.png', seats: 5, fuel: 'Diesel', trans: 'Automatic' },
    { name: 'Punch', category: 'Urban Micro SUV', price: 1500, image: '/punch-navigation.png', seats: 5, fuel: 'Petrol', trans: 'Manual' },
    { name: 'Tata Curvv', category: 'Aero Coupe SUV', price: 1200, image: '/Curvv-pv.png', seats: 5, fuel: 'EV / Petrol', trans: 'Automatic' },
    { name: 'Innova', category: 'Comfort Family MUV', price: 1500, image: '/deals-11.png', seats: 7, fuel: 'Diesel', trans: 'Manual' },
    { name: 'Fortuner', category: 'Commanding 4x4 SUV', price: 1500, image: '/deals-12.png', seats: 7, fuel: 'Diesel', trans: 'Automatic' },
    { name: 'Mahindra EV', category: 'Next-Gen Electric SUV', price: 1100, image: '/mahindraev.png', seats: 5, fuel: 'Electric', trans: 'Automatic' }
];

// Helper: Check if a user is Admin
function isAdminUser(user) {
    if (!user) return false;
    return (
        user.role === 'admin' ||
        user.username === 'adminrentify' ||
        user.email === 'adminrentify2@gmail.com'
    );
}

// Authentication Middlewares
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/login?message=Please log in to continue');
}

function ensureAdmin(req, res, next) {
    if (req.isAuthenticated()) {
        if (isAdminUser(req.user)) return next();
        return res.redirect('/profile?message=Access denied. Administrator only.');
    }
    res.redirect('/login?message=Please login with administrator credentials');
}

// Razorpay Instance (Safe fallback if keys aren't set)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_rentify_demo';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'secret_rentify_demo';
let razorpay = null;
try {
    razorpay = new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret });
} catch (e) {
    console.log('Razorpay placeholder initialized');
}

// ==========================================
// PUBLIC & HOME ROUTES
// ==========================================
app.get('/', (req, res) => {
    res.render('gudu', { user: req.user, isAdmin: isAdminUser(req.user) });
});

app.get('/gudu', (req, res) => {
    res.render('gudu', { user: req.user, isAdmin: isAdminUser(req.user) });
});

app.get('/gudi', (req, res) => {
    res.render('index');
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================
app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        return isAdminUser(req.user) ? res.redirect('/admin') : res.redirect('/profile');
    }
    const message = req.query.message || null;
    res.render('login', { message, user: req.user });
});

app.get('/signup', (req, res) => {
    if (req.isAuthenticated()) {
        return isAdminUser(req.user) ? res.redirect('/admin') : res.redirect('/profile');
    }
    res.render('signup', { message: req.query.message || null });
});

app.get('/logout', (req, res) => {
    req.logout(() => {
        res.redirect('/login?message=Logged out successfully');
    });
});

app.post('/users/signup', async (req, res) => {
    try {
        const { username, email, phnumber, password } = req.body;
        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.render('signup', { message: 'Username or email already exists!' });
        }
        await userModel.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            phnumber,
            password,
            role: 'user'
        });
        res.redirect('/login?message=Account created successfully! Please login.');
    } catch (err) {
        console.error('Signup error:', err);
        res.render('signup', { message: 'Registration failed. Please try again.' });
    }
});

app.post('/users/login', async (req, res) => {
    try {
        const identifier = (req.body.username || '').trim();
        const password = (req.body.password || '').trim();

        if (!identifier || !password) {
            return res.render('login', { message: 'Please enter username/email and password!' });
        }

        // Check if admin credentials were entered
        const isAdminAttempt =
            (identifier.toLowerCase() === 'adminrentify' || identifier.toLowerCase() === 'adminrentify2@gmail.com') &&
            password === 'rentifycar';

        let user = await userModel.findOne({
            $or: [
                { username: identifier },
                { email: identifier.toLowerCase() }
            ]
        });

        // Auto-provision admin user if logging in for the first time
        if (!user && isAdminAttempt) {
            user = await userModel.create({
                username: 'adminrentify',
                email: 'adminrentify2@gmail.com',
                password: 'rentifycar',
                phnumber: 9999999999,
                role: 'admin'
            });
        }

        if (!user || user.password !== password) {
            return res.render('login', { message: 'Invalid username/email or password!' });
        }

        req.login(user, function (err) {
            if (err) {
                return res.render('login', { message: 'Login session error!' });
            }
            if (isAdminUser(user)) {
                return res.redirect('/admin');
            }
            return res.redirect('/profile');
        });
    } catch (err) {
        console.error('Login error:', err);
        res.render('login', { message: 'Login processing error. Please try again.' });
    }
});

// ==========================================
// USER DASHBOARD ROUTE
// ==========================================
app.get('/profile', ensureAuthenticated, async (req, res) => {
    try {
        const userBookings = await bookingModel
            .find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();

        // Calculate User Dashboard Stats
        const totalBookings = userBookings.length;
        const activeBookings = userBookings.filter(b =>
            ['booked', 'confirmed'].includes(String(b.status || '').toLowerCase())
        ).length;
        const pendingPayments = userBookings.filter(b =>
            String(b.paymentStatus || '').toLowerCase() !== 'paid' &&
            String(b.status || '').toLowerCase() !== 'cancelled'
        ).length;
        const totalSpent = userBookings
            .filter(b => String(b.paymentStatus || '').toLowerCase() === 'paid')
            .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

        const stats = {
            totalBookings,
            activeBookings,
            pendingPayments,
            totalSpent
        };

        const message = req.query.message || null;

        res.render('profile', {
            user: req.user,
            isAdmin: isAdminUser(req.user),
            userBookings,
            stats,
            getCarImage,
            message
        });
    } catch (error) {
        console.error('Profile route error:', error);
        res.status(500).send('Unable to load user dashboard');
    }
});

// ==========================================
// CAR BOOKING & PAYMENT FLOW
// ==========================================
app.get('/book', ensureAuthenticated, (req, res) => {
    const carName = req.query.carName || 'Thar Roxx';
    const pricePerDay = req.query.price || 900;

    res.render('booking', {
        user: req.user,
        carName,
        pricePerDay,
        getCarImage
    });
});

app.post('/payment', ensureAuthenticated, async (req, res) => {
    try {
        const {
            carName,
            deliveryType,
            deliveryAddress,
            pickingDate,
            droppingDate,
            pricePerDay,
            totalAmount
        } = req.body;

        const booking = await bookingModel.create({
            carName: carName || 'Thar Roxx',
            userId: req.user._id,
            deliveryType: deliveryType || 'Home Delivery',
            deliveryAddress: deliveryAddress || 'Branch Office / Counter',
            pickingDate: pickingDate ? new Date(pickingDate) : new Date(),
            droppingDate: droppingDate ? new Date(droppingDate) : new Date(Date.now() + 86400000),
            pricePerDay: Number(pricePerDay) || 900,
            totalAmount: Number(totalAmount) || Number(pricePerDay) || 900,
            status: 'booked',
            paymentStatus: 'unpaid'
        });

        res.render('payment', {
            user: req.user,
            carName: booking.carName,
            deliveryType: booking.deliveryType,
            deliveryAddress: booking.deliveryAddress,
            pickingDate: pickingDate || new Date().toISOString().slice(0, 10),
            droppingDate: droppingDate || new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            pricePerDay: booking.pricePerDay,
            totalAmount: booking.totalAmount,
            bookingId: booking._id,
            getCarImage
        });
    } catch (err) {
        console.error('Booking checkout error:', err);
        res.redirect('/profile?message=Error processing booking checkout');
    }
});

// Pay at Counter option
app.post('/payment/cash', ensureAuthenticated, async (req, res) => {
    try {
        const booking = await bookingModel.findOneAndUpdate(
            { _id: req.body.bookingId, userId: req.user._id },
            { paymentStatus: 'cash', status: 'booked' },
            { new: true }
        );
        if (!booking) return res.status(404).send('Booking not found');
        res.redirect('/profile?message=Booking confirmed! Payment will be collected at counter.');
    } catch (err) {
        console.error('Cash payment selection error:', err);
        res.redirect('/profile?message=Unable to confirm counter payment');
    }
});

// Complete Online Payment (Real or Simulated)
app.post('/payment/complete', ensureAuthenticated, async (req, res) => {
    try {
        const paymentId = req.body.paymentId || ('PAY_ONLINE_' + Date.now().toString(36).toUpperCase());
        const booking = await bookingModel.findOneAndUpdate(
            { _id: req.body.bookingId, userId: req.user._id },
            {
                paymentStatus: 'paid',
                paymentId: paymentId,
                status: 'booked'
            },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: 'Payment recorded successfully', paymentId });
    } catch (err) {
        console.error('Online payment completion error:', err);
        res.status(500).json({ success: false, message: 'Payment recording failed' });
    }
});

// Razorpay / Online Order creation with graceful fallback
app.post('/create-order', async (req, res) => {
    const { amount } = req.body;
    const fallbackOrderId = 'order_rentify_' + Date.now();

    if (!razorpay || razorpayKeyId === 'YOUR_KEY_ID' || razorpayKeyId === 'rzp_test_rentify_demo') {
        // Return simulated order so UI can proceed cleanly without crashing
        return res.json({
            id: fallbackOrderId,
            amount: amount || 10000,
            currency: 'INR',
            isMock: true
        });
    }

    try {
        const order = await razorpay.orders.create({
            amount: amount,
            currency: 'INR',
            receipt: 'rcpt_' + Date.now()
        });
        res.json(order);
    } catch (err) {
        console.warn('Razorpay order fallback engaged:', err.message);
        res.json({
            id: fallbackOrderId,
            amount: amount || 10000,
            currency: 'INR',
            isMock: true
        });
    }
});

// ==========================================
// ADMIN DASHBOARD & CONTROLS
// ==========================================
app.get('/admin', ensureAdmin, async (req, res) => {
    try {
        const [users, bookings] = await Promise.all([
            userModel.find().lean(),
            bookingModel.find().sort({ createdAt: -1 }).lean()
        ]);

        const usersById = new Map(users.map(user => [String(user._id), user]));

        const adminBookings = bookings.map(booking => {
            const user = usersById.get(String(booking.userId));
            const total = Number(booking.totalAmount || booking.pricePerDay || 0);
            return {
                ...booking,
                totalAmount: total,
                userName: user?.username || 'Customer',
                userEmail: user?.email || 'N/A',
                userPhone: user?.phnumber || 'N/A'
            };
        });

        // Compute Financial Metrics
        const paidBookingsList = adminBookings.filter(b => String(b.paymentStatus || '').toLowerCase() === 'paid');
        const unpaidBookingsList = adminBookings.filter(b =>
            String(b.paymentStatus || '').toLowerCase() !== 'paid' &&
            String(b.status || '').toLowerCase() !== 'cancelled'
        );

        const totalRevenue = paidBookingsList.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
        const pendingMoney = unpaidBookingsList.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);

        // Active Bookings for Fleet Occupancy calculation
        const activeBookings = adminBookings.filter(b =>
            ['booked', 'confirmed'].includes(String(b.status || '').toLowerCase())
        );

        // Check Fleet Availability (Which car is booked or available)
        const fleet = masterFleet.map(car => {
            const currentBooking = activeBookings.find(b =>
                b.carName && String(b.carName).trim().toLowerCase() === car.name.toLowerCase()
            );
            return {
                ...car,
                isBooked: !!currentBooking,
                currentBooking: currentBooking || null
            };
        });

        const totalBookedCars = fleet.filter(c => c.isBooked).length;
        const availableCars = fleet.length - totalBookedCars;

        res.render('admin', {
            adminUser: req.user,
            totalUsers: users.length,
            totalFleetCars: fleet.length,
            totalBookedCars,
            availableCars,
            totalBookings: adminBookings.length,
            totalRevenue,
            pendingMoney,
            paidBookingsCount: paidBookingsList.length,
            unpaidBookingsCount: unpaidBookingsList.length,
            confirmedBookings: activeBookings.length,
            pendingBookings: adminBookings.filter(b => String(b.status || '').toLowerCase() === 'pending').length,
            cancelledBookings: adminBookings.filter(b => String(b.status || '').toLowerCase() === 'cancelled').length,
            bookings: adminBookings,
            fleet,
            users,
            getCarImage
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.status(500).send('Unable to load admin dashboard: ' + error.message);
    }
});

// ADMIN ACTION: Toggle or Mark Payment as Paid / Unpaid / Cash
app.put('/admin/bookings/payment-status/:id', ensureAdmin, async (req, res) => {
    try {
        const { paymentStatus } = req.body;
        const validStatuses = ['paid', 'cash', 'unpaid'];
        if (!validStatuses.includes(paymentStatus)) {
            return res.status(400).json({ success: false, message: 'Invalid payment status' });
        }

        const updateData = { paymentStatus };
        if (paymentStatus === 'paid') {
            updateData.paymentId = 'ADMIN_CONFIRMED_' + Date.now().toString(36).toUpperCase();
        }

        const booking = await bookingModel.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }

        res.json({
            success: true,
            message: `Booking payment status updated to "${paymentStatus.toUpperCase()}"`,
            booking
        });
    } catch (err) {
        console.error('Admin payment status update error:', err);
        res.status(500).json({ success: false, message: 'Failed to update payment status' });
    }
});

// ADMIN ACTION: Confirm Booking
app.put('/admin/bookings/confirm/:id', ensureAdmin, async (req, res) => {
    try {
        const booking = await bookingModel.findByIdAndUpdate(
            req.params.id,
            { status: 'confirmed' },
            { new: true }
        );
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, message: 'Booking confirmed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error confirming booking' });
    }
});

// ADMIN ACTION: Update Booking Status (e.g. completed, cancelled)
app.put('/admin/bookings/status/:id', ensureAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await bookingModel.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, message: `Booking status changed to ${status}` });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating booking status' });
    }
});

// ADMIN ACTION: Delete Booking
app.delete('/admin/bookings/:id', ensureAdmin, async (req, res) => {
    try {
        const booking = await bookingModel.findByIdAndDelete(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
        res.json({ success: true, message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error deleting booking' });
    }
});

// ADMIN ACTION: Get Single Booking Details
app.get('/admin/booking/:id', ensureAdmin, async (req, res) => {
    try {
        const booking = await bookingModel.findById(req.params.id).lean();
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        const user = await userModel.findById(booking.userId).lean();
        res.json({
            ...booking,
            userName: user?.username || 'N/A',
            userEmail: user?.email || 'N/A',
            userPhone: user?.phnumber || 'N/A'
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching booking' });
    }
});

// ==========================================
// START SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Rentify server is live on http://localhost:${PORT}`);
});
