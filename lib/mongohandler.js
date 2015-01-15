var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');
// var db = require('../app/mongo-config');
// var User = db.User;
// var Link = db.Link;
var User;
var Link;

var mongo = require('mongodb').MongoClient;

mongo.connect("mongodb://localhost:27017/test", function(err, db){
  if(!err){
    console.log("We are connected!");
    db.createCollection("urls", function(err, collection){
      console.log('created urls');
    });
    db.createCollection("users", function(err, collection){
      console.log('created users');
    });
    User = db.collection('users');
    Link = db.collection('urls');
  }
})

// var db = require('../app/config');
// var User = require('../app/models/user');
// var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find().toArray(function(err,items){
    if(!err){
      console.log(items);
      res.send(200,items);
    } else {
      console.log('Error when fetching links');
    }
  })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.findOne({url:uri},function(err,link){
    console.log(link);
    if(!link){
      util.getUrlTitle(uri, function(err, title){
        if(!err){
          var shasum = crypto.createHash('sha1');
          shasum.update(uri);
          var code =  shasum.digest('hex').slice(0, 5);

          var link = {
            url: uri,
            title: title,
            base_url: req.headers.origin,
            code: code
          };

          Link.insert(link, function(err,result){
            if(err){
              console.log('Error inserting');
            } else {
              res.send(200, link);
            }
          })
        }
      })
    }
  })
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username:username},function(err,result){
    if(!result){
      res.redirect('/signup');
    } else {
      if(result.password === password){
        res.render('index');
      } else {
        res.redirect('/login');
      }
    }
  })
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username:username},function(err,result){
    if(!result){
      var user = {
        username: username,
        password: password
      }
      User.insert(user, function(err,result){
        if(err){
          console.log('Error creating user');
        } else {
          res.redirect('/')
        }
      })
    } else {
      res.redirect('/login');
    }
  })
};

exports.navToLink = function(req, res) {
//   new Link({ code: req.params[0] }).fetch().then(function(link) {
//     if (!link) {
//       res.redirect('/');
//     } else {
//       link.set({ visits: link.get('visits') + 1 })
//         .save()
//         .then(function() {
//           return res.redirect(link.get('url'));
//         });
//     }
//   });
};
