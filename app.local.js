'use strict'

const app = require('./app');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`running locally on port ${port}`);
});