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
 * - Hide Busts
 * - Change Busts Assets
 * 
 * For all commands, a "Speaker Name" is required and acts as a unique ID for characters. Poses and faces need to be included in img/pictures/busts/[speaker name] as a separate folder.
 * 
 * @version 0.3
 * @url https://github.com/dreais/BustImages
 *
 * @param poseFolder
 * @text Pose folder's name
 * @type string
 * @default Pose
 * 
 * @param expressionFolder
 * @text Expression folder's name
 * @type string
 * @default Expression
 * 
 * @param posPadding
 * @text Window padding used for busts (in %age)
 * @type number
 * @default 0%
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
 * @option -1
 * @value -1
 * @option 1
 * @value 0
 * @option 2
 * @value 25
 * @option 3
 * @value 50
 * @option 4
 * @value 75
 * @option 5
 * @value 100
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
 * @option -1
 * @value -1
 * @option 1
 * @value 0
 * @option 2
 * @value 25
 * @option 3
 * @value 50
 * @option 4
 * @value 75
 * @option 5
 * @value 100
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
 * @default 1000
 * @parent Transition Effects
 * 
 * @command hideBusts
 * @text Hide Busts
 * @desc Hides a bust
 * 
 * @arg speaker_name
 * @text Speaker Name (ID)
 * @desc The name of the speaker whose bust to move
 * @type string
 * 
 * @arg side
 * @text Fade-out side
 * @desc The side relative to the bust to fade-out to
 * @type select
 * @option Left
 * @value left
 * @option Right
 * @value right
 * @option Top
 * @value top
 * @option Bottom
 * @value bottom
 * 
 * @command changeBustsAssets
 * @text Change Busts Assets
 * @desc Changes a bust's pose and expression
 *
 * @arg speaker_name
 * @text Speaker Name (ID)
 * @desc The name of the speaker whose bust to change
 * @type string
 *
 * @arg pose
 * @desc The pose of the speaker's bust to display
 * @text Pose
 * @type string
 *
 * @arg face
 * @desc The expression of the speaker's bust to display
 * @text Face
 * @type string
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

function waitForBitmap(bitmap) {
    return new Promise(resolve => {
        const check = () => {
            if (bitmap.isReady()) {
                resolve(bitmap);
            } else {
                setTimeout(check, 10);
            }
        };

        check();
    });
}

const BustSide = Object.freeze({
    LEFT: "left",
    RIGHT: "right",
    TOP: "top",
    BOTTOM: "bottom"
});


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
    this._clearRequest = false;
};

BustManager.prototype.showBusts = function(name, pose, face) {
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
        this._busts[name] = new Bust(name, pose, face, 0, 0);
    } else {
        this._busts[name].updateAssets(pose, face);
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
        bust.update();
        if (!bust._moving && !bust._hiding && this._clearRequest)
            this.clear();
    }
}

BustManager.prototype.clear = function() {
    for (const bust of Object.values(this._busts)) {
        bust._container.visible = false;
    }
    this.container.removeChildren();
    this.container = null;
    this._busts = [];
    this._clearRequest = false;
    console.log("Clear");
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
    this.updateAssets(pose, face);
    // Related to bust fade-outs
    this._fadeDuration = 0;
    this._fadeStartTime = 0;
    this._hiding = false;
}

Bust.prototype.moveBusts = function(x, y, duration = 1000) {
    this._startX = this._container.x;
    this._startY = this._container.y;
    this._targetX = x;
    this._targetY = y;
    this._moveDuration = duration;
    this._moveStartTime = performance.now();
    this._moving = true;
}

Bust.prototype.updateAssets = function(pose, face) {
    this._pose = pose;
    this._face = face;
    this._poseSprite.bitmap = ImageManager.loadPicture("busts/" + this._name + "/" + params.poseFolder +"/" + pose);
    this._faceSprite.bitmap = ImageManager.loadPicture("busts/" + this._name + "/"+ params.expressionFolder + "/" + face);
}

Bust.prototype.updateMovement = function() {
    if (this._moving) {
        const elapsed = performance.now() - this._moveStartTime;
        const progress = Math.min(elapsed / this._moveDuration, 1);
        this._container.x += (this._targetX - this._container.x) * progress;
        this._container.y += (this._targetY - this._container.y) * progress;
        if (progress === 1) {
            this._moving = false;
            this._container.x = this._targetX;
            this._container.y = this._targetY;
        }
        this._container.x = Math.round(this._container.x);
        this._container.y = Math.round(this._container.y);
        return this._moving;
    }
    return this._moving;
};

Bust.prototype.resetTint = function() { 
    this._faceSprite.tint = 0xFFFFFF;
    this._poseSprite.tint = 0xFFFFFF;
}

