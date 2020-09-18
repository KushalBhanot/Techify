const PORT = process.env.PORT || 3000;
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const LocalMongooseStrategy = require("passport-local-mongoose");
const mongoose = require("mongoose");
const Idea = require("./models/ideas");
const Product = require("./models/products");
const Cmntproduct = require("./models/cmntProducts");
const Cmntidea = require("./models/cmntIdeas");
const User = require("./models/users");
mongoose.connect("mongodb://localhost:27017/techify_db",{
    useNewUrlParser : true,
    useUnifiedTopology : true
})
.then(()=> console.log("Connected to DB!!"))
.catch(()=> console.log("error.meassage"));

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended : true}));
app.use(methodOverride("_method"));
app.locals.moment = require("moment");
app.use(flash());

app.use(require("express-session")({
    secret : "Our little secret.",
    resave : false,
    saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});
//==========
//Main Route
//==========
app.get("/",(req,res) => {
    res.redirect("/home");
})
//home route
app.get("/home",(req,res) => {
    res.render("index.ejs");
})
//products section
app.get("/products",(req,res) => {
    res.render("products.ejs");
})
//resources section 
app.get("/resources",(req,res) => {
    res.render("resources.ejs");
})


//-------
//Ideas
//-------
//Ideas(View all Ideas)
app.get("/ideas",function(req,res){
    Idea.find({},function(err,ideas){
        if(err){
            console.log(err);
        }
        else{
            res.render("ideas.ejs",{ideas : ideas, currentUser : req.user});
        }
    });
});

//Create Idea
app.get("/ideas/new",isLoggedIn,function(req,res){
    res.render("submitIdea.ejs");
});

//Create Idea POST Route
app.post("/ideas",function(req,res){
    var title = req.body.title;
    var body = req.body.body;
    var tech = req.body.tech;
    var author = {
        id : req.user._id,
        name : req.user.name
    }
    var newIdea = {title : title,body : body,tech : tech,author : author}
    Idea.create(newIdea,function(err,newlyCreatedIdea){
        if(err){
            req.flash("error","Some error Occurred!!");
            res.render("submitIdea.ejs");
        }
        else{
            req.flash("success","Idea successfully created :)");
            res.redirect("/ideas");
        }
    });
});

// Show ideas Route
app.get("/ideas/:id",function(req,res){
    Idea.findById(req.params.id).populate("comments likes").exec(function(err,showIdea){
        if(err){
            req.redirect("/ideas");
        }
        else{
            
            res.render("showIdea.ejs",{idea : showIdea});
        }
    });
});

//Edit ideas Route
app.get("/ideas/:id/edit",checkIdeaOwnership,function(req,res){
    Idea.findById(req.params.id,function(err,foundIdea){
        if(err) {
            req.flash("error","Requested Idea doesn't exist");
        }
        res.render("editIdea.ejs",{idea : foundIdea});
    });
});

//Update ideas Route
app.put("/ideas/:id",checkIdeaOwnership, function(req,res){
    Idea.findByIdAndUpdate(req.params.id,req.body.blog,function(err,UpdatedIdea){
        if(err){
            req.flash("error","Some error occurred!!");
            res.redirect("/ideas");
        }else{
            req.flash("success","Idea updated successfully");
            res.redirect("/ideas/"+ req.params.id);
        }
    });
});

//Delete ideas Route
app.delete("/ideas/:id",checkIdeaOwnership, function(req,res){
    Idea.findByIdAndRemove(req.params.id,function(err){
        if(err){
            req.flash("error","Requested Idea does not exist!!");
            res.redirect("/ideas");
        }else{
            req.flash("success","Idea deleted successfully");
            res.redirect("/ideas");
        }
    });
});

//======
//Likes
//======
//Ideas like route
app.post("/ideas/:id/likes",isLoggedIn,(req,res) => {
    Idea.findById(req.params.id,(err,foundIdea)=> {
        if(err) {
            req.flash("error","Idea not found!!!");
            req.redirect("/ideas");
        } 
            var foundUserLike = foundIdea.likes.some((like) => {
                return like.equals(req.user._id);
            });

            if(foundUserLike) {
                foundIdea.likes.pull(req.user._id);
            } else {
                foundIdea.likes.push(req.user);
            }

            foundIdea.save((err) => {
                if(err) {
                    req.flash("error","An error occurred!!");
                    return res.redirect("/ideas");
                }
                return res.redirect("/ideas/"+ foundIdea._id);
            });
         
    });
});

//==========
//Comments
//==========
//Show all comments
app.post("/ideas/:id/comments",isLoggedIn,function(req,res) {
    Idea.findById(req.params.id, function(err,idea) {
        if(err) {
            console.log(err);
            res.redirect("/ideas");
        } else {
            Cmntidea.create(req.body.comment,function(err, newCmnt){
                if(err) {
                    console.log(err);
                } else {
                    newCmnt.author._id = req.user._id;
                    newCmnt.author.username = req.user.name;
                    newCmnt.author.email = req.user.username;
                   
                    newCmnt.save();
                    idea.comments.push(newCmnt);
                    idea.save();
                    console.log(newCmnt);
                    res.redirect("/ideas/"+idea._id);
                }
            });
        }
    })
})
//new Comment
app.get("/ideas/:id/comments/new",isLoggedIn,function(req,res) {
    Idea.findById(req.params.id,function(err, idea) {
        if(err) {
            console.log(err);
        } else {
            res.render("cmntIdea.ejs",{idea : idea});
        }
    })
    
});
//Edit Comment
app.get("/ideas/:id/comments/:comment_id/edit", function(req,res) {
    Cmntidea.findById(req.params.comment_id, function(err, foundComment) {
        if(err) {
            req.flash("error","You need to be logged in to do that!!");
            res.redirect("back");
        } else {
            res.render("editCmntIdea.ejs",{idea_id : req.params.id, comment : foundComment});
        }
    });
   
})
//Put Comment
app.put("/ideas/:id/comments/:comment_id",function(req,res) {
    Cmntidea.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err, updatedCmnt){
        if(err) {
            req.flash("error","Something went wrong!!");
            res.redirect("back");
        } else {
            req.flash("success","Comment successfully edited");
            res.redirect("/ideas/"+req.params.id);
        }
    })
})
//Delete Comment
app.delete("/ideas/:id/comments/:comment_id", function(req,res){
    
    Cmntidea.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            req.flash("error","You need to be logged in to do that!!");
            res.redirect("back");
        } else {
            req.flash("success","Comment successfully deleted!!");
            res.redirect("/ideas/"+ req.params.id);
        }
    })
});

