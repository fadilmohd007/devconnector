const express = require('express');
const app = express();
const connectDB = require('./config/db');
//conncet db
connectDB();

app.get('/', (req, res) => res.send('API runnig'));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('server running'));
