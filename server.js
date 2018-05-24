const express = require('express');
var hbs = require('hbs');
var bodyParser = require('body-parser');                       // converts json into object
const bcrypyt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const nodemailer = require('nodemailer');
// const xoauth2 = require('xoauth2');
// var RedisStore = require("connect-redis").session;
const request = require('request');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const _ = require('lodash');
const stripe = require("stripe")("sk_test_e36btdZhhdlY35QFmnbBxKPc");



require('./auth.js');
var {mongoose, userConn} = require('./db/mongoose.js');
var {User} = require('./models/user.js');
var {Product, ProductInfo, Brands} = require('./models/products.js');
// var {ProductInfo} = require('./models/product_info.js');
// var {otherOne} = require('./models/product_info.js');
// var {Brands} = require('./models/brands.js')

var app = express();
var d=new Date();

hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper("makeCard", function(Cname,Pname,price,discount){
      Cname = hbs.Utils.escapeExpression(Cname);
      Pname = hbs.Utils.escapeExpression(Pname);
      price = hbs.Utils.escapeExpression(price);
      discount = hbs.Utils.escapeExpression(discount);

      var name = Cname + "-" + Pname;
      var title = Cname + ' ' + Pname;
      //   var linkName = name.replace(/\s/g,"-");
      var linkName = encodeURIComponent(name);

      var card = `
      <div class="card medium z-depth-2 hoverable">
        <div class="card-image waves-effect waves-light">
          <a href="/buy/${linkName}">
            <img class='responsive-img' src='/images/${name}-1.jpg' 'alt='img'>
          </a>
        </div>
        <div class="card-content white-text">
          <p class="card-title center-align flow-text black-text" style="font-size:144%;">${title}</p>`;
          if(discount == 0){
              card +=`
              <p class="center-align teal-text" style="font-size: 21px;">&#8377 ${price}</p>`;
            }
          else{
            var PRICE = price.split(',').join('');
            PRICE = parseFloat(PRICE);
            var DISCOUNT = parseFloat(discount);
            var netPrice = PRICE - PRICE*DISCOUNT*0.01;
            netPrice = parseInt(netPrice);
            netPrice = new Number(netPrice);
            // console.log(netPrice.toLocaleString('en-IN'));
            card +=`
                <p class="center-align teal-text" style="font-size: 21px;"><span class="discount-on-mrp">&#8377 ${price}</span>
                <span class="discount center">&#8377 ${netPrice.toLocaleString('en-IN')}</span>
                <br>
                <span class="new green badge" data-badge-caption="off">${discount}%</span></p>`;
          }
        card += `
              <hr>
              <p class='black-text' style="float: left;margin-left: 47px;">
              <a class="btn-flat cart tooltipped" onclick="addToCart(this);" data-position="bottom" data-delay="1500" data-tooltip="Add to cart">
              <i class="material-icons">shopping_cart</i></a>
              <p class='black-text ' style="float: left;">
              <a class="btn-flat info activator tooltipped" onclick="getInfo(this);" data-position="bottom" data-delay="1500" data-tooltip="Show Info">
              <i id="card-info" class="material-icons">info_outline</i></a>
              </p>
              </p>
          <p class='black-text' style="float: left;margin-right: -23px;">
          <a class="btn-flat heart tooltipped" onclick="addToSaved(this);" data-position="bottom" data-delay="1500" data-tooltip="Add to Favorites">
          <i class="material-icons">favorite</i></a>
          </p>
          </div>
        <div class="card-reveal">
          <span class="card-title grey-text text-darken-4">${name}
            <i class="material-icons right">close</i>
          </span>
          <div id="placehere"></div>
        </div>
        </div>`;


      return new hbs.SafeString(card);
});


app.set('view engine','hbs');

app.use(express.static(__dirname + '/files'));              // for our static files on the server

app.use(bodyParser.urlencoded({                             // parses text as url encoded data "POST"
    extended: false
}));

app.use(bodyParser.json());                                // converts json into object

app.use(session({
    secret: 'anycomplexsecret',
    // cookie:{
    //        maxAge: 15 * 60 * 1000                               // 15 mins
    // },
    resave: false,
    saveUninitialized: true,
    store: new MongoStore({ 
        mongooseConnection: userConn,
        ttl: 5 * 60 * 60                                     // 5 hrs (in secs) for session
    })
    
}));

