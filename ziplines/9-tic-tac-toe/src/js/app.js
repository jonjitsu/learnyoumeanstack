'use strict';

var d = console.log.bind(console) // eslint-disable-line no-undef, no-console
;


// @TODO Try out magic square method of checking if puzzle is solved
var EMPTY_CELL_VALUE = null,
    BOARD_SIZE = 3,
    cell = function(value, isWinner) {
        return {
            value: value || EMPTY_CELL_VALUE,
            isWinner: isWinner || false,
            reset: function() {
                this.value = value || EMPTY_CELL_VALUE;
                this.isWinner = isWinner || false;
            }
        };
    },
    checkForWin = function(state, size) { //eslint-disable-line no-unused-vars
        var generateWinLocations = function(size) {
            var cellNumber = function(row, col) {
                return row * size + col;
            },
                horizontal = function(size) {
                    var cellGroups = [],
                        aGroup, c, r;
                    for (r = 0; r < size; r++) {
                        aGroup = [];
                        for (c = 0; c < size; c++) {
                            aGroup.push(cellNumber(r, c));
                        }
                        cellGroups.push(aGroup);
                    }
                    return cellGroups;
                },
                vertical = function(size) {
                    var cellGroups = [],
                        aGroup, r, c;
                    for (r = 0; r < size; r++) {
                        aGroup = [];
                        for (c = 0; c < size; c++) {
                            aGroup.push(cellNumber(r, c));
                        }
                        cellGroups.push(aGroup);
                    }
                    return cellGroups;
                },
                diagonal = function(size) {
                    var cellGroups = [],
                        diagonal1 = [],
                        diagonal2 = [],
                        r = 0,
                        c = 0;

                    do {
                        diagonal1.push(cellNumber(r, c));
                        diagonal2.push(cellNumber(size - r, c));
                        c++;
                        r++;
                    } while (c < size);
                    return cellGroups;
                };
            return horizontal(size)
                .concat(vertical(size))
                .concat(diagonal(size));
        };
        return generateWinLocations(size);
    },
    // Cell[]* -> Winner | false
    // Checks board state and returns the winner or false
    checkForWinBruteForce = function(state) {
        var checkHorizontal = function() {
            var y, x,
                expected,
                winningLine;
            for (y = 0; y < state.length; y++) {
                expected = state[y][0].value;
                if (expected === EMPTY_CELL_VALUE) continue;
                winningLine = [
                    [y, 0]
                ];
                for (x = 1; x < state[y].length; x++) {
                    if (state[y][x].value !== expected) {
                        winningLine = null;
                        break;
                    } else {
                        winningLine.push([y, x]);
                    }
                }
                if (winningLine !== null) {
                    return {
                        winner: expected,
                        line: winningLine
                    };
                }
            }
            return false;
        },
            checkVertical = function() {
                var y, x,
                    expected,
                    winningLine;
                for (x = 0; x < state[0].length; x++) {
                    expected = state[0][x].value;
                    if (expected === EMPTY_CELL_VALUE) continue;
                    winningLine = [
                        [0, x]
                    ];
                    for (y = 1; y < state.length; y++) {
                        if (state[y][x].value !== expected) {
                            winningLine = null;
                            break;
                        } else winningLine.push([y, x]);
                    }
                    if (winningLine !== null) {
                        return {
                            winner: expected,
                            line: winningLine
                        };
                    }
                }
                return false;
            },
            checkDiagonal = function() {
                var y = 1,
                    x = 1,
                    expected = state[0][0].value,
                    winningLine;

                if (expected !== EMPTY_CELL_VALUE) {
                    winningLine = [
                        [0, 0]
                    ];
                    while (y < state.length && x < state[y].length) {
                        if (expected !== state[y][x].value) {
                            winningLine = null;
                            break;
                        } else winningLine.push([y, x]);
                        x++;
                        y++;
                    }
                    if (winningLine !== null) {
                        return {
                            winner: expected,
                            line: winningLine
                        };
                    }
                }

                x = 1, y = state.length - 1;
                expected = state[y][0].value;
                winningLine = [
                    [y, 0]
                ];
                y--;
                if (expected !== EMPTY_CELL_VALUE) {
                    while (y >= 0 && x < state[y].length) {
                        if (expected !== state[y][x].value) {
                            winningLine = null;
                            break;
                        } else winningLine.push([y, x]);
                        x++;
                        y--;
                    }
                    if (winningLine !== null) {
                        return {
                            winner: expected,
                            line: winningLine
                        };
                    }
                }
                return false;
            },
            winner = false;

        if ((winner = checkHorizontal()) || (winner = checkVertical()) || (winner = checkDiagonal())) {
            return winner;
        } else {
            return false;
        }
    },
    board = function(size, value) {

        var initialize = function(size, value) {
            var state = [],
                i;

            for (i = 0; i < size * size; i++) {
                state[i] = cell(value);
            }
            return state;
        },
            toGrid = function(state) {
                var grid = [],
                    row = [];
                for (var i = 0; i < state.length; i++) {
                    row.push(state[i]);
                    if (i % size === (size - 1)) {
                        grid.push(row);
                        row = [];
                    }
                }
                return grid;
            },
            state = initialize(size, value),
            grid = toGrid(state),
            board = {
                get: function(row, col) {
                    return this.state[row * size + col];
                },
                state: state,
                isGameOver: false,
                nextMark: 'X',
                checkForWin: checkForWinBruteForce.bind(board, grid),
                checkForDraw: function(state) {
                    var i;
                    for (i=0; i<state.length; i++) {
                        if (state[i].value===EMPTY_CELL_VALUE) return false;
                    }
                    return true;
                },
                isValidMove: function(rowOrCellNumber, col) {
                    var cell = col === undefined ? this.state[rowOrCellNumber] : this.get(rowOrCellNumber, col);
                    return cell.value === EMPTY_CELL_VALUE;
                },
                playMove: function(rowOrCellNumber, col) {
                    var cell = col === undefined ? this.state[rowOrCellNumber] : this.get(rowOrCellNumber, col);
                    if (!this.isGameOver && cell.value === EMPTY_CELL_VALUE) {
                        cell.value = this.nextMark;
                        this.nextMark = this.nextMark === 'X' ? 'O' : 'X';

                        var winner = false;
                        if ((winner = this.checkForWin())) {
                            this.isGameOver = true;
                            this.setWinner(winner.winner, winner.line);
                        } else if( this.checkForDraw(state) ) {
                            this.isGameOver = true;
                        }
                    }
                },
                grid: grid,
                setWinner: function(who, line) {
                    this.winner = who;
                    line.forEach(function(coords) {
                        var x, y;
                        y = coords[0];
                        x = coords[1];
                        this.get(y, x).isWinner = true;
                    }, this);
                },
                reset: function() {
                    for (var i = 0; i < this.state.length; i++) {
                        this.state[i].reset();
                    }
                    this.isGameOver = false;
                    this.nextMark = 'X';
                }
            };
        return board;
    },

    AIs = {
        // find the next free space
        dumb: function(state) {
            var cellNumber;
            for (cellNumber = 0; cellNumber < state.length; cellNumber++) {
                if (state[cellNumber].value === EMPTY_CELL_VALUE) return cellNumber;
            }
            return null;
        },
        wikipedia: function(state, mark) {
            var s = state.slice(),
                win = function(state, mark) {
                    for(var cn=0; cn<state.length; cn++) {
                        if(state[cn].value===EMPTY_CELL_VALUE) {
                            state[cn]=mark;
                            if( checkForWinBruteForce(state) ) {
                                return cn;
                            }
                        }
                    }
                    return false;
                },
                anyEmptySquare = function(state) {
                    for(var cn=0; cn<state.length; cn++) {
                         if(state[cn].value===EMPTY_CELL_VALUE) return cn
                    }
                    return false;
                },
                strategies = [ win, anyEmptySquare ],
                pick = function(strategies, state, mark) {
                    var i, cell;
                    for(i=0; i<strategies.length; i++) {
                        if( (cell=strategies[i](state.slice(), mark)) ) return cell;
                    }
                    throw new Error("Should not get here.");
                }
            ;
            return pick(strategies, state, mark);
        }
    };
