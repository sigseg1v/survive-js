//var core = require('../core');
var core = require('pixi.js');

/**
 * A MultiMovieClip can store multiple animations and play them back by name.
 *
 * @class
 * @extends PIXI.Sprite
 * @memberof PIXI.extras
 *
 * @param clips {Object} an object where the keys are clip names and the values are arrays of textures
 */
function MultiMovieClip(clips)
{
    core.Sprite.call(this);

    /**
     * @private
     */
    this._clips = clips;

    /**
     * The name of the currently selected clip.
     *
     * @member {string}
     * @default null
     */
    this.clip = null;

    /**
     * The speed that the MultiMovieClip will play at. Higher is faster, lower is slower
     *
     * @member {number}
     * @default 1
     */
    this.animationSpeed = 1;

    /**
     * Whether or not the movie clip repeats the current clip after playing.
     *
     * @member {boolean}
     * @default true
     */
    this.loop = true;

    /**
     * Function to call when a MultiMovieClip finishes playing
     *
     * @method
     * @memberof MultiMovieClip#
     */
    this.onComplete = null;

    /**
     * Elapsed time since animation has been started, used internally to display current texture
     *
     * @member {number}
     * @private
     */
    this._currentTime = 0;

    /**
     * Indicates if the MultiMovieClip is currently playing
     *
     * @member {boolean}
     * @readonly
     */
    this.playing = false;
}

// constructor
MultiMovieClip.prototype = Object.create(core.Sprite.prototype);
MultiMovieClip.prototype.constructor = MultiMovieClip;
module.exports = MultiMovieClip;

/**
 * Stops the MultiMovieClip
 *
 */
MultiMovieClip.prototype.stop = function ()
{
    if(!this.playing)
    {
        return;
    }

    this.playing = false;
    core.ticker.shared.remove(this.update, this);
};

/**
 * Plays the MultiMovieClip
 *
 * @param clip {string} the name of the clip to play, otherwise will play the current clip
 */
MultiMovieClip.prototype.play = function (clip)
{
    if(this.playing && (!clip ||this.clip == clip))
    {
        return;
    }

    this.playing = true;
    if (clip) {
        this.clip = clip;
    }
    core.ticker.shared.add(this.update, this);
};

/**
 * Stops the MultiMovieClip and goes to a specific frame
 *
 * @param frameNumber {number} frame index to stop at
 */
MultiMovieClip.prototype.gotoAndStop = function (frameNumber)
{
    this.stop();

    this._currentTime = frameNumber;

    var round = Math.floor(this._currentTime);
    var clip = this._clips[this.clip];
    this._texture = clip[round % clip.length];
};

/**
 * Goes to a specific frame and begins playing the MultiMovieClip
 *
 * @param frameNumber {number} frame index to start at
 */
MultiMovieClip.prototype.gotoAndPlay = function (frameNumber)
{
    this._currentTime = frameNumber;
    this.play();
};

/*
 * Updates the object transform for rendering
 * @private
 */
MultiMovieClip.prototype.update = function (deltaTime)
{

    this._currentTime += this.animationSpeed * deltaTime;

    var floor = Math.floor(this._currentTime);
    var clip = this._clips[this.clip];

    if (!clip || clip.length === 0) {
        return;
    }

    if (floor < 0)
    {
        if (this.loop)
        {
            this._texture = clip[clip.length - 1 + floor % clip.length];
        }
        else
        {
            this.gotoAndStop(0);

            if (this.onComplete)
            {
                this.onComplete();
            }
        }
    }
    else if (this.loop || floor < clip.length)
    {
        this._texture = clip[floor % clip.length];
    }
    else if (floor >= clip.length)
    {
        this.gotoAndStop(clip.length - 1);

        if (this.onComplete)
        {
            this.onComplete();
        }
    }
};

/*
 * Stops the MultiMovieClip and destroys it
 *
 */
MultiMovieClip.prototype.destroy = function ( )
{
    this.stop();
    core.Sprite.prototype.destroy.call(this);
};

/**
 * Adds an array of textures to the clip, accessible by the provided clipName.
 *
 * @param clipName {string} the name you want to give the clip
 * @param textures {Texture[]} the textures to use for the clip
 */
MultiMovieClip.prototype.addClip = function (clipName, textures)
{
    this._clips[clipName] = textures;
};
