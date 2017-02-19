var express = require('express');
var router = express.Router();
var multer  = require('multer');
var upload = multer({dest: './uploads'});
var User = require('../models/user');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/register', function(req, res, next) {
    res.render('register',{title:'Register'});
});

router.get('/login', function (req,res,next) {
    res.render('login', {title:'Login'});
});

router.post('/login',
    passport.authenticate('local',{failureRedirect: '/users/login', failureFlash: 'Invalid username or password'}),
    function(req, res) {
        req.flash('success', 'You are now logged in');
        res.redirect('/');
    });

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new LocalStrategy(function(username,password,done){
    User.getUserByUsername(username, function(err,user){
        if(err) throw err;
        if(!user){
            return done(null, false, {message: 'Invalid User'});
        }

        User.comparePassword(password, user.password, function(err,isMatch){
           if(err) return done(err);
           if(isMatch){
                return done(null,user);
           }
           else{
               return done(null,false, {message: 'Invalid password'});
           }
        });
    })
}));

router.post('/register', upload.single('profileImage'), function (req,res,next) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    if(req.file){
      var profileimage = req.file.filename;
    }
    else{
      var profileimage = 'noimage.jpg';
    }

    //Form validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('email', 'Email is required').isEmail();
    req.checkBody('email', 'Enter a valid email').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

    //Check errors
    var errors = req.validationErrors();

    if(errors) {
        res.render('register', {
            errors: errors
        });
    }
      else
    {
        var newUser = new User({
            username: username,
            password: password,
            name: name,
            email: email,
            profileimage: profileimage
        });

        User.createUser(newUser, function(err, user){
          if(err) throw err;
          console.log(user);
        });

        req.flash('success', 'You have successfully registered');

        res.location('/');
        res.redirect('/');
    }
});

router.get('/logout', function(req,res){
   req.logout();
   req.flash('success', 'You have successfully logged out');
   res.redirect('/users/login');
});

module.exports = router;