Bust.prototype.darkenTint = function() { 
    // TODO change to an updateTint of some sort instead
    this._faceSprite.tint = 0x888888;
    this._poseSprite.tint = 0x888888;
}

Bust.prototype.hideBust = function(side, duration) {
    this.darkenTint();
    switch (side) {
        case BustSide.LEFT:
            this._targetX -= 150
            break;
        case BustSide.RIGHT:
            this._targetX += 150
            break;
        case BustSide.TOP:
            this._targetY -= 150
            break;
        case BustSide.BOTTOM:
            this._targetY += 150
            break;
        default:
            break;
    }
    const x = this._targetX;
    const y = this._targetY;
    this.moveBusts(x, y, duration);
    this._fadeDuration = duration;
    this._fadeStartTime = performance.now();
    this._hiding = true;
}

Bust.prototype.updateHiding = function() {
    if (this._hiding) {
        const elapsed = performance.now() - this._fadeStartTime;
        const progress = Math.min(elapsed / this._fadeDuration, 1);
        this._container.alpha -= this._container.alpha * progress;
        if (progress === 1) {
            this._container.alpha = 0;
            this._container.visible = false;
            this._hiding = false;
        }
        return this._hiding;
    }
    return this._hiding;
}

Bust.prototype.update = function() {
    if (this.updateMovement()) {
    }
    if (this.updateHiding()) {
    }
}


// ----------------------
//  Window_Message hooks
// ----------------------

const _Window_Message_startMessage = Window_Message.prototype.startMessage;
Window_Message.prototype.startMessage = function() {
    _Window_Message_startMessage.call(this);
    const speakerID = $gameMessage.speakerName();
    console.log(speakerID);
    for (const bust of Object.values(bustManager._busts)) {
        if (bust._name == speakerID) {
            bust.resetTint();
        } else {
            bust.darkenTint();
        }
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

const _Game_Interpreter_terminate = Game_Interpreter.prototype.terminate;
Game_Interpreter.prototype.terminate = function() {
    _Game_Interpreter_terminate.call(this);

    bustManager._clearRequest = true;
};


// ----------------------
// Plugin commands
// ----------------------

const setPresetPosition = function (pos_preset, x, y, bitmapWidth) {
    let final_x = 0, final_y = 0;
    const padding = Number(params.posPadding.replace("%", ""));
    const width = Graphics.width - (Graphics.width * (padding / 100));
    console.log(pos_preset);
    if (pos_preset) {
        final_x = (width - bitmapWidth) * (pos_preset / 100);
        final_y = 0;
    } else {
        final_x = x;
        final_y = y;
    }
    return { x: final_x, y: final_y };
}

PluginManager.registerCommand(
    "BustImages",
    "showBusts",
    async args => {
        console.log("showBusts command called with args:", args);
        const name = args.speaker_name;
        const pose = args.pose;
        const face = args.face;
        const pos_preset = Number(args.pos_preset);
        bustManager.showBusts(name, pose, face);
        bustManager._busts[name]._container.visible = true;
        await waitForBitmap(bustManager._busts[name]._faceSprite.bitmap);
        const { x, y } = setPresetPosition(pos_preset, Number(args.x), Number(args.y), bustManager._busts[name]._faceSprite.bitmap.width);
        bustManager._busts[name].moveBusts(x, y);
    }
);

PluginManager.registerCommand(
    "BustImages",
    "moveBusts",
    args => {
        const name = args.speaker_name;
        const pos_preset = Number(args.pos_preset);
        const { x, y } = setPresetPosition(pos_preset, Number(args.x), Number(args.y), bustManager._busts[name]._faceSprite.bitmap.width);
        const duration = Number(args.duration) || 1000;
        if (bustManager._busts[name]) {
            bustManager._busts[name]._container.visible = true;
            bustManager._busts[name].moveBusts(x, y, duration);
        }
    }
)

PluginManager.registerCommand(
    "BustImages",
    "hideBusts",
    args => {
        const name = args.speaker_name;
        const side = args.side;
        if (bustManager._busts[name]) {
            bustManager._busts[name].hideBust(side, 500);
        }
    }
)

PluginManager.registerCommand(
    "BustImages",
    "changeBustsAssets",
    args => {
        const name = args.speaker_name;
        const face = args.face;
        const pose = args.pose;
        if (bustManager._busts[name]) {
            bustManager._busts[name].updateAssets(pose, face)
        }
    }
)


// ----------------------
// Other hooks
// ----------------------

const params = PluginManager.parameters("BustImages");
const bustManager = new BustManager();

// MISC STUFF
nw.Window.get().showDevTools();


/*
* TODO LIST
* appearing side (could be left/side/top/bottom, mix maybe? with a mask?)
* error management
* going too fast between 2 events may makes a crash if clear() hasn't finished before the next one
*/