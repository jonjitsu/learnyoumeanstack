

var types = {
    
};

function btn(value, type) {
    type = type || TYPES.VALUE;
    return  {
        type: type,
        value: value
    };
}

var calc = [
    [ btn('1'), btn('2'), btn('3'), btn('/', TYPES.OPERATION) ],
    [ btn('7'), btn('8'), btn('9'), btn('x', TYPES.OPERATION) ],
    [ btn('4'), btn('5'), btn('6'), btn('-', TYPES.OPERATION) ],
    [ btn('1'), btn('2'), btn('3'), btn('+', TYPES.OPERATION) ],
    [ btn('1'), btn('2'), btn('3') ],
];

// implements floats
var simple_interpreter = {
    
};

var calculator = {
    init: function(model, interpreter) {
        this._model = model;
        this._interpreter = interpreter;
    },
    render: function(whereSelector) {
        var $box = $(whereSelector);

        $box.html(html);
        this.bindEvents($box);
    },
    bindEvents: function($box) {
        $box
            .find('.jsc-btn')
            .click(this.interpreter.char.bind(this.interpreter));
    }
};

calculator.init(calculatorDefinition, calculatorInterpreter)
calculator.render('.where')
