// http://sb.bitsnbites.eu/?data=U0JveAsC7d2xihNRFADQO2-SSCCVYJciYGHlB-hWgo1gsdiLiDY2VllQlmWnEEPcbFwIiIisYO8X2ASUgH_lRBMN4y4plGQHz4HJffe9Idy8zDS5hJnuRrR7qSgiFaPLEaez0_ghNSN6Ebc6Wcry-dFoxlYcLOKLRRwuF0ZRC_urNZf6i_hsK9V0ur-G3c4Z6zd-T3ZmZ9Zfs-3_o_Zh1Eu13kHN698PAAAAAAD4e5NKXv39_G0lf1XJ31fy8YbrT9Mii-m8N9fd_Vzmo_ayN3cpK9P5kS7KXg9qfq0M3S4AAAAAAAD_tfxrP_LZYTk6vPNm3odrZvnRpyudl3k0ludkW-rOrfayzvuv1vE541UnlXy84fqX8fUiDiqf6bgyf1Sp-6TyPmOXLQAAAAAAQC2lh3uRnvTbEY92DiLyncjy6_dSb9B4kG-7tndr1j-sWf_o6wUAAAAAAOAiub-Xxe2nkUWjdfXnTMoju3Z35Rlz2ZZKm6yJAAAAAAAAUCfpcRH5t6IcNVs3y9cvrSwNInqT1vOW3QEAAAAAAIB_R28OAAAAAAAANkNvDgAAAAAAADbjOw
// This music has been exported by SoundBox. You can use it with
// http://sb.bitsnbites.eu/player-small.js in your own product.

// See http://sb.bitsnbites.eu/demo.html for an example of how to
// use it in a demo.



function loadSong() {
  info = "loading music... 0%";
  setTimeout(function() {

    loadingStart = Date.now();
      // load music
      mp = new CPlayer();
      mp.init(song);
      genSound();
  },500); // give time to display message
}
// load music
function genSound() {
  var progress =mp.generate();
  info = "loading music... " + Math.floor(progress * 100) + "%";
    if (progress <1) {
      if (Date.now()-loadingStart > progress * 20000) {
        // too slow
        info = "device is too slow to synthesize music";
        setTimeout(function() {info=null;}, 5000);
        localStorage.musicOn = 0;
      } else {
        setTimeout(genSound, 100);
      }
    } else {

      info = null;

      // Put the generated song in an Audio element.
      var wave = mp.createWave();
      backgroundMusic = document.createElement("audio");
      backgroundMusic.src = URL.createObjectURL(new Blob([wave], {type: "audio/wav"}));
      backgroundMusic.loop = true;
      if (localStorage.musicOn == 1) {
        backgroundMusic.play();
      }

    }
}