const port = process.env.PORT || 1234;

console.log(`Server started on ${port} --time:${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}`);    // ES6 template string 

// -----------------------------------------------------------------------------------------------------

app.get('/success',(req,res)=>{
    res.render('success');
});

// --------------------------------------------------------------------------------------------------

app.post('/charge',(req,res)=>{
    const amount = 112000;

    stripe.customers.create({
        email: req.body.stripeEmail,
        source: req.body.stripeToken
    })
    .then(customer => stripe.charges.create({
        amount,
        description: "HP Spectre",
        currency: 'INR',
        customer: customer.id
    }))
    .then(charge => res.render('success'))
    
});

// ----------------------------------------------------------------------------------------
app.post('/c',(req,res)=>{
    if(!req.session.user){
        console.log('no one logged in');
        res.status(404).send('error');
    }
    else{
        User.findOne({ email: req.session.user })
        .then((docs)=>{
            // console.log(docs.saved);
            // console.log(docs.cart);
            var things = {saved:docs.saved, cart:docs.cart};
            res.status(200).send(things);
        },(err)=>{
            console.log(err);
        })
    }
});

// --------------------------------------------------------------------------------------------------

app.post('/removeFromCart',(req,res)=>{
    User.update({ email: req.session.user }, { $pullAll: { cart: [req.body.product] } }).select('cart -_id')
        .then((docs) => {
            // console.log(docs);
            return res.status(200).send('success');
        }, (err) => {
            console.log(err);
        });
    
});

// ------------------------------------------------------------------------------------------------

app.post('/removeFromSaved',(req,res)=>{
    User.update({ email: req.session.user }, { $pullAll: { saved: [req.body.product] } }).select('cart -_id')
        .then((docs) => {
            // console.log(docs);
            return res.status(200).send('success');
        }, (err) => {
            console.log(err);
        });
    
});

// ------------------------------------------------------------------------------------------------

app.get('/forgot',(req,res)=>{
    res.render('forgot.hbs');
});

// ----------------------------------------------------------------------------------------------------

app.post('/forgot',(req,res)=>{
    const email = escape(req.body.email);

    var mailOptions = {
        from: 'KasTang',
        to: email,
        subject: 'Sending Email using Node.js',
        text: 'That was easy! from raghav. Goto http://localhost:1234/changepwd.'
    };

    let transporter = nodemailer.createTransport({
        service:"gmail",
        auth: {
                type:'OAuth2',
                user: 'raghav.kaushik611@gmail.com',
                clientId: '993726409005-gd21dg087gtm88odg755lqi4p3bm33ad.apps.googleusercontent.com',
                clientSecret: 'T3A9ViWNXjp2YN1EB4ak3NZb',
                refreshToken: '1/msUjblWRMtIxypBolUu3ude2YGKPz2H-7agae8O0TiI',
                },
        tls: {
                rejectUnauthorized: false
            }
    });
    transporter.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log(response);
            res.send("Link sent to your mail.");
        }

    });

});

// -----------------------------------------------------------------------------------------------------------

app.get('/changepwd',(req,res)=>{
    res.render('changepwd.hbs');
});

app.post('/changepwd',(req,res)=>{
    User.findOneAndUpdate( { email:req.body.email } ,
        { $set : password });
});

// -------------------------------------------------------------------------------

app.get('/signup',(request,response) => {
    response.render('signup.hbs',{
        year: new Date().getFullYear()
    });
});

// --------------------------------------------------------------------------------------------------

app.get('/admin',(request,response)=>{
    response.sendFile(__dirname + '/views/admin.html');
});

// -------------------------------------------------------------------------------------------------

app.get('/secretadmin',(req,res)=>{
    res.render('adminlogin.hbs');
});

// -------------------------------------------------------------------------------------------------------


app.get('/home',(request,response) => {
    response.render('homepage.hbs',{
        year: new Date().getFullYear()
    });
});

// -------------------------------------------------------------------------------------------------------

