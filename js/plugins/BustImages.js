/*:
 * @target MZ
 * @plugindesc A VN style bust system for RPGM MZ
 * 
 * @author dreais
 * 
 * @help
 * Ready to use features:
 * - Multiple busts
 * - Dynamic IDs based on characters names
 * - Basic bust movements with presets or hard coordinates
 * - Handles pose & expression separately using appropriate subfolders, based on bust IDs
 * 
 * Planned features:
 * - More effects (transitions, movements, scales)
 * - Handling animated parts (lip sync, blinking, "breath" like movements)
 * 
 * Available commands:
 * - Show Busts
 * - Move Busts
 * 
 * For all commands, a "Speaker Name" is required and acts as a unique ID for characters. Poses and faces need to be included in img/pictures/busts/[speaker name] as a separate folder.
 * 
 * @version 0.1
 * @url https://github.com/dreais/BustImages
 *
 * @command showBusts
 * @text Show Busts
 * @desc Shows a bust
 * 
 * @arg speaker_name
 * @text Speaker Name (ID)
 * @desc The name of the speaker whose bust to show
 * @type string
 * 
 * @arg Bust Assets
 * @text Bust Assets
 * 
 * @arg pose
 * @desc The pose of the speaker's bust to show
 * @text Pose
 * @type string
 * @parent Bust Assets
 * 
 * @arg face
 * @desc The face of the speaker's bust to show
 * @text Face
 * @type string
 * @parent Bust Assets
 * 
 * @arg Bust Positioning
 * @text Bust Positioning
 * 
 * @arg pos_preset
 * @desc The preset position of the bust
 * @text Position Preset
 * @type select
 * @option 0
 * @option 1
 * @option 2
 * @option 3
 * @option 4
 * @option 5
 * @default 0
 * @parent Bust Positioning 
 * 
 * @arg Bust Coordinates
 * @text Bust Coordinates
 * @parent Bust Positioning
 * 
 * @arg x
 * @desc The x position of the bust
 * @text X Position
 * @type number
 * @default 0
 * @parent Bust Coordinates
 * 
 * @arg y
 * @desc The y position of the bust
 * @text Y Position
 * @type number
 * @default 0
 * @parent Bust Coordinates
 * 
 * @command moveBusts
 * @text Move Busts
 * @desc Moves a bust to a new position
 * 
 * @arg speaker_name
 * @text Speaker Name (ID)
 * @desc The name of the speaker whose bust to move
 * @type string
 * 
 * @arg Bust Positioning
 * @text Bust Positioning
 * 
 * @arg pos_preset
 * @desc The preset position of the bust
 * @text Position Preset
 * @type select
 * @option 0
 * @option 1
 * @option 2
 * @option 3
 * @option 4
 * @option 5
 * @default 0
 * @parent Bust Positioning 
 * 
 * @arg x
 * @desc The new x position of the bust
 * @text X Position
 * @type number
 * @default 0
 * @parent Bust Positioning
 * 
 * @arg y
 * @desc The new y position of the bust
 * @text Y Position
 * @type number
 * @default 0
 * @parent Bust Positioning
 * 
 * @arg Transition Effects
 * @text Transition Effects
 * 
 * @arg duration
 * @desc The duration of the movement in milliseconds
 * @text Duration
 * @type number
 * @default 3000
 * @parent Transition Effects
 */


console.log("BustImages plugin loaded!");

const createEmptySprite = function(x, y, filename) {
    const sprite = new Sprite();
    sprite.x = x;
    sprite.y = y;
    sprite.bitmap = ImageManager.loadPicture(filename);
    sprite.visible = false;
    return sprite;
}


// ----------------------
// BustManager class
// ----------------------

function BustManager() {
    this.initialize(...arguments);
}

BustManager.prototype = Object.create(Object.prototype);
BustManager.prototype.constructor = BustManager;

BustManager.prototype.initialize = function() {
    this.container = null;
    this._busts = [];
    this._active_bust = null;
};

BustManager.prototype.showBusts = function(name, pose, face, x, y) {
    if (!this.container) {
        this.container = new PIXI.Container();
    }
    const scene = SceneManager._scene;
    if (this.container && this.container.parent !== scene) {
        const windowLayerIndex = scene.children.indexOf(scene._windowLayer);
        scene.addChildAt(this.container, windowLayerIndex);
    }
    // Initialize the bust pose and face if they don't exist
    if (!this._busts[name]) {
        this._busts[name] = new Bust(name, pose, face, x, y);
    } else {
        this._busts[name].updateBust(pose, face);
    }
    if (this._busts[name]) {
        this._busts[name]._container.visible = true;
        this._busts[name]._faceSprite.tint = 0xFFFFFF;
        this._busts[name]._poseSprite.tint = 0xFFFFFF;
        this.container.addChild(this._busts[name]._container);
    }
};

