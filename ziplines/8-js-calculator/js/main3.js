
function r(value) {
    sm.read(value);
    console.log(sm.currentValue, sm.stack);
}

var TYPES = {
    VALUE: 0,
    OPERATION: 1,
    SPECIAL: 2
};


function newRule(type, matcher) {
    return {
        type: type,
        matcher: matcher
    };
}

var sm = {
    currentValue: '',
    stack: [],
    read: function(value) {
        var type = this.parseType(value);

        if ( type===TYPES.VALUE ) {
            this.collectValue(value);
        } else if ( type===TYPES.OPERATION ) {
            this.handleOperation(value, type);
        } else if ( type===TYPES.SPECIAL ) {
            this.handleSpecial(value, type);
        }
    },
    collectValue: function(value) {
        this.currentValue+=value;
    },
    handleOperation: function(value, type) {
        if( this.currentValue.length>0 ) {
            this.stack.push([this.currentValue, type]);
            this.currentValue = '';
        }
    },
    parseRule: function(value) {
        var rules = [
            newRule(TYPES.VALUE, function(value) { return /[.0-9]/.test(value); }),
            newRule(TYPES.OPERATION, function(value) { return /[+-/*]/.test(value); }),
            newRule(TYPES.SPECIAL, function(value) { return /ac|ce/i.test(value); })
        ];

        return _.find(rules, function(rule) {
            return rule.matcher(value);
        });
    },
    parseType: function(value) {
        var rule = this.parseRule(value);
        return rule===undefined ? undefined : rule.type;
    },
    handleSpecial: function(value, type) {
        switch(value.toLowerCase()) {
          case 'ce': this.stack = [];
          case 'ac': this.currentValue = '';
        }
    }
};

//$('.jsc-btn')
//    .on('click', function(ev) {
//        stateMachine.read(ev.currentTarget.value);
//    });