app.get('/buy/:name',(request, response)=>{
    Product.findOne({Pname : request.params.name.split('-')[1]}).select('Pname Cname price discount -_id')
    .then((docs)=>{
        response.render('buypage.hbs',{
            productName: request.params.name,
            price: docs.price,
            discount: docs.discount,
            imgInfo: [{ img_name: request.params.name.toLowerCase(),n:1},
                    { img_name: request.params.name.toLowerCase(), n: 2 },
                    { img_name: request.params.name.toLowerCase(), n: 3 },
                    { img_name: request.params.name.toLowerCase(), n: 4 },
                    ]
        });
        },(err)=>{
            console.log(err);
            response.send(err);
        })
});

// -------------------------------------------------------------------------------------------------------

app.get('/error',(req,res) => {
    res.render('error.hbs');
});

// -------------------------------------------------------------------------------------------------------
app.get('/login',(request,response) => {
    response.render('login.hbs',{
        year: new Date().getFullYear()
    });
});

// -------------------------------------------------------------------------------------------------------

app.get('/loggedinpage',(req,res)=>{
    if(!req.session.user){
        return res.status(401).send();
    }
    else{
        return res.status(200).send('logged in !!');
        // User.find({name: req.session.user})
    }
    // res.render('loggedinpage.hbs',{
        
    // });
});

// -------------------------------------------------------------------------------------------------------

app.get('/logout',(req,res)=>{
    console.log(req.session);
    req.session.destroy( (err)=>{
        if(err){
            return res.send(err);
        }
        else{
            return res.send('sesion destroyed');
        }
    });
   
});

// -------------------------------------------------------------------------------------------------------
var brands = [];
app.get('/laptops',(request,response)=>{

    Brands.find({ProductType:"laptops"}).select('Companies -_id')
    .then((docs)=>{
        brands = docs[0].Companies;
        // console.log(brands);
    },(err)=>{
        console.log(err);
    });
    Product.find({category: "laptop"})
    .limit(2)
    .select('Cname Pname price discount -_id').then((docs)=>{
        if(!docs){
            console.log('no docs');
            return;
        }
        else{
            // console.log(docs);
            response.render('allstuff.hbs',{
                results: docs,
                brands: brands.sort()
            });
        }
    },
    (err)=>{
        console.log(err);
    });
});

// --------------------------------------------------------------------------------------------------------

app.post('/paginate',(req,res)=>{
    var count = req.body.count;
    var itemsPerPage = 2;
    Product.find({ category: "laptop" })
        .skip(count*itemsPerPage)
        .limit(itemsPerPage)
        .select('Cname Pname price discount -_id').then((docs) => {
            if (!docs) {
                console.log('no docs');
                return;
            }
            else {
                console.log(docs);
                res.send(docs);
            }
        },
            (err) => {
                console.log(err);
            });
});

// -----------------------------------------------------------------------------------------------

app.get('/mobiles', (request, response) => {
    Brands.find({ ProductType: "laptops" }).select('Companies -_id')
        .then((docs) => {
            brands = docs[0].Companies;
            // console.log(brands);
        }, (err) => {
            console.log(err);
        });
    Product.find({ category: "mobile" }).select('Cname Pname price discount -_id').then((docs) => {
        if (!docs) {
            console.log('no docs');
            return;
        }
        else {
            // console.log(docs);
            response.render('allstuff.hbs', {
                results: docs,
                brands: brands.sort()
            });
        }
    },
        (err) => {
            console.log(err);
        });
});

// ------------------------------------------------------------------------------------------------

app.get('/addToCart/:product',(req,res)=>{
    if(!req.session.user){
        return res.status(401).send('Please log in');
    }

    // console.log(req.params);
    var add = req.params.product;

    User.findOneAndUpdate({'email': req.session.user},{$push: {cart: add} },{upsert:true})
    .then((docs)=>{
        return res.status(200).send('Saved');
    },(err)=>{
        console.log(err);
    });
        
});

// -------------------------------------------------------------------------------------------------------

app.get('/addToSaved/:product',(req,res)=>{
    if (!req.session.user) {
        return res.status(401).send('Please log in');
    }

    // console.log(req.params);
    var add = req.params.product;

    User.findOneAndUpdate({ 'email': req.session.user }, { $push: { saved: add } }, { upsert: true })
        .then((docs) => {
            return res.status(200).send('Saved');
        }, (err) => {
            console.log(err);
        });
});

// -----------------------------------------------------------------------------------------------

