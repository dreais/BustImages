/*:
 * @target MZ
 * @plugindesc Bust Images
 *
 * @command showBusts
 * @text Show Busts
 * @desc Shows a bust
 * 
 * @arg speaker_name
 * @text Speaker Name
 * @desc The name of the speaker whose bust to show
 * @type string
 * 
 * @arg pose
 * @desc The pose of the speaker's bust to show
 * @text Pose
 * @type string
 * 
 * @arg face
 * @desc The face of the speaker's bust to show
 * @text Face
 * @type string
 * 
 * @arg x
 * @desc The x position of the bust
 * @text X Position
 * @type number
 * @default 0
 * 
 * @arg y
 * @desc The y position of the bust
 * @text Y Position
 * @type number
 * @default 0
 */


console.log("BustImages plugin loaded!");

createEmptySprite = function(x, y, filename) {
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
            bust._container.x += (bust._targetX - bust._container.x) * 0.2;
            bust._container.y += (bust._targetY - bust._container.y) * 0.2;

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
    this._container = new PIXI.Container();
    this._container.x = x;
    this._container.y = y;
    this._name = name;
    this._targetX = x;
    this._targetY = y;
    this._faceSprite = new Sprite();
    this._poseSprite = new Sprite();
    this._container.addChild(this._poseSprite);
    this._container.addChild(this._faceSprite);
    this.updateBust(pose, face);
}

Bust.prototype.moveTo = function(x, y) {
    this._targetX = x;
    this._targetY = y;
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

PluginManager.registerCommand(
    "BustImages",
    "showBusts",
    args => {
        console.log("showBusts command called with args:", args);
        const name = args.speaker_name;
        const pose = args.pose;
        const face = args.face;
        const x = Number(args.x);
        const y = Number(args.y);
        bustManager.showBusts(name, pose, face, x, y);
        bustManager._busts[name]._container.visible = true;
        bustManager._busts[name].moveTo(x, y);
    }
);


// ----------------------
// Other hooks
// ----------------------

const bustManager = new BustManager();

// MISC STUFF
nw.Window.get().showDevTools();