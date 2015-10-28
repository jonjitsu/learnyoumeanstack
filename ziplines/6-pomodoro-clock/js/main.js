function what() {
    console.log(arguments);
}

function setupLengthControl(element) {
    var $box = $(element),
        $timeLength = $box.find('.jw-length'),
        min = $box.data('jw-min'),
        max = $box.data('jw-max'),
        timeLength = parseInt($timeLength.text(), 10);

    $box
        .find('.jw-decrease')
        .click(function() {
            if( timeLength>min ) {
                timeLength--;
                $timeLength.text(timeLength);
            }
        });
    $box
        .find('.jw-increase')
        .click(function() {
            if( timeLength<max ) {
                timeLength++;
                $timeLength.text(timeLength);
            }
        });
}

function setupLengthControls(selector) {
    $(selector)
        .each(function(i, element) {
            setupLengthControl(element);            
        });
}
function fixed(num) {
    return ("0" + num.toString()).slice(-2);
}
var Timer = {
    isRunning: false,
    remaining: 25*60,
    $bus: $({}),
    setMinutes: function(mins) {
        this.remaining = mins * 60;
    },
    toString: function() {
        var minutes = Math.floor(this.remaining/60),
            seconds = this.remaining%60;
        return minutes + ':' + fixed(seconds);        
    },
    decrement: function() {
        if( this.remaining>0 ) this.remaining--;
    },
    countDown: function() {
        this.isRunning = true;
        this.start = this.remaining;
        this.tick();
    },
    percentDone: function() {
        if( this.isRunning && typeof this.start === 'number' ) {
            return (this.start-this.remaining)/this.start;
        }
        return 0;
    },
    tick: function tick() {
        var self = this;
        if( this.isRunning ) {
            this._timer = setTimeout(function() {
                if ( self.isRunning ) {
                    self.decrement();
                    if ( self.remaining===0 ) {
                        self.isRunning = false;
                        self.$bus.trigger('done', [self]);
                    } else {
                        self.$bus.trigger('tick', [self]);
                        self.tick();
                    }
                }
            }, 1000);
        }
    },
    stop: function() {
        this.isRunning = false;
        clearTimeout(this._timer);
    }
};

function createTimer(minutes) {
    var timer = Object.create(Timer);
    timer.setMinutes(minutes);
    return timer;
}

function jqueryEventWrap(fn) {
    return function() {
        var args = [].slice.call(arguments, 0);
        //Toss event name
        args.shift();
        fn.apply(this, args);
    };
}

var RadialProgress = (function() {
    var circ = Math.PI * 2,
        quart = Math.PI / 2;

    return {
        init: function(cnvs) {
            this.range = 0;
            this.bg = cnvs;
            var ctx = this.ctx = cnvs.getContext('2d');

            ctx.beginPath();
            ctx.strokeStyle = '#99CC33';
            ctx.lineCap = 'square';
            ctx.closePath();
            ctx.fill();
            ctx.lineWidth = 10.0;
            this.imd = ctx.getImageData(0,0, 180, 180);
        },
        draw: function(percent) {
            this.ctx.putImageData(this.imd, 0, 0);
            this.ctx.beginPath();
            this.ctx.arc(90, 90, 85, -(quart), ((circ) * percent) - quart, false);
            this.ctx.stroke();
        }
    };
   
}());

function setupSessionControl(selector) {
    var $box = $(selector),
        $remainingTime = $box.find('.jw-remaining-time'),
        remainingTime = parseInt($remainingTime.text(), 10),
        $sessionType = $box.find('.jw-session-type'),
        sessionType = 'work',
        timer = createTimer(25),
        renderTimer = function(timer) {
            $remainingTime.text(timer.toString());
        },
        switchSession = function() {
            $box.toggleClass('jw-break-session');
            sessionType = sessionType==='work' ? 'break' : 'work';
        },
        renderSession = function() {
            var length;
            $sessionType.text(sessionType.toUpperCase());
            if ( sessionType==='work' ) {
                length = parseInt($('.jw-session .jw-length').text(), 10);
            } else {
                length = parseInt($('.jw-break .jw-length').text(), 10);
            }

            timer.setMinutes(length);
            renderTimer(timer);
            timer.countDown();
        };

        RadialProgress.init($('.jw-radial-progress')[0]);


    timer.$bus.on('tick', function(ev, timer) {
        renderTimer(timer);
        RadialProgress.draw(timer.percentDone());
    });
    timer.$bus.on('done', function(timer) {
        switchSession();
        renderSession();
    });

    $box
        .click(function() {
            if ( timer.isRunning ) {
                timer.stop();
            } else {
                renderSession();
            }
        });
}

setupLengthControls('.jw-length-control');
setupSessionControl('.jw-pomodoro');
