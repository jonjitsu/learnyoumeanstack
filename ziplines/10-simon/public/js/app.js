'use strict';
/* eslint-disable no-undef, no-console, no-unused-vars */

var l = console.log.bind(console),
    COLORS = { green:0, red:1, yellow:2, blue:3 },
    toArray = Function.prototype.call.bind(Array.prototype.slice),
    s, e,
    colorsAsArray = function() {
        var a = [];

        for(var c in COLORS) {
            var i = COLORS[c];
            a[i]=c;
        }
        return a;
    },
    colorIndexToColor = function(index) {
        return colorsAsArray()[index];
    },
    logSequence = function(seq) {
        l(seq.map(colorIndexToColor));
    }
;

angular
    .module('simonApp', [])
    .constant('COLORS', COLORS)
    .factory('ToneService', [ToneService])
    .factory('SoundSystem', ['ToneService', SoundSystem])
    .factory('SequenceFactory', SequenceFactory)
    .factory('Bus', GameBus)
    .factory('IdleTimer', IdleTimer)
    .controller('GameCtrl', ['$scope', '$element', 'SoundSystem', 'SequenceFactory', 'Bus', 'IdleTimer', GameCtrl])
    .directive('coloredButton', ['COLORS', ColoredButtonDirective]);

function IdleTimer() {
    var DEFAULT_TIMEOUT = 1000,
        go = function(ms) {
            if( ms!==undefined ) this._ms = ms;
            this._id = setTimeout(this._fn, this._ms);
        },
        stop = function() {
            clearTimeout(this._id);
        },
        resetTime = function() {
            this.stop();
            this.go();
        },
        factory = function(fn, ms) {
            ms = ms || DEFAULT_TIMEOUT;
            return {
                _ms: ms, _fn: fn, _id: undefined,
                go: go, stop: stop, resetTime: resetTime
            };
        };
    return factory;
}

function ColoredButtonDirective(COLORS) {
    return {
        restrict: 'E',
        replace: true,
        scope: true,
        template: '<div class="sm-btn"><button ng-mousedown="buttonDown()" ng-mouseup="buttonUp()"  class="sm-btn"></button></div>',
        link: function(scope, element, attrs) {
            // l(element, attrs.color);
            var color = scope.color = attrs.color,
                colorIndex = scope.colorIndex = COLORS[color];

            element.addClass('sm-' + color);
        },
        controller: ['$scope', 'SoundSystem', '$element', 'Bus', '$attrs', function($scope, SS, $element, Bus, $attrs) {
            var vm = $scope,
                color = $attrs.color,
                colorIndex = COLORS[color],
                isEnabled = false,

                whileEnabled = function(fn) {
                    return function() {
                        if( isEnabled ) fn.apply(this, arguments);
                    };
                },

                activate = function() {
                    SS.start(colorIndex);
                    $element.addClass('sm-active');
                },
                deactivate = function() {
                    SS.stop(colorIndex);
                    $element.removeClass('sm-active');
                };

            vm.buttonDown = whileEnabled(activate);
            vm.buttonUp = whileEnabled(function() {
                deactivate();
                vm.buttonPress(colorIndex);
            });
            Bus.on('btn' + colorIndex + 'press', activate);
            Bus.on('btn' + colorIndex + 'release', deactivate);
            Bus.on('btns:disable', function() { isEnabled = false; });
            Bus.on('btns:enable', function() { isEnabled = true; });
        }]
    };
}

