// imports
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();
//database connection 
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', (error) => {
    console.log(error);
});

db.once('open', () => {
    console.log('connected to database');
});

// mildlewares
app.use(express.urlencoded({extended : false}));

app.use(express.json());

app.use(session({
    secret: 'my secret key',
    saveUninitialized: true,
    resave: false,
})
);

//storing session message
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
});

app.use('/uploads', express.static('uploads'));

//set template engine
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 4000;

// app.get("/", (req, res) => {
//     res.send("hello World");
// });

///we'll use a middle ware
//route prefix

app.use("", require("./routes/routes"));

app.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`);
});
