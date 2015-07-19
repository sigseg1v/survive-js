"use strict";

// modified version of the Verlet integrator from PhysicsJS
// @licence MIT
function extend(physics) {
    physics.integrator('replay-verlet', function(parent) {
        physics.body.mixin({
            started: function (val) {
                if (val !== undefined){
                    this._started = true;
                }

                return !!this._started;
            }
        });

        /* jshint ignore:start */
        return {

            // extended
            init: function( options ){

                // call parent init
                parent.init.call(this, options);

                if (options) {
                    this._replayDelay = options.replayDelay !== undefined ? options.replayDelay : 0;
                }
            },

            replayDelay: function (val) {
                if (val !== undefined) {
                    this._replayDelay = Number(val);
                }
                return this._replayDelay;
            },

            // extended
            integrateVelocities: function( bodies, dt ){
                var futureState, oldState;
                var currentTime = Number(new Date());
                var replayTime = currentTime - this._replayDelay;
                var scratch = physics.scratchpad();
                var PHYSICS_SYNC_POSITION_ERROR = 0.007071067; // 1 / sqrt(100^2 + 100^2) -- see DynamicPhysicsSyncServer.PHYSICS_SYNC_POSITION_ERROR

                // half the timestep
                var dtdt = dt * dt
                    ,drag = 1 - this.options.drag
                    ,body = null
                    ,state
                    ,prevDt = this.prevDt || dt
                    ,dtMul = (dtdt + dt * prevDt) * 0.5
                    ,scratchVecA = scratch.vector()
                    ,scratchVecB = scratch.vector()
                    ;

                for ( var i = 0, l = bodies.length; i < l; ++i ){

                    body = bodies[ i ];
                    state = body.state;
                    if (body.integrationMode() === 'disabled') {
                        continue;
                    } else if (body.integrationMode() === 'future') {
                        futureState = body.getFutureReplayState(replayTime);
                        if (futureState) {
                            if (state.pos.dist(scratchVecA.clone(futureState.state.pos)) > PHYSICS_SYNC_POSITION_ERROR) {
                                if (futureState.previous) {
                                    state.vel.clone(futureState.state.pos).vsub(state.pos).normalize().mult(scratchVecB.clone(futureState.previous.state.vel).norm());
                                }
                            }

                            state.angular.pos = futureState.previous ? futureState.previous.state.angular.pos : state.vel.angle();
                            state.acc.zero();
                            state.angular.vel = 0;
                            body.clearOlderReplayStates(futureState);
                        } else {
                            // there were no future states, so just get the most recent
                            oldState = body.getMostRecentReplayState();
                            if (oldState) {
                                // state.pos.clone(oldState.state.pos);
                                state.vel.clone(oldState.state.vel);
                                state.angular.pos = oldState.state.angular.pos;
                                body.clearOlderReplayStates(oldState);
                            }
                            //state.vel.zero();
                            //state.acc.zero();
                            //state.angular.vel = 0;
                        }
                    } else {
                        if ( body.treatment !== 'static' && !body.sleep( dt ) ){

                            // Inspired from https://github.com/soulwire/Coffee-Physics
                            // @licence MIT
                            //
                            // v = x - ox
                            // x = x + (v + a * dt * dt)

                            // use the velocity in vel if the velocity has been changed manually
                            if (state.vel.equals( state.old.vel ) && body.started()){

                                // Get velocity by subtracting old position from curr position
                                state.vel.clone( state.pos ).vsub( state.old.pos );

                            } else {

                                state.old.pos.clone( state.pos ).vsub( state.vel );
                                // so we need to scale the value by dt so it
                                // complies with other integration methods
                                state.vel.mult( dt );
                            }

                            // Apply "air resistance".
                            if ( drag ){

                                state.vel.mult( drag );
                            }

                            // Apply acceleration
                            // v += a * dt * dt
                            state.vel.vadd( state.acc.mult( dtMul ) );

                            // restore velocity
                            state.vel.mult( 1/dt );

                            // store calculated velocity
                            state.old.vel.clone( state.vel );

                            // Reset accel
                            state.acc.zero();

                            //
                            // Angular components
                            //

                            if (state.angular.vel === state.old.angular.vel && body.started()){

                                state.angular.vel = (state.angular.pos - state.old.angular.pos);

                            } else {

                                state.old.angular.pos = state.angular.pos - state.angular.vel;
                                state.angular.vel *= dt;
                            }

                            state.angular.vel += state.angular.acc * dtMul;
                            state.angular.vel /= dt;
                            state.old.angular.vel = state.angular.vel;
                            state.angular.acc = 0;

                            body.started( true );

                        } else {
                            // set the velocity and acceleration to zero!
                            state.vel.zero();
                            state.acc.zero();
                            state.angular.vel = 0;
                            state.angular.acc = 0;
                        }
                    }
                }

                scratch.done();
            },

            // extended
            integratePositions: function( bodies, dt ){

                // half the timestep
                var dtdt = dt * dt
                    ,body = null
                    ,state
                    ,prevDt = this.prevDt || dt
                    ,dtcorr = dt/prevDt
                    ;

                for ( var i = 0, l = bodies.length; i < l; ++i ){

                    body = bodies[ i ];
                    state = body.state;

                    if (body.integrationMode() === 'disabled') {
                        continue;
                    }

                    // only integrate if the body isn't static
                    if ( body.treatment !== 'static' && !body.sleep() ){

                        // so we need to scale the value by dt so it
                        // complies with other integration methods
                        state.vel.mult( dt * dtcorr );

                        // Store old position.
                        // xold = x
                        state.old.pos.clone( state.pos );

                        state.pos.vadd( state.vel );

                        // restore velocity
                        state.vel.mult( 1 / (dt * dtcorr) );

                        // store calculated velocity
                        state.old.vel.clone( state.vel );

                        //
                        // Angular components
                        //


                        state.angular.vel *= dt * dtcorr;

                        state.old.angular.pos = state.angular.pos;

                        state.angular.pos += state.angular.vel;
                        state.angular.vel /= dt * dtcorr;
                        state.old.angular.vel = state.angular.vel;
                    }
                }

                this.prevDt = dt;
            }
        };
        /* jshint ignore:end */
    });
}

module.exports = {
    extend: extend
};