BustManager.prototype.update = function() {
    if (!this._busts) return

    for (const bust of Object.values(this._busts)) {
        if (bust.needsUpdate()) {
            console.log(`Updating bust ${bust._name} position from (${bust._container.x}, ${bust._container.y}) to (${bust._targetX}, ${bust._targetY})`);
            const elapsed = performance.now() - bust._moveStartTime;
            const progress = Math.min(elapsed / bust._moveDuration, 1);
            bust._container.x += (bust._targetX - bust._container.x) * progress;
            bust._container.y += (bust._targetY - bust._container.y) * progress;
            if (progress === 1) {
                bust._moving = false;
                bust._container.x = bust._targetX;
                bust._container.y = bust._targetY;
            }
            bust._container.x = Math.round(bust._container.x);
            bust._container.y = Math.round(bust._container.y);

        }
    }
}


// ----------------------
// Bust class
// ----------------------

function Bust(name, pose, face, x, y) {
    this.initialize(...arguments);
}

Bust.prototype.initialize = function(name, pose, face, x, y) {
    // Container for the bust's pose and face sprites 
    this._container = new PIXI.Container();
    this._container.x = x;
    this._container.y = y;
    // Essentially an ID for each busts
    this._name = name;
    // Related to bust movements
    this._startX = x;
    this._startY = y;
    this._targetX = x;
    this._targetY = y;
    this._moveDuration = 0;
    this._moveStartTime = 0;
    this._moving = false;
    // Sprites added as a child to the container
    this._faceSprite = new Sprite();
    this._poseSprite = new Sprite();
    this._container.addChild(this._poseSprite);
    this._container.addChild(this._faceSprite);
    // Running an initial update to set the pose and face to default values
    this.updateBust(pose, face);
}

Bust.prototype.moveBusts = function(x, y, duration = 3000) {
    this._startX = this._container.x;
    this._startY = this._container.y;
    this._targetX = x;
    this._targetY = y;
    this._moveDuration = duration; // To take as an arg
    this._moveStartTime = performance.now();
    this._moving = true;
}

Bust.prototype.updateBust = function(pose, face) {
    this._pose = pose;
    this._face = face;
    this._poseSprite.bitmap = ImageManager.loadPicture("busts/" + this._name + "/Pose/" + pose);
    this._faceSprite.bitmap = ImageManager.loadPicture("busts/" + this._name + "/Expression/" + face);
}

Bust.prototype.needsUpdate = function() {
    return this._container.x !== this._targetX || this._container.y !== this._targetY;
};


// ----------------------
//  Window_Message hooks
// ----------------------

const _Window_Message_terminateMessage = Window_Message.prototype.terminateMessage;
Window_Message.prototype.terminateMessage = function() {
    _Window_Message_terminateMessage.call(this);
    console.log("Hooked into Window_Message.terminateMessage!");
    for (const bust of Object.values(bustManager._busts)) {
        bust._container.visible = true;
        bust._faceSprite.tint = 0x888888;
        bust._poseSprite.tint = 0x888888;
    }
};


// ----------------------
//  Scene_Map hooks
// ----------------------

const _Scene_Map_update = Scene_Map.prototype.update;
Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    bustManager.update();
}


// ----------------------
// Game_Interpreter hooks
// ----------------------

const _Game_Interpreter_updateWaitMode = Game_Interpreter.prototype.updateWaitMode;
Game_Interpreter.prototype.updateWaitMode = function() {
    const wasWaitingForMessage = this._waitMode === "message";
    const waiting = _Game_Interpreter_updateWaitMode.call(this);

    if (wasWaitingForMessage && !waiting) {
        if (this.nextEventCode() === 0) {
            for (const bust of Object.values(bustManager._busts)) {
                bust._container.visible = false;
            }
        }
    }

    return waiting;
};


// ----------------------
// Plugin commands
// ----------------------

const setPresetPosition = function (pos_preset, x, y) {
    let final_x = 0, final_y = 0;
    if (pos_preset) {
        // todo later: implement preset positions
    } else {
        final_x = x;
        final_y = y;
    }
    return { x: final_x, y: final_y };
}

PluginManager.registerCommand(
    "BustImages",
    "showBusts",
    args => {
        console.log("showBusts command called with args:", args);
        const name = args.speaker_name;
        const pose = args.pose;
        const face = args.face;
        const pos_preset = Number(args.pos_preset);
        const { x, y } = setPresetPosition(pos_preset, Number(args.x), Number(args.y));
        bustManager.showBusts(name, pose, face, x, y);
        bustManager._busts[name]._container.visible = true;
        bustManager._busts[name].moveBusts(x, y);
    }
);

PluginManager.registerCommand(
    "BustImages",
    "moveBusts",
    args => {
        const name = args.speaker_name;
        const pos_preset = Number(args.pos_preset);
        const { x, y } = setPresetPosition(pos_preset, Number(args.x), Number(args.y));
        const duration = Number(args.duration) || 3000;
        if (bustManager._busts[name]) {
            bustManager._busts[name]._container.visible = true;
            bustManager._busts[name].moveBusts(x, y, duration);
        }
    }
)


// ----------------------
// Other hooks
// ----------------------

const bustManager = new BustManager();

// MISC STUFF
nw.Window.get().showDevTools();