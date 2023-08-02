const express = require('express');
const router = express.Router();
const User = require("../models/users.js")
// we need to use multer because we are uploading a image
const multer = require('multer');
const fs = require('fs')
const path = require('path'); // Require the 'path' module

//code for image uplaod
// var storage = multer.diskStorage({
//     destination: function( res, file, cb){
//         cb(null, './uploads');
//     },
//     filename: function( req, file, cb) {
//         cb(null, this.filename +"_"+Date.now()+"_"+file.originalname);
//     },
// });

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads');
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
    },
});


var upload = multer({
    storage: storage,
}).single("image");

// //routes for different pages <a href="/">
// router.get("/" ,(req, res) => {
//     res.render("index", { title: "Home Page"});
// });

//routes for getting the data saved to mongodb and displaying it on home page>
router.get("/", (req, res) => {
    User.find()
      .exec() // Remove the callback function here
      .then((users) => {
        res.render('index', {
          title: "home page",
          users: users
          
        });
      })
      .catch((err) => {
        res.json({ message: err.message });
      });
  });
  

router.post('/add', upload, (req, res) => {
    const userInstance = new User({
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        image: req.file.path, // Assuming multer saves the image path to req.file.path
    });

    userInstance.save()
        .then(() => {
            req.session.message = {
                type: "success",
                message: "user added successfully",
            };
            res.redirect("/");
        })
        .catch((err) => {
            res.json({ message: err.message, type: "danger" });
        });
});

//<a href="/add">
router.get("/add" ,(req, res) => {
    res.render("add_users", { title: "Add users"});
});


//edit route for openning edit-users.ejs page
// <a href="/edit/<%= row._id %>"> when we click on this page the edit page will open
router.get("/edit/:id", (req, res) => {
  let id = req.params.id;
  User.findById(id)
    .then(user => {
      if (!user) {
        return res.redirect("/");
      }
      res.render("edit_users", {
        title: "Edit User",
        user: user,
      });
    })
    .catch(err => {
      console.error(err);
      res.redirect("/");
    });
});


// const User = require('../models/user'); // Make sure to import your User model


router.post("/update/:id", upload, (req, res) => {
    let id = req.params.id;
    let new_image = '';
  
    // If we want to upload a new image
    if (req.file) {
      new_image = 'uploads/' + req.file.filename;
      
      // First, delete the previous image before updating the user's information
      if (req.body.old_image) {
        try {
          fs.unlinkSync(path.join('./uploads/' + req.body.old_image)); // Use path.join() to handle file paths
          console.log('Previous image deleted successfully');
        } catch (err) {
          console.error('Error deleting previous image:', err);
        }
      }
    } else {
      new_image = req.body.old_image;
    }
  
    // Model User
    User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    })
      .then(() => {
        req.session.message = {
          type: 'success',
          message: 'User updated successfully!',
        };
        // After updating, return to the home page
        res.redirect("/");
      })
      .catch(err => {
        console.error(err);
        res.json({ message: err.message, type: 'danger' });
      });
  });


  //<a href="/delete/<%= row._id %>
//   delete user route

router.get('/delete/:id', async (req, res) => {
  let id = req.params.id;
  
  try {
    const user = await User.findByIdAndRemove(id);
    
    // First removing image from uploads folder
    if (user.image !== '') {
      try {
        const imagePath = path.join(__dirname, 'uploads', user.image);
        fs.unlinkSync(imagePath);
        console.log('Image deleted successfully:', imagePath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
    
    // Storing success message in session
    req.session.message = {
      type: 'info',
      message: 'User deleted successfully',
    };
    res.redirect("/");
  } catch (err) {
    res.json({ message: err.message });
  }
});


module.exports = router;