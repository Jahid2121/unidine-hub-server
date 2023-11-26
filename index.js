const express = require('express');
const app = express();
const cors = require('cors')
require("dotenv").config();
const port = process.env.PORT || 5000;



// middlewares
app.use(cors())
app.use(express.json())


app.get('/', async (req, res) => {
    res.send('UniDine Hub server is running')
})

app.listen(port, () => {
    console.log(`UniDine Hub server listening on ${port}`);
})