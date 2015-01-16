var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
var Promise = require('bluebird');
var MongoDB = require('mongodb');
var mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/test');

var userSchema = mongoose.Schema({
  username: String,
  password: String
});

var linkSchema = mongoose.Schema({
  url: String,
  title: String,
  base_url: String,
  code: String,
  visits: Number
});

var User = mongoose.model('User', userSchema);
var Link = mongoose.model('Cat', linkSchema);

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(callback){
  console.log('We are connected using Mongoose!');
});

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.find({ url: uri }, function(link){
    if(!link){
      util.getUrlTitle(uri, function(err, title){
        if(!err){
          var shasum = crypto.createHash('sha1');
          shasum.update(uri);
          var code = shasum.digest('hex').slice(0, 5);

          var link = new Link({
            url: uri,
            title: title,
            base_url: req.headers.origin,
            code: code,
            visits: 0
          });

          link.save(function(err, fluffy){
            if (err) return console.error('Error inserting:',err);
            console.log('link successfully saved!')
            res.send(200, link);
          });
        }
      });
    } else {
      console.log('Link already saved');
    }
  });
};

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  console.log(req.session);
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find(function(err, links){
    if (err) {
      console.error(err);
    }
  })
  // Link.find().toArray(function(err,items){
  //   if(!err){
  //     res.send(200,items);
  //   } else {
  //     console.log('Error when fetching links');
  //   }
  // })
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({username: username}, function(user){
    if(!user){
      res.redirect('/signup');
    } else {
      console.log(user);
    }
  });
  // User.findOne({username:username},function(err,result){
  //   if(!result){
  //     res.redirect('/signup');
  //   } else {
  //     if(result.password === password){
  //       util.createSession(req,res,result);
  //     } else {
  //       res.redirect('/login');
  //     }
  //   }
  // })
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.find({username: username}, function(user){
    if(!result){
      var user = new User({
        username: username,
        password: password
      });
      user.save(function(err, user){
        if (err) {
          return console.error('Error creating user',err);
        } else {
          console.log('Created user: ', user);
          util.createSession(req, res, user);
          res.redirect('/');
        }
      });
    } else {
      res.redirect('/login');
    }
  });
};

exports.navToLink = function(req, res) {
  var shortlink = req.params[0];
  Link.findOne({code: shortlink},function(err,link){
    if(!link){
      res.redirect('/');
    } else {
      var visit = link.visits + 1;
      Link.update(link,{$set:{visits: visit}},function(err,result){
        res.redirect(link.url);
      })
    }
  })
};
