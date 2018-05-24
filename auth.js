var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;


var {mongoose} = require('./db/mongoose.js');
var {User} = require('./models/user.js');                       // ES6 destructring


passport.serializeUser(function(user, done) {
        done(null, user.id);
});

passport.use(new FacebookStrategy({
        'clientID'      : '284160952096190', // your App ID
        'clientSecret'  : '13cc3570b0130e36e68d7c2c69f35301', // your App Secret
        'callbackURL'   : 'http://localhost:1234/auth/facebook/callback',
        profileFields: ['email']
     },
    function(accessToken, refreshToken, profile, done) {
    
    console.log(profile);

    User.findOne({ 'facebook.id' : profile.id }, function(err, user) {

                // if there is an error, stop everything and return that
                // ie an error connecting to the database
                if (err)
                    return done(err);

                // if the user is found, then log them in
                if (user) {
                    return done(null, user); // user found, return that user
                } else {
                    // if there is no user found with that facebook id, create them
                    var newUser = new User();

                    // set all of the facebook information in our user model
                    newUser.facebook.id    = profile.id; // set the users facebook id                   
                    newUser.facebook.token = profile.token; // we will save the token that facebook provides to the user                    
                    newUser.facebook.name  = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned
                    newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

                    // save our user to the database
                    newUser.save(function(err) {
                        if (err)
                            throw err;

                        // if successful, return the new user
                        return done(null, newUser);
                    });
                }

            });
    
    
    // User.findOrCreate({'facebook.id' : profile.id}, function(err, user) {
    //   if (err) { 
    //       return done(err); 
    //     }
    //   done(null, user);
    // });
  }
));
