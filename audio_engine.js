var FMOD = {};                          // FMOD global object which must be declared to enable 'main' and 'preRun' and then call the constructor function.
FMOD['preRun'] = prerun;                // Will be called before FMOD runs, but after the Emscripten runtime has initialized
FMOD['onRuntimeInitialized'] = main;    // Called when the Emscripten runtime has initialized
FMOD['INITIAL_MEMORY'] = 64*1024*1024;  // FMOD Heap defaults to 16mb which is enough for this demo, but set it differently here for demonstration (64mb)
FMODModule(FMOD);                       // Calling the constructor function with our object

var gSystem;                            // Global 'System' object which has the top level API functions.  Sounds and channels are created from this.
var gSound = {};                        // Array of 3 sounds.
var gChannel;                           // Last channel that is playing a sound.
var gEffects;                           // boolean to toggle effects on or off
var gDSP;                               // handle to reverb DSP effect.

fileName = [
    "flow-water.wav",
    "water-flow(1).wav",
    "water-flow(2).wav",
    "waterfall.wav",
    "watertap.wav"
];

function CHECK_RESULT(result) {     // error checking
    if (result != FMOD.OK) {
        var msg = "Error: '" + FMOD.ErrorString(result) + "'";
        throw msg;
    }
}

function prerun() {                 // preload assets from server
    var fileUrl = "/assets/";
    var folderName = "/";
    var canRead = true;
    var canWrite = false;

    for (var count = 0; count < fileName.length; count++) {
        FMOD.FS_createPreloadedFile(folderName, fileName[count], fileUrl + fileName[count], canRead, canWrite);
    }
}

function main() {
    var outval = {};
    var result;

    console.log("Creating FMOD System object\n");
    result = FMOD.System_Create(outval);
    CHECK_RESULT(result);

    console.log("grabbing system object from temporary and storing it\n");
    gSystem = outval.val;

    // Optional.  Setting DSP Buffer size can affect latency and stability.
    // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
    console.log("set DSP Buffer size.\n");
    result = gSystem.setDSPBufferSize(2048, 2);
    CHECK_RESULT(result);

    // Optional.  Set sample rate of mixer to be the same as the OS output rate.
    // This can save CPU time and latency by avoiding the automatic insertion of a resampler at the output stage.
    console.log("Set mixer sample rate");
    result = gSystem.getDriverInfo(0, null, null, outval, null, null);
    CHECK_RESULT(result);
    result = gSystem.setSoftwareFormat(outval.val, FMOD.SPEAKERMODE_DEFAULT, 0)
    CHECK_RESULT(result);

    console.log("initialize FMOD\n");

    // 1024 virtual channels
    result = gSystem.init(1024, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);

    console.log("initialize Application.");
    initApplication();

    // Starting up your typical JavaScript application loop. Set the framerate to 50 frames per second, or 20ms.
    console.log("Get started playing sound\n");
    return FMOD.OK;
}

function channelCallback(channelcontrol, controltype, callbacktype, commanddata1, commanddata2) {             // callback method to fmod core
    if (callbacktype === FMOD.CHANNELCONTROL_CALLBACK_END) {
        console.log("CALLBACK : Channel Ended");
        gChannel = null;
    }

    return FMOD.OK;
}

async function playSound(soundid) {     // play sound by sound id (index in array of assets)
    var channelOut = {};
    var result;

    result = gSystem.playSound(gSound[parseInt(soundid)], null, true, channelOut);
    CHECK_RESULT(result);
    gChannel = channelOut.val;

    result = gChannel.setCallback(channelCallback)
    CHECK_RESULT(result);

    result = gChannel.setPaused(false);
    CHECK_RESULT(result);
}

function initApplication() {         // initialize all sounds
    console.log("Loading sounds\n");

    var outval = {};
    var result;
    var exinfo = FMOD.CREATESOUNDEXINFO();

    exinfo.userdata = 12345;
    console.log("FMOD.CREATESOUNDEXINFO::userdata = " + exinfo.userdata)

    // creating sounds (preload from assets dir)
    for(let fileNameIndex = 0; fileNameIndex < fileName.length; ++fileNameIndex) {
        result = gSystem.createSound('/' + fileName[fileNameIndex], FMOD.LOOP_OFF, exinfo, outval);
        CHECK_RESULT(result);
        gSound[fileNameIndex] = outval.val;
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateLoop() {

    function getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    await playSound(getRandomInt(5));

    async function loop() {
        while (true) {
            await playSound(getRandomInt(5));
            await sleep(2000);
        }
    }

    await loop();
    console.log('Sound started');
}