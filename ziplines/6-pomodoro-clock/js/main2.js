function what() {
    console.log(arguments);
}

var DurationModel = (function() {
    var proto = {
        increment: function inc() {
            this.len++;
        },
        decrement: function dec() {
            this.len--;
        }
    };
    function DurationModel(options) {
        //    var defaults = { min: len-2, max:len+10 };
        return $.extend(Object.create(proto), options);
    };
    return DurationModel;
}());

var app = {
    breakDuration: DurationModel({ len:5, min:3, max:15 }),
    sessionDuration: DurationModel({ len:25, min:10, max:59 }),
    session: { remaining:25 }
};

breakDuration = DurationComponent('.jw-break', {len:5});
breakDuration.getDuration();
breakDuration.on('change', session.duration.bind(session))

var DurationComponent = function(selector, options) {
    var model = DurationModel(options),
        view = DurationView(selector).render(model);

    return {
        model: model,
        view: view,
        getDuration: function() {
            return model.len;
        }
    };    
};

var DurationView = function(selector) {
    var $box = $(selector),
        $length = $box.find('.jw-length');

    return {
        render: function(model) {
            $length.text(model.len);
            return this;
        }
    };
};

DurationView('.jw-break').render(app.breakDuration);

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
        this.tick();
    },
    tick: function tick() {
        var self = this;
        if( this.isRunning ) {
            setTimeout(function() {
                if ( self.isRunning ) {
                    self.decrement();
                    self.$bus.trigger('tick', [self]);
                    self.tick();
                }
            }, 1000);
        }
    },
    stop: function() {
        this.isRunning = false;
    }
};

function createTimer(minutes) {
    var timer = Object.create(Timer);
    timer.setMinutes(minutes);
    return timer;
}

var $session = $('.jw-pomodoro');
function renderTimer(timer) {
    $session.text(timer.toString);
}

function setupSessionControl(selector) {
    var $box = $(selector),
        $remainingTime = $box.find('.jw-remaining-time'),
        remainingTime = parseInt($remainingTime.text(), 10),
        sessionOrBreak = 'session',
        timer = createTimer(25);

    timer.$bus.on('tick', function() {
        renderTimer(timer);
    });

    $box
        .click(function() {
            if ( sessionOrBreak==='session' ) {
                var length = parseInt($('.jw-session .jw-length').text(), 10);
            } else {
                var length = parseInt($('.jw-break .jw-length').text(), 10);
            }
            if ( timer.isRunning ) {
                timer.stop();
            } else {
                timer.setMinutes(length);
                timer.countDown();
            }
        });
}

setupLengthControls('.jw-length-control');
setupSessionControl($session);
