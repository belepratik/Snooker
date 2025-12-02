const express = require('express');
const dotenv = require('dotenv');
const {app} = require('./app.js')
dotenv.config({
    path: './.env'
})

const port = process.env.PORT || 3000;
const host = '127.0.0.1';
app.listen(port,host,()=>{
    console.log(`server is listening on ${port}`);    
})