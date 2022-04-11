const express = require('express');
const app = express();
const upload = require('express-fileupload');
const routes = [require('./routes/nav'), require('./routes/users')];

app.use(upload());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("./public"));
app.use(routes);

(async () => {
    try {
        app.listen(1000, () => console.log('Listening on port 1000'));
    } catch (error) { console.log(error) }
})()