//-------
//Products
//-------
//Products(View all Products)
app.get("/products",function(req,res){
    Product.find({},function(err,ideas){
        if(err){
            console.log(err);
        }
        else{
            res.render("products.ejs",{ideas : ideas, currentUser : req.user});
        }
    });
});

//Create Idea
app.get("/products/new",isLoggedIn,function(req,res){
    res.render("Submit.ejs");
});

//Create Idea POST Route
app.post("/products",function(req,res){
    var title = req.body.title;
    var image = req.body.image;
    var price = req.body.price;
    var author = {
        id : req.user._id,
        name : req.user.name
    }
    var newProduct = {title : title,image : image,price : price,author : author}
    Product.create(newProduct,function(err,newlyCreatedProduct){
        if(err){
            req.flash("error","Some error Occurred!!");
            res.render("Submit.ejs");
        }
        else{
            req.flash("success","Idea successfully created :)");
            res.redirect("/products");
        }
    });
});

// Show ideas Route
app.get("/products/:id",function(req,res){
    Product.findById(req.params.id).populate("comments likes").exec(function(err,showIdea){
        if(err){
            req.redirect("/products");
        }
        else{
            
            res.render("showProduct.ejs",{idea : showIdea});
        }
    });
});

//Edit ideas Route
app.get("/products/:id/edit",checkIdeaOwnership,function(req,res){
    Product.findById(req.params.id,function(err,foundProduct){
        if(err) {
            req.flash("error","Requested Idea doesn't exist");
        }
        res.render("editProduct.ejs",{idea : foundProduct});
    });
});

//Update ideas Route
app.put("/products/:id",checkIdeaOwnership, function(req,res){
    Product.findByIdAndUpdate(req.params.id,req.body.blog,function(err,UpdatedIdea){
        if(err){
            req.flash("error","Some error occurred!!");
            res.redirect("/products");
        }else{
            req.flash("success","Idea updated successfully");
            res.redirect("/products/"+ req.params.id);
        }
    });
});

//Delete ideas Route
app.delete("/products/:id",checkIdeaOwnership, function(req,res){
    Product.findByIdAndRemove(req.params.id,function(err){
        if(err){
            req.flash("error","Requested Idea does not exist!!");
            res.redirect("/products");
        }else{
            req.flash("success","Idea deleted successfully");
            res.redirect("/products");
        }
    });
});

//======
//Likes
//======
//Blog like route
app.post("/products/:id/likes",isLoggedIn,(req,res) => {
    Product.findById(req.params.id,(err,foundProduct)=> {
        if(err) {
            req.flash("error","Idea not found!!!");
            req.redirect("/products");
        } 
            var foundUserLike = foundIdea.likes.some((like) => {
                return like.equals(req.user._id);
            });

            if(foundUserLike) {
                foundIdea.likes.pull(req.user._id);
            } else {
                foundIdea.likes.push(req.user);
            }

            foundProduct.save((err) => {
                if(err) {
                    req.flash("error","An error occurred!!");
                    return res.redirect("/products");
                }
                return res.redirect("/products/"+ foundIdea._id);
            });
         
    });
});

