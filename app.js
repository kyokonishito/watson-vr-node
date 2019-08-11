require('dotenv').config();
var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var classifyImages = require('./routes/classifyImages')


var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(methodOverride('_method'));

app.use('/detectFaces', classifyImages);
app.use('/classifyImages', classifyImages);
app.use('/classifyCustomImages', classifyImages);
app.use(express.static(path.join(__dirname + '/public')));

var server = app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on port %d', server.address().port);
});