//        // http://www.flyingmachinestudios.com/programming/minimax/
//        // http://aihorizon.com/essays/basiccs/trees/minimax.htm
//        //http://neverstopbuilding.com/minimax
//        minimax: function(state, type) {
//
//        }
//    },
//    flatten = function flatten(arr) {
//        return arr.reduce(function(flat, item) {
//            return flat.concat(item);
//        }, []);
//    },
//
//    // assumes flattend state before hand: state = flatten(state);
//    generateMoves = function(state, nextPlayer) {
//        var moves = [];
//        state.forEach(function(cell, i) {
//            if( cell.value===EMPTY_CELL_VALUE ) {
//                var nextBoard = clone(state);
//                nextBoard[i] = nextP(nextPlayer);
//                moves.push(nextBoard);
//            }
//        });
//    }
//;

var PLAYER = {
    HUMAN: 1,
    COMPUTER: 2
};

angular
    .module('ticTacToe', [])
    .filter('range', function() {
        return function(n) {
            var list = [];
            for (var i = 0; i < n; i++) list.push(i);
            return list;
        };
    })
    .controller('GameController', [function() {
        var vm = this;
        vm.xplayer = false;
        vm.isRunning = false;
        vm.selectPlayer = function(xplayer) {
            d(xplayer);
            this.xplayer = xplayer;
            this.isRunning = true;
        };
        vm.handleWin = function(player) {
            d('won: ', player);
            this.winner = player;
            this.isRunning = false;
        };
    }])
    .directive('gameBoard', [function() {


        //        var template = '',
        var
        GameBoardController = [function() {
            // x always first
            var //self = this,
            ai = AIs.dumb,
            // ai = AIs.wikipedia,
            isComputerPlayer = function(player) {
                return parseInt(player, 10)===PLAYER.COMPUTER;
            };
            d('construct', this);
            this.readyToStart = false;
            this.board = board(BOARD_SIZE, EMPTY_CELL_VALUE);

            this.computerMove = function() {
                var move = ai(this.board.state, this.board.nextMark);
                this.board.playMove(move);
            }

            this.resetBoard = function() {
                d('Reset game');
                this.board.reset();
                if (isComputerPlayer(this.xplayer)) {
                    this.computerMove();
                }
                this.isRunning=true;
            };

            this.mark = function(row, col) {
                d('this:', this);
                //if ( !this.readyToStart ) return;
                d(this.board.get(row, col));
                if (this.board.isGameOver) {
                    this.resetBoard();
                } else {
                    if( !this.board.isValidMove(row, col) ) return;
                    this.board.playMove(row, col);
                    if (!this.board.isGameOver) {
                        this.computerMove();
                    }
                }
                if (this.board.isGameOver) {
                    if ( this.board.winner!==null ) {
                        d('Won!');
                        this.onWon({
                            player: this.board.winner
                        });
                    }
                }
            };
        }];


        return {
            restrict: 'E',
            //            template: template
            templateUrl: 'gameboard.html',
            controller: GameBoardController,
            controllerAs: 'c',
            scope: {
                xplayer: '@',
                isRunning:'=',
                onWon: '&'
            },
            bindToController: true,
            link: function(scope) {
                scope.$watch('c.isRunning', function(value, oldValue) {
                    d(arguments);
                    if( value===true && oldValue===false ) {
                        scope.c.resetBoard();
                    }
                });
                scope.$watch('c.xplayer',
                             function() {
                                 //d('Gameboard: xplayer changed.', arguments, scope);
                                 //if( value!=='false' ) value = parseInt(value, 10);
                                 //d('value before set: ', value);
                                 //scope.xplayer = value;
                                 // scope.c.resetBoard();
                                 //   if( typeof this.resetBoard === 'function' ) this.resetBoard();
                             });
            }
        };
    }])
    .directive('playerChooser', [function() {

        var
        PlayerchooserController = [function() {
            this.HUMAN = PLAYER.HUMAN;
            this.COMPUTER = PLAYER.COMPUTER;


            this.handleSelection = function(selection) {
                d(selection);
                this.fireSelect({
                    xplayer: selection
                });
            };
        }];

        return {
            restrict: 'E',
            templateUrl: 'player-chooser.html',
            //            template: "<p>choose</p>",
            controller: PlayerchooserController,
            controllerAs: 'pcc',
            scope: {
                fireSelect: '&onSelectXplayer'
            },
            bindToController: true
        };
    }]);
//d(checkForWin([], 3));