// Song data
var song = {
songData: [
  { // Instrument 0
    i: [
    2, // OSC1_WAVEFORM
    128, // OSC1_VOL
    128, // OSC1_SEMI
    0, // OSC1_XENV
    2, // OSC2_WAVEFORM
    128, // OSC2_VOL
    140, // OSC2_SEMI
    18, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    158, // ENV_ATTACK
    198, // ENV_SUSTAIN
    158, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    0, // LFO_AMT
    0, // LFO_FREQ
    0, // LFO_FX_FREQ
    2, // FX_FILTER
    5, // FX_FREQ
    0, // FX_RESONANCE
    0, // FX_DIST
    32, // FX_DRIVE
    0, // FX_PAN_AMT
    0, // FX_PAN_FREQ
    65, // FX_DELAY_AMT
    12 // FX_DELAY_TIME
    ],
    // Patterns
    p: [1,2,1,3,1,2,1,3,4,5],
    // Columns
    c: [
      {n: [125,,,,,,,,132,,,,,,,,137,,,,,,,,,140],
       f: []},
      {n: [123,,,,137,,,,,,,,,,,,116,,,,,,,,120],
       f: [,,,,,,,,,,,,,,12,28,,,,,,,,,,28,12,,,,,,,,,,,,,,,,,,,,57,12,,,,,,,,,,12,198]},
      {n: [123,,,,137,,,,,,,,,,,,,,,,,,,,140],
       f: []},
      {n: [137,,,,,,,,,,,,,,,,137],
       f: []},
      {n: [137,,,,,,,,,,,,,,,,135],
       f: []}
    ]
  },
  { // Instrument 1
    i: [
    2, // OSC1_WAVEFORM
    192, // OSC1_VOL
    128, // OSC1_SEMI
    1, // OSC1_XENV
    0, // OSC2_WAVEFORM
    192, // OSC2_VOL
    140, // OSC2_SEMI
    18, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    28, // ENV_ATTACK
    80, // ENV_SUSTAIN
    187, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    140, // LFO_AMT
    9, // LFO_FREQ
    0, // LFO_FX_FREQ
    2, // FX_FILTER
    5, // FX_FREQ
    0, // FX_RESONANCE
    0, // FX_DIST
    32, // FX_DRIVE
    0, // FX_PAN_AMT
    0, // FX_PAN_FREQ
    7, // FX_DELAY_AMT
    1 // FX_DELAY_TIME
    ],
    // Patterns
    p: [,,,1,,,,2],
    // Columns
    c: [
      {n: [,,,,,,,,,,,,,,,,135],
       f: []},
      {n: [,,,,,,,,,,,,,,,,137],
       f: []}
    ]
  },
  { // Instrument 2
    i: [
    3, // OSC1_WAVEFORM
    196, // OSC1_VOL
    116, // OSC1_SEMI
    0, // OSC1_XENV
    3, // OSC2_WAVEFORM
    198, // OSC2_VOL
    127, // OSC2_SEMI
    0, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    127, // ENV_ATTACK
    73, // ENV_SUSTAIN
    150, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    2, // LFO_WAVEFORM
    0, // LFO_AMT
    5, // LFO_FREQ
    1, // LFO_FX_FREQ
    3, // FX_FILTER
    139, // FX_FREQ
    173, // FX_RESONANCE
    21, // FX_DIST
    12, // FX_DRIVE
    134, // FX_PAN_AMT
    3, // FX_PAN_FREQ
    0, // FX_DELAY_AMT
    4 // FX_DELAY_TIME
    ],
    // Patterns
    p: [,,,,,,,,1,2],
    // Columns
    c: [
      {n: [137,,,,,,,,,,,,140,,,,,,,,,,,,,,,,,,,,,,,,141,,,,,,,,,,,,141,,,,,,,,,,,,,,,,,,,,,,,,144,,,,,,,,,,,,,,,,142],
       f: []},
      {n: [137,,,,,,,,137,,,,,,,,143,,,,,,,,135,,,,,,,,140,,,,,,,,141,,,,,,,,135,,,,,,,,139,,,,,,,,144,,,,,,,,144,,,,,,,,137,,,,,,,,142],
       f: []}
    ]
  },
  { // Instrument 3
    i: [
    2, // OSC1_WAVEFORM
    97, // OSC1_VOL
    117, // OSC1_SEMI
    0, // OSC1_XENV
    2, // OSC2_WAVEFORM
    105, // OSC2_VOL
    116, // OSC2_SEMI
    9, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    99, // ENV_ATTACK
    59, // ENV_SUSTAIN
    125, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    3, // LFO_WAVEFORM
    59, // LFO_AMT
    0, // LFO_FREQ
    1, // LFO_FX_FREQ
    3, // FX_FILTER
    45, // FX_FREQ
    82, // FX_RESONANCE
    2, // FX_DIST
    32, // FX_DRIVE
    135, // FX_PAN_AMT
    4, // FX_PAN_FREQ
    95, // FX_DELAY_AMT
    3 // FX_DELAY_TIME
    ],
    // Patterns
    p: [],
    // Columns
    c: [
    ]
  },
  { // Instrument 4
    i: [
    0, // OSC1_WAVEFORM
    93, // OSC1_VOL
    117, // OSC1_SEMI
    1, // OSC1_XENV
    0, // OSC2_WAVEFORM
    68, // OSC2_VOL
    110, // OSC2_SEMI
    0, // OSC2_DETUNE
    1, // OSC2_XENV
    0, // NOISE_VOL
    4, // ENV_ATTACK
    6, // ENV_SUSTAIN
    35, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    0, // LFO_AMT
    0, // LFO_FREQ
    0, // LFO_FX_FREQ
    2, // FX_FILTER
    3, // FX_FREQ
    0, // FX_RESONANCE
    1, // FX_DIST
    39, // FX_DRIVE
    76, // FX_PAN_AMT
    5, // FX_PAN_FREQ
    0, // FX_DELAY_AMT
    0 // FX_DELAY_TIME
    ],
    // Patterns
    p: [,,,,,,,,1],
    // Columns
    c: [
      {n: [147,,,,,,,,147,,,,,,,,147,,,,,,,,147],
       f: []}
    ]
  },
  { // Instrument 5
    i: [
    2, // OSC1_WAVEFORM
    100, // OSC1_VOL
    128, // OSC1_SEMI
    0, // OSC1_XENV
    3, // OSC2_WAVEFORM
    201, // OSC2_VOL
    128, // OSC2_SEMI
    0, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    5, // ENV_ATTACK
    6, // ENV_SUSTAIN
    58, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    195, // LFO_AMT
    6, // LFO_FREQ
    1, // LFO_FX_FREQ
    2, // FX_FILTER
    135, // FX_FREQ
    0, // FX_RESONANCE
    0, // FX_DIST
    32, // FX_DRIVE
    147, // FX_PAN_AMT
    6, // FX_PAN_FREQ
    121, // FX_DELAY_AMT
    6 // FX_DELAY_TIME
    ],
    // Patterns
    p: [],
    // Columns
    c: [
    ]
  },
  { // Instrument 6
    i: [
    2, // OSC1_WAVEFORM
    100, // OSC1_VOL
    128, // OSC1_SEMI
    0, // OSC1_XENV
    3, // OSC2_WAVEFORM
    201, // OSC2_VOL
    128, // OSC2_SEMI
    0, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    5, // ENV_ATTACK
    6, // ENV_SUSTAIN
    58, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    195, // LFO_AMT
    6, // LFO_FREQ
    1, // LFO_FX_FREQ
    2, // FX_FILTER
    135, // FX_FREQ
    0, // FX_RESONANCE
    0, // FX_DIST
    32, // FX_DRIVE
    147, // FX_PAN_AMT
    6, // FX_PAN_FREQ
    121, // FX_DELAY_AMT
    6 // FX_DELAY_TIME
    ],
    // Patterns
    p: [],
    // Columns
    c: [
    ]
  },
  { // Instrument 7
    i: [
    2, // OSC1_WAVEFORM
    100, // OSC1_VOL
    128, // OSC1_SEMI
    0, // OSC1_XENV
    3, // OSC2_WAVEFORM
    201, // OSC2_VOL
    128, // OSC2_SEMI
    0, // OSC2_DETUNE
    0, // OSC2_XENV
    0, // NOISE_VOL
    5, // ENV_ATTACK
    6, // ENV_SUSTAIN
    58, // ENV_RELEASE
    0, // ARP_CHORD
    0, // ARP_SPEED
    0, // LFO_WAVEFORM
    195, // LFO_AMT
    6, // LFO_FREQ
    1, // LFO_FX_FREQ
    2, // FX_FILTER
    135, // FX_FREQ
    0, // FX_RESONANCE
    0, // FX_DIST
    32, // FX_DRIVE
    147, // FX_PAN_AMT
    6, // FX_PAN_FREQ
    121, // FX_DELAY_AMT
    6 // FX_DELAY_TIME
    ],
    // Patterns
    p: [],
    // Columns
    c: [
    ]
  }
],
rowLen: 20672,   // In sample lengths
patternLen: 32,  // Rows per pattern
endPattern: 11  // End pattern
};
