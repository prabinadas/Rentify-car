const express = require('express');
const router = express.Router();



// Home Page
router.get('/', (req, res) => res.render('index'));

// Profile Page (protected)
router.get('/profile', ensureAuthenticated, (req, res) =>
    res.render('profile', { user: req.user })
);

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/users/login');
}

module.exports = router;