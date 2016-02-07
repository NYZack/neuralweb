'use strict';
/**
 * Module dependencies.
 */
var express  = require('express');
var connect = require('connect');
var app      = express();
var port     = process.env.PORT || 5000;
 
// Configuration
app.use(express.static(__dirname + '/public'));
app.use(connect.cookieParser());
app.use(connect.logger('dev'));
app.use(connect.bodyParser());
 
app.use(connect.json());
app.use(connect.urlencoded());
 
// Routes
 
require('./routes/routes.js')(app);
 
 
app.listen(port);
console.log('The App runs on port ' + port);










/*

//this object will map the images SHA256 sums with their captions
var sha256Captions = new NodeCache({stdTTL: 60*30, checkperiod: 11});
//this contains the list of files waiting to be captioned, in the form {path:'/something/something.ext',sha256sum:'...'}
var pending = [];
var isAlreadyRunning = false;

//latest result form image processing
var latestOutcome = {timestamp:new Date().toISOString(), status:'OK', detail:'never executed'};

//application configuration, use the CLI args, the env variables and then, if nothing was found, the default values
nconf.argv().env();

nconf.defaults({
  port: 5000,
  modelPath: '/mounted/model_id1-501-1448236541.t7_cpu.t7',
  processFolder: '/tmp/',
  useGPU: '-1'
});


//check that the model and the processing folder are present
try{
  fs.statSync(nconf.get('modelPath'));
}
catch(e){
  console.error("cannot find model file: "+nconf.get('modelPath')+" is the Docker volume  mounted correctly using the -v option?");
  process.exit(1);
}



try{
  fs.statSync(nconf.get('processFolder'));
}
catch(e){
  console.error("cannot find process folder: "+nconf.get('processFolder'));
  process.exit(1);
}


var runNeuralTalk = function(callback){
  var spawn = require('child_process').spawn;
  var ntprocess = spawn('th', ['eval.lua','-model',nconf.get('modelPath'),'-image_folder',nconf.get('processFolder'),'-gpuid',nconf.get('useGPU'),'-dump_path','1'],{cwd:'/neuraltalk2/'});

  ntprocess.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  ntprocess.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  ntprocess.on('close', function (code) {
    console.log('neuraltalk2 process exited with code ' + code);
    callback(code);
  });
};


setInterval(()=>{
  if(pending.length === 0){
    return;
  };


  var dir = '/mounted/captions'
  fs.readdirSync(dir).forEach(function(file) {
    var path = dir+'/'+file;
    fs.readFile(path, 'utf8',(err, caption) => {
      if(err){
        latestOutcome = {timestamp:new Date().toISOString(), status:'error parsing the captions',detail:err};
        return;
      }
      console.log("sha256file "+file+" => "+caption);
      for (var i = pending.length - 1; i >= 0; i--) {
        if (pending[i].sha256sum == file) {
          pending[i].reply.json({caption:caption});
          pending.splice(i, 1);
          console.log(' Found caption ' + caption);
        }
      } 
      fs.unlink(path);
    });
  });
},5000);

app.use(express.static('static'));
app.use(bodyParser.json({limit: '6mb'}));


//app.use(express.static(__dirname + '/public'));
app.use(connect.cookieParser());
app.use(connect.logger('dev'));
app.use(connect.bodyParser());
 
//app.use(connect.json());
app.use(connect.urlencoded());
require('./routes/routes.js')(app);
app.listen(port);
console.log('The App runs on port ' + port);



/*start the server
server.listen(nconf.get('port'), function () {
  var port = server.address().port;
  console.log(' Application started on port', port);
});


app.get('/',function(req,res){
    res.end("Node-File-Upload");
});

app.post('/upload', function(req, res) {
  console.log(req.files.image.originalFilename);
  console.log(req.files.image.path);
  fs.readFile(req.files.image.path, function (err, data) {
    var newPath = '/tmp/'+uuid.v1();
    fs.writeFile(newPath, data, function (err) {
      if(err){
        res.json({'response':"Error"});
        return;
      }
      res.json({'response':"Saved"});
      var key = res.sha256sum;
      console.log({path:newpath,sha256sum:key});
      helpers.cp(newpath,nconf.get('processFolder')+'/'+key+'.'+res.extension,err => {
        if(err){
          console.error("error copying file to be processed",err)
            return;
        }
        fs.unlink(newpath);
      });

      if (!isAlreadyRunning) {
        isAlreadyRunning = true;  
        runNeuralTalk(retCode => {
          isAlreadyRunning = false;
          console.log(" +++ return code from neuraltalk2: "+retCode);
          if(retCode !== 0){
            latestOutcome = {timestamp:new Date().toISOString(), status:'failure', retCode:retCode};
            return;
          }
        });
      } 
      pending.push({sha256sum:key, reply:http_res});
    });
  });
});*/