function GameCtrl($scope, $element, SoundSystem, sequence, Bus, IdleTimer) {
    var vm = $scope,

        element = $element[0],
        expected,
        wrong = function(fn) {
            Bus.fire('btns:disable');
            SoundSystem.youLose(function() {
                Bus.fire('btns:enable');
                fn();
            });
        },
        failed = function() {
            if( vm.isStrict ) wrong(startOver);
            else rerender();
        },
        rerender = function() {
            expected = sequence.copy();
            wrong(render.bind(null, expected));
        },

        responseTimeout = 5000,
        moveDelay = 700,
        soundLength = 300,
        responseTimer = IdleTimer(failed, responseTimeout),
        isRendering = false,
        render = function(seq, onDone) {
            logSequence(seq);
            responseTimer.stop();
            seq = seq.slice();
            if( isRendering ) return;
            isRendering=true;
            Bus.fire('btns:disable');

            var next = seq.shift(),
                id
            ;
            if( next===undefined ) return;

            Bus.fire('btn' + next + 'press');
            id = setInterval(function() {
                Bus.fire('btn' + next + 'release');
                next = seq.shift();
                if( next===undefined ) {
                    clearInterval(id);
                    isRendering = false;
                    Bus.fire('btns:enable');
                    responseTimer.go();
                    if( typeof onDone==='function' ) onDone();
                    return;
                }

                setTimeout(function() {
                    Bus.fire('btn' + next + 'press');
                }, soundLength);
            }, moveDelay)
        },
        verifyPresses = function(presses) {
            for(var i=0; i<presses.length; i++) {
                if( presses[i]!==sequence.current[i]) return false;
            }
            return true;
        },
        startOver = function() {
            responseTimeout = 5000;
            moveDelay = 700;
            soundLength = 300;
            responseTimer = IdleTimer(failed, responseTimeout);
            vm.round=1;
            vm.$apply();
            responseTimer.stop();
            expected = sequence.init();
            render(expected);
        },
        adjustSpeed = function() {
            //5, 9, 13
            if( vm.round>12 ) {
                moveDelay=300;
                soundLength=150;
            } else if( vm.round>8 ) {
                moveDelay=400;
                soundLength=200;
            } else if( vm.round>4 ) {
                moveDelay=500;
                soundLength=250;
            }
        },
        youWin = function() {
            moveDelay = 100;
            soundLength = 100;
            
            render([0,1,3,2,0,1,3,2,0,1,3,2,0,1,3,2,0,1,3,2,0,1,3,2,], startOver);
        },
        nextRound = function() {
            vm.round++;
            vm.$apply();
            adjustSpeed();
            responseTimer.stop();
            expected = sequence.next();
            render(expected);
        },
        whileNotRendering = function(fn) {
            return function() {
                if( isRendering ) return;
                return fn.apply(this, arguments);
            };
        }
    ;


    vm.buttonPress = whileNotRendering(function(index) {
        responseTimer.resetTime();
        setTimeout(function() {
            if( expected.shift()===index ) {
                if( expected.length===0 ) {
                    if( vm.round===2 ) {
                        youWin();
                    } else {
                        nextRound();
                    }
                }
            } else {
                failed();
            }
        }, 700);
    });

    vm.isOn = false;
    vm.onOff = whileNotRendering(function() {
        vm.isOn = !vm.isOn;
        responseTimer.stop();
        if( !vm.isOn ) {
            vm.isStarted = false;
            Bus.fire('btns:disable');
        }
    });
    vm.isStarted = false;
    vm.start = whileNotRendering(function() {
        if( vm.isOn ) {
            vm.isStarted = true;
            // startOver();
            setTimeout(startOver, 100);
        }
    });
    vm.isStrict = false;
    vm.strict = whileNotRendering(function() {
        if( vm.isOn ) {
            vm.isStrict = !vm.isStrict;
        }
    });

        // startOver();
}

function GameBus() {
    var events = {};
    return {
        _events: events,
        on: function(eventName, fn) {
            if( !(eventName in events) ) events[eventName] = [];
            events[eventName].push(fn);
        },
        fire: function() {
            var args = [].slice.call(arguments),
                eventName = args.shift(),
                fns = events[eventName]
            ;
            if( fns ) {
                fns.forEach(function(fn) {
                    fn.apply(null, args);
                });
            }
        }
    }
}
function SequenceFactory() {
    var randomInt = function(min, max) {
        if( max===undefined ) {
            max=min;
            min=0;
        }
        return (Math.round(Math.random() * (max-min)) + min)
    };

    return {
        current: [],
        next: function() {
            this.current.push(randomInt(0, 3));
            return this.current.slice();
        },
        init: function() {
            this.current = [];
            this.next();
            return this.current.slice();
        },
        copy: function() {
            return this.current.slice();
        }
    };
}

function SoundSystem(Tone) {
    // + losing razz of 42hz
    var frequencies = [ 415, 310, 252, 209 ],
        frequenciesWiki = [ 164, 440, 277, 329 ],
        tones = frequencies.map(Tone.generate.bind(Tone)),
        tones2 = frequenciesWiki.map(Tone.generate.bind(Tone));

    return {
        start: function(index) {
            tones[index].start();
        },
        stop: function(index) {
            tones[index].stop();
        },
        play: function(index, ms) {
            tones[index].play(ms);
        },
        youLose: function(fn) {
            var tone = Tone.generate(70);

            tone.start();
            setTimeout(function() {
                tone.stop();
                fn();
            }, 1000);
        },
        youWin: function() {
            
        },
        volume: function(index, lvl) {
            tones[index].volume(lvl);
        }
    };
}

function ToneService() {
    var Tone = {
        getAudioContext: function() {
            if( this._ac===undefined ) {
                this._ac = new AudioContext();
            }
            return this._ac;
        },
        generate: function(hz) {
            var ac = this.getAudioContext(),
                os = ac.createOscillator(),
                gn = ac.createGain()
            ;
            os.type = 'square';
            os.frequency.value = hz;
            os.start(0);

            gn.gain.value = 0.15;
//            os.connect(gn);
            return {
                _ac: ac, _os: os, _gn: gn,
                start: function() {
                   // os.connect(ac.destination);
                    os.connect(gn);
                    gn.connect(ac.destination);
                },
                stop: function() {
                    os.disconnect();
                },
                play: function(ms) {
                    ms = ms || 300;
                    this.start();
                    setTimeout(function() {
                        this.stop();
                    }.bind(this), ms);
                },
                // float: 0 - 1
                volume: function(lvl) {
                    this._gn.gain.value = lvl;
                }
            }
        }
    };
    return Tone;
}