app.get('/getInfo/:product',(req,res)=>{
    // console.log(req.params.product);
    ProductInfo.find({'Pname': req.params.product}).select('info -_id')
    .then((docs)=>{
        console.log(docs[0].info[0].General);
        var info_results = docs[0].info[0].General;
        res.send(info_results);
    },(err)=>{
        console.log(err);
    });
});

// ------------------------------------------------------------------------------------------------------

app.post('/test',(req,res)=>{
    console.log(req.body);
    i=5;
    var headingEmptyCheck = 1;
    var INFO = "{ ";
    INFO += `"Pname" : "${req.body.company} ${req.body.product_name}", "info" : { `;
    for (var key in req.body){
        if( i > 0)  { i--;continue; }                   // skipping first 5 entries - name,etc
        else{
            if (key[0] == 'h' && req.body[key] == ''){          // flag for empty heading
                headingEmptyCheck = 0;
            }

            if (key[0] == 'h' && req.body[key] != ''){            // for heading
                if(i == 0){
                    i--;
                    INFO +=`"${req.body[key]}" : { `;
                    continue;
                }
                INFO += " } , ";
                headingEmptyCheck = 1;
                INFO += `"${req.body[key]}"  : { `;
            }
            else if (key[0] == 'k' && req.body[key] != '' && headingEmptyCheck){            // for key
                if(key[key.length - 1] == "1"){
                    INFO += `"${req.body[key]}"  : `;
                    continue;
                }
                else {
                    INFO += " , ";
                    INFO +=`"${req.body[key]}"  : `;
                }
            }
            else if (key[0] == 'v' && req.body[key] != '' && headingEmptyCheck){            // for value
                INFO += `"${req.body[key]}"`;
            }
        }
    }
    INFO += " } } }";
    console.log(INFO);
    // INFO = JSON.stringify(INFO);
    INFO = JSON.parse(INFO);
    // console.log(INFO.info);
    // var name = req.body.company + " " + req.body.product_name;
    var prod_info = new ProductInfo({
        Pname : INFO.Pname,
        info : INFO.info
    });

    prod_info.save().then(()=>{
        
        var product = new Product({
            Cname: req.body.company,
            Pname: req.body.product_name,
            price: req.body.price,
            discount: req.body.discount,
            category: req.body.categories.split(' ')
        });
        
        product.save().then(() => {
            // console.log('success');
            res.status(200).send('done');
        }, (err) => {
            console.log('err in 2 '+err);
            res.status(400);
        });
    
    },(err)=>{
        console.log(err);
        res.status(400);
    });

});

// ------------------------------------------------------------------------------------------------------

app.post('/updateProduct',(req,res)=>{
    var info = [];
    Product.find({'Pname': req.body.Pname, 'Cname': req.body.Cname}).select('-_id')
    .then((docs)=>{
        info.push(docs[0]);
        ProductInfo.find({ 'Pname': "" + req.body.Cname + " " + req.body.Pname}).select('-_id -Pname -__v')
        .then((docs)=>{
            info.push(docs[0]);
            console.log(info);
            res.send(info);
        });
    },(err)=>{
        console.log(err);
    });
});

// ------------------------------------------------------------------------------------------------------

app.get('/mycart/',(req,res)=>{
    if(!req.session.user){
        return res.status(401).send({error:"Please log in.",status:401});
    }
    User.find({email: req.session.user}).select('cart -_id')
    .then((docs)=>{
        // console.log(docs[0]);
        res.render('cart.hbs',{
            cartProducts: docs[0]
        });
    },(err)=>{
        console.log(err);
    });
});

// ------------------------------------------------------------------------------------------------------

app.get('/cartInfo',(req,res)=>{
    if(!req.session.user){
        res.status(401).send();
        return;
    }
    User.find({email: req.session.user}).select('cart -_id')
    .then((docs)=>{
        console.log(docs[0]);
        res.status(200).send({docs:docs[0]});
    },(err)=>{
        console.log(err);
    });
});


// -------------------------------------------------------------------------------------------------------

app.get('/deleteFromCart/:name',(req,res)=>{
    var item = req.params.name;

    User.update({email: 'raghav.kaushik611@gmail.com'}, { $pullAll: {cart:[item]} }).select('cart -_id')
    .then((docs)=>{
        // console.log(docs);
        return res.status(200).send('success');
    },(err)=>{
        console.log(err);
    });

});

// --------------------------------------------------------------------------------------------------------

