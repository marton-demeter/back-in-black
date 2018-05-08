const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const parser = require('./parser.js');
const MongoClient = require('mongodb').MongoClient;
const app = express();

app.use(bodyParser.json({limit: '20mb'}));
app.use(bodyParser.urlencoded({extended: true, limit: '20mb'}));
app.use(busboy());

app.use(express.static(path.join(__dirname, '../dist')));
[
  { endpoint: '/api/upload/dot', parse: parser.parseDOT }, 
  { endpoint: '/api/upload/rsf', parse: parser.parseRSF }
].forEach(({ endpoint, parse }) => {
  app.post(endpoint, (req, res) => {
    if(req.busboy) {
      req.pipe(req.busboy);
      let formData = Object();
      
      req.busboy.on('file', (fieldname, file, filename) => {
        let chunks = Array();
        file.on('data', chunk => chunks.push( chunk ));
        file.on('end', () => {
          formData.text = chunks.join('');
        });
      });
      
      req.busboy.on('field', (fieldname, value) => {
        formData.name = value;
      });
      
      req.busboy.on('finish', () => {
        let [ graph, sources ] = parse( formData.text );
        app.locals.db.collection('recoveries').save({
          name: formData.name,
          graph: graph, sources: sources
        }, (err, result) => {
          if(err) res.sendStatus(500);
          else res.status(200).send( formData.name );
        });
      });
      
    }
  });
});

app.get('/api/systems/:system', (req, res) => {
  let name = decodeURI(req.params.system);
  app.locals.db.collection('recoveries')
    .findOne({
      name: name
    }, {
      _id: false,
      name: true,
      graph: true,
      sources: true
    }, (err, result) => {
      if(err) res.sendStatus(500);
      else if(result) res.status(200).json( result );
      else res.sendStatus(404);
    });
});

app.get('/api/systems', (req, res) => {
  app.locals.db.collection('recoveries')
    .find({}, { 
      projection: {
        _id: false,
        graph: false,
        sources: false
      }, 
      sort: 'name'
    }).toArray((err, result) => {
      if(err) res.sendStatus(500);
      else res.status(200).json(result || []);
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

MongoClient.connect('mongodb://localhost:27017', function (err, client) {
  if(err) throw err;
  app.locals.db = client.db('sw_arch');
  let port = process.env.PORT || 8080;
  app.listen(port, function () {
    console.log('Server running on port ' + port);
    console.log('Serving ' + path.join(__dirname, '../dist/'));
  });
});