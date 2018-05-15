//Sequencer
var Seq = (function() {
  "use strict";

  var debug = true;
  var seq_canvas; //Main canvas
  var cvs_width = 1024;
  var cvs_height;
  var note_size;
  var cvs;
  var ctx;

  var bpm = 120;
  var Timer = 0;
  var loopExit = false;
  var count_4note = 0;
  var count_8note = 0;
  var count_loop = 0;
  var count_pos = 0;

  var seq_data;
  var notes = [];

  var SoundBuffer = [];
  var bufferLoader;

  var audiofiles = [
    "./sounds/0/00.mp3",
    "./sounds/0/01.mp3",
    "./sounds/0/02.mp3",
    "./sounds/0/03.mp3",
    "./sounds/0/04.mp3",
    "./sounds/0/05.mp3",
    "./sounds/0/06.mp3",
    "./sounds/0/07.mp3"
  ];
  var seq_volume = 0.2;
  var gainNode;
  var clc = false;
  var prv_time;

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var context;

  var nextNotetime;

  //Initialization
  var Init = function() {
    if (debug) console.log("--Initilize");

    //Set note size
    if (debug) console.log("cvs_width", cvs_width);
    note_size = Math.floor(cvs_width / 16);
    if (debug) console.log("Notesize", note_size);

    cvs_height = note_size * 8;

    //Create main canvas element
    document.write("<div id=\"_seqbox\"></div>");
    var div_elm = document.getElementById("_seqbox");
    div_elm.style.border = "hidden";

    seq_canvas = document.createElement('canvas');
    seq_canvas.id = "seq_cvs";
    seq_canvas.width = cvs_width;
    seq_canvas.height = cvs_height;
    div_elm.appendChild(seq_canvas);
    if (debug) console.log("Canvas element is created");

    //Get canvas context
    cvs = document.getElementById("seq_cvs");
    ctx = cvs.getContext("2d");

    ctx.fillRect(0, 0, cvs_width, cvs_height);
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText("Now loading...", Math.floor(cvs_width / 2) - 70, Math.floor(cvs_height / 2), 250);
    if (debug) console.log("Loading screen is showed");

    //Load sound datas
    openContext();
    loadSounds();
  };

  //After loaded sounds, show default canvas
  var showSequencer = function() {

    //Declare mouse event
    cvs.addEventListener('mousedown', mousedown, false);
    //Create sequence data
    createSeqData();
    //Clear canvas
    ctx.clearRect(0, 0, cvs_width, cvs_height);

    //Draw grid
    drawGrid();

    if (debug) console.log("--Finished loading");
  };

  //Create sequence data
  var createSeqData = function() {
    //Declare empty data
    seq_data = {
      "0": "................................................",
      "1": "................................................",
      "2": "................................................",
      "3": "................................................",
      "4": "................................................",
      "5": "................................................",
      "6": "................................................",
      "7": "................................................"
    };
    var r = new RegExp(".{1,3}", "g");

    for (var i = 0; i < Object.keys(seq_data).length; i++) {
      notes[i] = seq_data[i].match(r);
    }

    if (debug) console.log("Sequence data is created ");
  };

  var loadSounds = function() {
    var buf_num = audiofiles.length;
    var buf_c = 0;
    if (debug) console.log("Trying to load audio files");

    bufferLoader = new BufferLoader(
      context,
      audiofiles,
      showSequencer
    );
    bufferLoader.load();

  };

  var openContext = function(){
    context = new AudioContext();
    console.log("Opencontext",context);
    nextNotetime = context.currentTime;
    //Add gainNode
    gainNode = context.createGain();
    gainNode.connect(context.destination); //Connect to speaker
    gainNode.gain.value = seq_volume; //Set volume
  };

  //Play audio data
  var playSound = function(time, id) {
    prv_time = time;
    var src = context.createBufferSource(); // creates a sound source
    src.buffer = bufferLoader.bufferList[id]; // tell the source which sound to play
    src.connect(gainNode);
    src.start(time);
    src.stop(time + 0.1);
  };

  //Play synth for metronome
  var playSound2 = function(time) {
    var osc = context.createOscillator();
    osc.connect(context.destination);
    osc.frequency.value = 440;
    osc.start(time);
    osc.stop(time + 0.1);
  };

  //Draw grid
  var drawGrid = function() {
    ctx.beginPath();
    for (var i = 0; i < 17; i++) {
      ctx.moveTo(i * note_size, 0);
      ctx.lineTo(i * note_size, note_size * 8);
    }
    for (var i = 0; i < 9; i++) {
      ctx.moveTo(0, i * note_size);
      ctx.lineTo(note_size * 16, i * note_size);
    }
    ctx.stroke();
  };

  //Draw now position
  var drawPosition = function() {
    var pos = count_loop - 1;
    if (count_loop == 0) {
      pos = 15;
    }
    var color = "rgba(" + [231, 225, 143, 0.3] + ")";
    if ( ( pos % 2 ) == 0 ) {
      color = "rgba(" + [224, 132, 132, 0.3] + ")";
      if(clc) playSound2(context.currentTime+0.1);
    }
    ctx.fillStyle = color;
    ctx.fillRect(pos * note_size, 0, note_size, note_size * 8);

  };

  //Draw notes and Play sounds
  var drawNotes = function(time, mode) {
    for (var i2 = 0; i2 < 8; i2++) {
      if(mode == 1 && notes[i2][count_loop] != "...") playSound(time, notes[i2][count_loop]);
      for (var i = 0; i < 16; i++) {
        if (notes[i2][i] != "...") {
          ctx.fillStyle = "rgb(" + [73, 0, 204] + ")";
          ctx.fillRect(note_size * i + 4, note_size * i2 + 4, note_size - 8, note_size - 8);
        }
      }
    }

  };

  //Get data
  var Data = function() {
    console.log(seq_data);
  };

  //Mouse events
  var mousedown = function(e) {
    var rect = e.target.getBoundingClientRect();
    var x = e.clientX - rect.left;
    var y = e.clientY - rect.top;
    x = Math.floor(x / note_size);
    y = Math.floor(y / note_size);
    if (debug) console.log("mouse", x, y);

    if (notes[y][x] == "...") {
      notes[y][x] = "00" + y;
      ctx.fillStyle = "rgb(" + [73, 0, 204] + ")";
      ctx.fillRect(note_size * x + 4, note_size * y + 4, note_size - 8, note_size - 8);
      playSound(context.currentTime,"00" + y);
      console.log("put");
    } else{
      notes[y][x] = "...";
      ctx.clearRect(note_size * x + 4, note_size * y + 4, note_size - 8, note_size - 8);
    }

  };

  //Switch metronome
  var Metronome = function(bool){
    clc = bool;
  };

  //Switch bpm
  var setBPM = function(int){
    bpm = int;
  };

  //Start Sequencer
  var Start = function() {
    context.close();
    count_loop = 0;
    count_pos = 1;
    console.log("Start");
    openContext();
    scheduler();
  };

  //Stop Sequencer
  var Stop = function() {
    count_loop = 0;
    count_pos = 1;
    clearTimeout(Timer);
    context.close();
    openContext();
    ctx.clearRect(0, 0, cvs_width, cvs_height);
    drawNotes(0,0);
    drawGrid();
  };

  //Scheduler main loop
  function scheduler() {

      while(nextNotetime < context.currentTime + 0.1) {
        if (debug) console.log("loop",count_loop);

          nextNotetime += 60.0 / (bpm * 2);
          if (debug) console.log("Next", nextNotetime);
          //playSound(nextNotetime,"000");

          ctx.clearRect(0, 0, cvs_width, cvs_height);
          drawNotes(nextNotetime,1);
          drawPosition();
          drawGrid();
          //Loop Sequence
          if (count_loop == 15) {
            //loopExit = true;
            count_loop = -1;

          }

          count_loop++;
          count_pos++;
      }
     Timer = window.setTimeout(scheduler, 50.0);

  }

  //----------------------------------------------
  //Edited "Buffer-Loader.js" by HTML5Rocks
  //----------------------------------------------

  function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = [];
    this.loadCount = 0;
  }

  BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    var loader = this;

    //Get sound id
    var id = url.slice(-8).slice(0, -4).replace("/", "");

    request.onload = function() {
      // Asynchronously decode the audio file data in request.response
      loader.context.decodeAudioData(
        request.response,
        function(buffer) {
          if (!buffer) {
            console.log('error decoding file data: ' + url);
            return;
          }
          loader.bufferList[id] = buffer;
          if (++loader.loadCount == loader.urlList.length)
            loader.onload(loader.bufferList);
        },
        function(error) {
          console.error('decodeAudioData error', error);
        }
      );
    };

    request.onerror = function() {
      console.log('BufferLoader: XHR error');
    };

    request.send();
  };

  BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i)
      this.loadBuffer(this.urlList[i], i);
  };

  return {
    Init: Init,
    Start: Start,
    Stop: Stop,
    Data: Data,
    Metronome: Metronome,
    setBPM: setBPM
  };

}(document));