//==========
//Comments
//==========
//Show all comments
app.post("/products/:id/comments",isLoggedIn,function(req,res) {
    Product.findById(req.params.id, function(err,idea) {
        if(err) {
            console.log(err);
            res.redirect("/products");
        } else {
            Cmntproduct.create(req.body.comment,function(err, newCmnt){
                if(err) {
                    console.log(err);
                } else {
                    newCmnt.author._id = req.user._id;
                    newCmnt.author.username = req.user.name;
                    newCmnt.author.email = req.user.username;
                   
                    newCmnt.save();
                    idea.cmntproducts.push(newCmnt);
                    idea.save();
                    console.log(newCmnt);
                    res.redirect("/products/"+idea._id);
                }
            });
        }
    })
})
//new Comment
app.get("/products/:id/comments/new",isLoggedIn,function(req,res) {
    Product.findById(req.params.id,function(err, idea) {
        if(err) {
            console.log(err);
        } else {
            res.render("newComment.ejs",{idea : idea});
        }
    })
    
});
//Edit Comment
app.get("/products/:id/comments/:comment_id/edit", function(req,res) {
    Cmntproduct.findById(req.params.comment_id, function(err, foundComment) {
        if(err) {
            req.flash("error","You need to be logged in to do that!!");
            res.redirect("back");
        } else {
            res.render("editComment.ejs",{idea_id : req.params.id, comment : foundComment});
        }
    });
   
})
//Put Comment
app.put("/products/:id/comments/:comment_id",function(req,res) {
    Cmntproduct.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err, updatedCmnt){
        if(err) {
            req.flash("error","Something went wrong!!");
            res.redirect("back");
        } else {
            req.flash("success","Comment successfully edited");
            res.redirect("/products/"+req.params.id);
        }
    })
})
//Delete Comment
app.delete("/products/:id/comments/:comment_id", function(req,res){
    
    Cmntproduct.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            req.flash("error","You need to be logged in to do that!!");
            res.redirect("back");
        } else {
            req.flash("success","Comment successfully deleted!!");
            res.redirect("/products/"+ req.params.id);
        }
    })
});



//========
//Contact 
//========
// app.get("/home/contact",(req,res) => {
//     res.render("contact.ejs");
// })

// app.post("/home",(req,res) => {
//     Contact.create(req.body.message,(err,newM) => {
//         if(err) {
//             res.redirect("/home/contact");
//         } else {
//             console.log("New Message");
//             res.redirect("/home/contact");
//         }
//     });

// })


//===============
//Authentication
//===============
app.post("/register",(req,res) => {
    User.register(new User({username : req.body.username, name : req.body.name,image : req.body.userImage}),req.body.password,function(err, user){
         if(err) {
             console.log(err);
             var errMsg = err.message;
             req.flash("error",errMsg);
             res.redirect("/register");
         } 
         passport.authenticate("local")(req, res, function(){
             req.flash("success","Account successfully created!!");
             res.redirect("/home");
         })
     })
 })
 //Login
 app.post("/login",passport.authenticate("local",{
     successRedirect : "/home",
     failureRedirect : "/login"
 }) ,function(req,res) {
   
 })
 //Show Regiter
app.get("/register",(req,res) =>{
    res.render("register.ejs");
})
//Show Login
app.get("/login", (req,res) => {
    res.render("login.ejs");
})
//Logout
app.get("/logout",(req,res) => {
    req.logout();
    req.flash("success","Logged You Out!!");
    res.redirect("/home");
})

//============
//Middleware
//============
function isLoggedIn(req,res,next){
    if(req.isAuthenticated()) {
        
        return next();
    }
    req.flash("error","You need to be logged in to do that!!");
    res.redirect("/login");
}

function checkIdeaOwnership(req,res,next) {
    if(req.isAuthenticated()) {
        Idea.findById(req.params.id,function(err,foundIdea){
            if(err){
                req.flash("error","Campground not found!!");
                res.redirect("back");
            }else{
                if(foundIdea.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error","You don't have the permission to do that!!");
                    res.redirect("back");
                }
                
            }
        });
    } else {
        req.flash("error","You need to be logged in to do that");
        res.redirect("back");
    }
}

function checkCommentOwnership(req,res,next) {
    if(req.isAuthenticated()) {
        Cmntidea.findById(req.params.comment_id,function(err,foundComment){
            if(err){
                res.redirect("back");
            }else{
                // console.log(foundComment.author._id);
                // console.log(req.user._id);
                // console.log(foundComment.author.id.equals(req.user._id));
                if(foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }
                
            }
        });
    } else {
        res.redirect("back");
    }
}




//Listen Route
app.listen(PORT,() => {
    console.log("Server has started successfully!!");
})
