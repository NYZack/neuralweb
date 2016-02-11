var fs = require('fs');
var nconf = require('nconf');

//this contains the list of files waiting to be captioned, in the form {path:'/something/something.ext',sha256sum:'...'}
var pending = [];
var isAlreadyRunning = false;

//latest result form image processing
var latestOutcome = {timestamp:new Date().toISOString(), status:'OK', detail:'never executed'};

//application configuration, use the CLI args, the env variables and then, if nothing was found, the default values
nconf.argv().env();

nconf.defaults({
  port: 5000,
  modelPath: '/home/ubuntu/extras/model_id1-501-1448236541.t7_cpu.t7',
  processFolder: '/home/ubuntu/extras/images',
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
  var ntprocess = spawn('th', ['eval.lua','-model',nconf.get('modelPath'),'-image_folder',nconf.get('processFolder'),'-gpuid',nconf.get('useGPU'),'-dump_path','1'],{cwd:'/home/ubuntu/neuralweb/neuraltalk2/'});

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
  var dir = '/home/ubuntu/extras/captions'
  var saveddir = '/home/ubuntu/extras/savedcaptions'
  fs.readdirSync(dir).forEach(function(file) {
    var path = dir+'/'+file;
    fs.readFile(path, 'utf8',(err, caption) => {
      if(err){
        console.log("Error reading caption for file " + file);
        caption = "Error reading caption."
      }
      for (var i = pending.length - 1; i >= 0; i--) {
        if (pending[i].sha256sum == file) {
          try {
            pending[i].reply.json({response:caption,filename:file});
            console.log('Replied with caption ' + caption);
          } catch (e) {
            console.log('Error responding with ' + caption);
          }
          pending.splice(i, 1);
        }
      } 
//      fs.unlink(path);

      movefile(path, saveddir+'/'+file, function (err) {
        if(err){
          console.log('Could not save caption file '+file);
        };
      });

    });
  });
},5000);

 
var copyfile = function(sourcename, destname, cb) {
  var dest = fs.createWriteStream(destname);
  var source = fs.createReadStream(sourcename);  
  source.pipe(dest);
  dest.on('finish', function() {
    dest.close(function(err,resp){
      if(err){
        cb(err);
        return;
      }
      cb(0);
    });
  });
}; 

var movefile = function(sourcename, destname, cb) {
  fs.rename(sourcename, destname, function(err) {
    if (err) {
      console.log("Rename not working.");
      copyfile(sourcename, destname, function(err) {
        if (err) {
          cb(err);
          return;
        } else {
          fs.unlink(sourcename);
        }
      });
    }
  });
  cb(0);
};
 
module.exports = function(app) {

  app.post('/upload', function(req, http_res) {
    console.log(req.files.image.originalFilename);
    var oldpath = req.files.image.path;
    console.log(oldpath);

    var fnameonly = oldpath.replace(/^.*[\\\/]/, '')
    var key = oldpath.replace(/\\/g, '/');
//    key = key.substring(key.lastIndexOf('/')+1, key.lastIndexOf('.'));
    key = key.substring(key.lastIndexOf('/')+1, key.length);
    var dopush = 1;
    newpath = nconf.get('processFolder') + '/' + fnameonly
        
    movefile(oldpath, newpath, function (err) {
      if(err){
        http_res.json({response:"File copy error."});
        return;
      } else {
        if (!isAlreadyRunning) {
          isAlreadyRunning = true;  
          runNeuralTalk(retCode => {
            isAlreadyRunning = false;
            console.log(" +++ return code from neuraltalk2: "+retCode);
            if(retCode !== 0){
              dopush = 0;
              http_res.json({response:"Error processing file."});
              return;
            }
          });
        }
      }
    });
    if (dopush) {
      pending.push({sha256sum:key, reply:http_res});
    } else {
      dopush = 1;
    }
  });
};
 
