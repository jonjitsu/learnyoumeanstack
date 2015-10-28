
var what = function() { console.log.apply(console, arguments); },
    extend = _.extend,

    ObserverMixin = function(obj) {
        var observers = [],
            notify = function(data) {
                observers
                    .forEach(function(observer) {
                        observer(data);
                    });
            };

        extend(obj, {
            onNotify: function(observer) {
                observers.push(observer);
            },
            notify: notify
        });

        return obj;
    },

    Tokens = function() {
        var tokens = [];

        tokens.values = function() {
            return this.map(function(t) { return t.value; });
        };

        tokens.toString = function() {
            return this
                .values()
                .reduce(function(c, v) { return c+v; }, '');
        };

        return tokens;
    },

    Token = function(type, value) {
        return { type: type, value: value };
    },

    CalculatorInterpreter = function() {
        /**
         <expression> := <factor> [ ('+' | '-' ) <pexpr> ]
         <pexpr>      := ( <number> '%' ) | <expression>
         <factor>     := <number> [ ('*' | '/' ) <factor> ]
         <number>     := [0-9]+(\.[0-9]*)?
         **/

        var stack=[],
            TYPES = {
                NUMBER: /[0-9]+(\.[0-9]*)?/,
                OPERATOR: /[+-x÷]/,
                MULDIV: /[x÷]/,
                PLUSMINUS: /[+-]/
            },
            lastNumber = undefined,
            clone = Function.prototype.call.bind(Array.prototype.slice),
            look = function(matcher) {
                return matcher.test(stack[0]);
            },
            get = function(matcher) {
                if( matcher.test(stack[0]) ) return stack.shift();
                else throw new Error('Expected number and got: ' + stack[0]);
            },
            number = function() {
                var v = get(TYPES.NUMBER);
                v = v.indexOf('.')<0 ? parseInt(v, 10) : parseFloat(v);
                lastNumber = v;
                return v;
            },
            factor = function() {
                var result = number(),
                    op, n;
                while( look(TYPES.MULDIV) ) {
                    op = get(TYPES.OPERATOR);
                    n = number();

                    if( op==='x' ) result = result * n;
                    else result = result / n;
                }
                return result;
            },
            ispexpr = function () {
                return TYPES.NUMBER.test(stack[0]) && stack[1]==='%';
            },
            pexpr = function () {
                if( ispexpr() ) {
                    if ( lastNumber===undefined ) throw new Error('A percent expression needs a previous number.');

                    var v = lastNumber,
                        n = number();

                    n = n / 100;
                    return v * n;
                } else {
                    return expression();
                }
            },
            expression = function expression() {
                var result = factor(),
                    op, n;
                while( look(TYPES.PLUSMINUS) ) {
                    op = get(TYPES.PLUSMINUS);
                    n = pexpr();

                    if( op==='+' ) result = result + n;
                    else result = result - n;
                }
                return result;
            },

            /**
             WARNING: NOT A PROPER LEXER, FOR DEBUGGING USE ONLY
             **/
            fromString = function(s) {
                return s.split('')
                    .reduce(function(c, v) {
                        if ( c.length===0 ) return [ v ];
                        var last = c.pop();
                        if ( TYPES.NUMBER.test(v) ) {
                            if( TYPES.NUMBER.test(last) ) {
                                c.push(last+v);
                                return c;
                            }
                        }
                        c.push(last);
                        c.push(v);
                        return c;
                    }, []);
            };

        
        return {
            evaluate: function(s) {
                if ( typeof s === 'string' ) stack = fromString(s);
                else stack = clone(s);

                console.log(stack);

                return expression();
            }           
        };
    },

    CalculatorViewModel = function(interpreter) {
        interpreter = interpreter || CalculatorInterpreter();

        var result = 0,
            state = undefined,
            tokens = Tokens(),
            TYPES = {
                VOID: -1,
                VALUE: 0,
                OPERATION: 1,
                SPECIAL: 2,
                UNIOP: 3
            },

            Rule = function(type, matcher) {
                return { type: type, matcher: matcher };
            },

            RULES = [
                Rule(TYPES.VALUE, function(value) { return /[.0-9]/.test(value); }),
                Rule(TYPES.OPERATION, function(value) { return /[+\-x÷=]/.test(value); }),
                Rule(TYPES.UNIOP, function(value) { return /[%]/.test(value); }),
                Rule(TYPES.SPECIAL, function(value) { return /ac|ce/i.test(value); })
            ],

            parseRule = function(value) {
                return _.find(RULES, function(rule) {
                    return rule.matcher(value);
                });
            },

            parseType = function(value) {
                var rule = parseRule(value);
                return rule===undefined ? undefined : rule.type;
            },

            collect = function(tok) {
                if( state===undefined ) state = tok;
                else {
                    if( tok.value==='.' ) {
                        if ( state.value.indexOf('.') >=0 ) return;
                    }
                    state.value=state.value+tok.value;
                }
            },
            canOperate = function() {
                if( lookBehind().type===TYPES.UNIOP ) return true;
                if( state===undefined ) return false;
                return tokens.length===0 || tokens[tokens.length-1].type===TYPES.OPERATION;
            },
            handleOperation = function(tok) {
                if( !canOperate() ) return;
                tokens.push(state);
                state = undefined;

                if( tok.value==='=' ) {
                    result = interpreter.evaluate(tokens.values());
                    console.log(tokens.toString(), '=', result);
                    tokens = Tokens();
                } else {
                    tokens.push(tok);
                }
            },
            handleSpecial = function(tok) {
                var value = tok.value;
                switch(value.toLowerCase()) {
                case 'ce': tokens = Tokens();
                case 'ac':
                    result = 0;
                    state = undefined;
                }
            },

            lookBehind = function() {
                return tokens.length>0 ? tokens[tokens.length-1] : Token(TYPES.VOID);
            },

            handleUniOperation = function(tok) {
                if( state===undefined ) return;
                if( lookBehind().type!==TYPES.OPERATION ) return;

                tokens.push(state);
                tokens.push(tok);
            },

            CVM = {
                read: function(value) {
                    var type = parseType(value),
                        tok = Token(type, value);

                    try {
                        switch(type) {
                        case TYPES.VALUE:
                            collect(tok);
                            this.notify(tokens.toString() + state.value);
                            break;
                        case TYPES.OPERATION:
                            handleOperation(tok);
                            if( value==='=' ) this.notify(result);
                            else this.notify(tokens.toString());
                            break;
                        case TYPES.UNIOP:
                            handleUniOperation(tok);
                            if( tokens.length>0 ) this.notify(tokens.toString());
                            break;
                        case TYPES.SPECIAL:
                            handleSpecial(tok);
                            this.notify(result);
                            break;
                        default: console.log('SNBH: Invalid value!');
                        }
                    } catch(e) { console.log(e); }
                },
                toJSON: function() {
                    return JSON.stringify({
                        result: result,
                        state: state,
                        tokens: tokens
                    });
                }
            };

        ObserverMixin(CVM);

        return CVM;
    },

    /**
     Handles calculator view. Responsible for ui events and updating the display.
     @param {string|jquery object}   html container for the calculator
     @param [ViewModel]              optional viewmodel
     **/
    CalculatorView = function(selector, viewModel) {
        viewModel = viewModel || CalculatorViewModel();

        var $box = $(selector),
            $display = $box.find('.jsc-display'),
            $btns = $box.find('.jsc-btn');

        viewModel.onNotify( function(value) {
            $display.text(value);
        });
        $btns
            .on('click', function() {
                viewModel.read(this.value);
            });
    },



    ci = CalculatorInterpreter(),
    cvm = CalculatorViewModel(ci),
    cv = CalculatorView('.jsc-calculator', cvm),
    r = function(c) {
        cvm.read(c);
        console.log(cvm.toJSON()); 
    };