app.get('/profile',(req,res)=>{
    if (!req.session.user) {
        res.status(401).send();
        return;
    }
    User.find({ email: req.session.user }).select('cart -_id')
        .then((docs) => {
            // console.log(docs[0]);
            res.render('profile.hbs',{
                cartProducts: docs[0]
            });
        }, (err) => {
            console.log(err);
        });
});

// -------------------------------------------------------------------------------------------------------

app.post('/CreateNewUser', (request,response) => {
    console.log('post request');
    console.log(request.body);                              // .body from bodyParser
    
    
    var hashedPwd;
    // console.log(request.body.email);
    
    var salt = bcrypyt.genSaltSync(10);
    var hash = bcrypyt.hashSync(request.body.password,salt);
    var USER = request.body.fname +' ' + request.body.lname;
    
    var user = new User({
        email: (request.body.email),
        password: hash,
        gender: (request.body.gender),
        mobile: (request.body.mobile),
        name: (USER),
        address: (request.body.address)
    });

    user.save().then(()=>{
        request.session.user = request.body.email;                        // created the session 
        response.render('form-success.hbs',{
            USER : USER
        })
    },(err) => {
        response.status(400).send(err);
    });
});

// ----------------------------------------------------------------------------------------------------

app.post('/findUser',(request,response) =>{
    User.findOne({'email':request.body.email}).then((docs) => {
        if(!docs){
            response.status(404).send();
        }
        else if (bcrypyt.compareSync(request.body.password,docs.password)){
            console.log('correct');
            request.session.user = docs.email;                     // have to update this to pick only something
            if(request.body.keepLoggedIn == '1'){
                request.session.cookie.expires = new Date(Date.now() + 432000000);       /// 5 days 
            }
            response.status(200).send("logged in");
            // response.render('homepage.hbs',{
            //     USER: docs.name
            // });
        }
        else {
            response.status(404).send('invalid pwd');
            console.log('invalid pwd');
        }
    },(err) => {
        console.log(err);
    });
});

// --------------------------------------------------------------------------------------------------------

app.post('/addProduct',(req,res)=>{
    
    var product = new Product({
        Cname: req.body.company,
        Pname: req.body.pro,
        price: req.body.price,
        category: req.body.cat
    });

    product.save().then(()=>{
        res.send('success');

    },(err)=>{
        res.status(400).send('err');
    });
});

// ---------------------------------------------------------------------------------------------------

app.get('/search',(req,res)=>{
    
    var complete_search = req.query['stuff'];
    var search = req.query['stuff'];
    var search_copy = req.query['stuff'].split(' ');
    
    complete_search = '/' + complete_search + '/gi';
    eval(complete_search);
    // console.log(complete_search);
    // console.log(search);
    var i=0;
    // for (word in search){
        // search[i] = '/'+search[word]+'/gi';
        // search.push(eval(search[i])); 
        // i++;
    // }
    console.log(search);
    // console.log(search_copy);
    Product.find({ $text: {$search: search}  }).lean()      // .lean() bcoz we dont need to get mongoose model just json as we are not saving the result just using it for front end
        .exec()                                                                         // returns a promise
        .then((docs) => {
            if (!(_.isEmpty(docs))) {
                // console.log('1');
                return docs;
            }
            else {
                return reject('no name');
                // Product.find({category: {$in: search }}, function(err,docs){
                    // console.log("not find name so in category");
                    // return docs;
                //  });
            }
        })
        .then((docs) => {
            console.log('returned docs found in company or name');
            // res.send(docs);
            // console.log(docs);
            res.render('searchres.hbs',{
                results: docs,
                query: search_copy
            });
        },(msg)=>{
            // console.log(msg);
            Product.find({category: {$in: search }}, function(err,docs){
                console.log("not find name... so in category");
                // console.log(docs);
                // res.send(docs);
                res.render('searchres.hbs',{
                   results: docs,
                   query: search_copy
                });
             });
        })
        .catch((err) => {
            console.log(err);
        });
});

// --------------------------------------------------------------------------------------------




//-----------------------------------------   FACEBOOK   --------------------------------------------
app.use(passport.initialize());
// app.use(passport.session());

app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

app.get('/auth/facebook/callback',
            passport.authenticate('facebook', {
                successRedirect : '/home',
                failureRedirect : '/error'
            }));


app.listen(port);