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
    // Cell[]* -> Winner | false
    // Checks board state and returns the winner or false
    checkForWinBruteForce = function(state) {
        var wins = [
            // horizontals
            [0,1,2], [3,4,5], [6,7,8],
            // verticals
            [0,3,6], [1,4,7], [2,5,8],
            // diagonals
            [0,4,8], [6,4,2]
        ],
            isWinningLine = function(line) {
                var i, expected = state[line[0]];

                if( expected===EMPTY_CELL_VALUE ) return false;

                for(i=1; i<line.length; i++) {
                    if( state[line[i]]!==expected ) return false;
                }
                return true;
            },
            winners = wins.filter(isWinningLine);
        if( winners.length>0 ) {
            return {
                winner: state[winners[0][0]],
                line: winners[0]
            };
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
            toFlatArray = function(state) {
                return state.map(function(cell) {
                    return cell.value;
                });
            },
            state = initialize(size, value),
            board = {
                get: function(row, col) {
                    return this.state[row * size + col];
                },
                state: state,
                asArray: toFlatArray.bind(null, state),
                isGameOver: false,
                nextMark: 'X',
                checkForWin: function() {
                    return checkForWinBruteForce(this.asArray())
                },
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
                setWinner: function(who, line) {
                    this.winner = who;
                    line.forEach(function(c) {
                        this.state[c].isWinner = true;
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
            var opponent = function(mark) { return mark==='X' ? 'O' : 'X'; },
                countWinningPositions = function(state, mark) {
                    var count=0, cn;
                    for(cn=0; cn<state.length; cn++) {
                        if(state[cn]===EMPTY_CELL_VALUE) {
                            state[cn]=mark;
                            if( checkForWinBruteForce(state) ) count++;
                            state[cn]=EMPTY_CELL_VALUE;
                        }
                    }
                    return count;
                },
                hasFork = function(state, mark) {
                    return countWinningPositions(state, mark) > 1;
                },
                withEmptyCells = function(fn) {
                    var cn, result;
                    for(cn=0; cn<state.length; cn++) {
                        if(state[cn]===EMPTY_CELL_VALUE) {
                            if( (result = fn(cn, state.slice()))!==undefined ) {
                                return result; 
                            }
                        }
                    }
                    return false;
                },
                emptySide = function(state, mark) {
                    if( state[1]===EMPTY_CELL_VALUE ) return 1;
                    if( state[3]===EMPTY_CELL_VALUE ) return 3;
                    if( state[5]===EMPTY_CELL_VALUE ) return 5;
                    if( state[7]===EMPTY_CELL_VALUE ) return 7;
                },
                anyEmptySquare = function(state) {
                    for(var cn=0; cn<state.length; cn++) {
                         if(state[cn]===EMPTY_CELL_VALUE) return cn
                    }
                    return false;
                },
                win = function(state, mark) {
                    for(var cn=0; cn<state.length; cn++) {
                        if(state[cn]===EMPTY_CELL_VALUE) {
                            state[cn]=mark;
                            if( checkForWinBruteForce(state) ) {
                                return cn;
                            }
                            state[cn]=EMPTY_CELL_VALUE;
                        }
                    }
                    return false;
                },
                block = function(state, mark) {
                    return win(state, opponent(mark));
                },
                fork = function(state, mark) {
                    return withEmptyCells(function(cn, state) {
                        state[cn]=mark;
                        if(hasFork(state, mark)) return cn;
                    })
                },
                blockFork = function(state, mark) {
                    var opFork = fork(state, opponent(mark));
                    if( opFork ) {
                        if(state[4]===mark) {
                            return emptySide(state, mark);
                        }
                        return opFork;
                    }
                    return false;
                },
                center = function(state, mark) {
                    return state[4]===EMPTY_CELL_VALUE ? 4 : false;
                },
                oppositeCorner = function(state, mark) {
                    var op = opponent(mark);
                    if( state[0]===op && state[8]===EMPTY_CELL_VALUE ) return 8;
                    if( state[8]===op && state[0]===EMPTY_CELL_VALUE ) return 0;
                    if( state[2]===op && state[6]===EMPTY_CELL_VALUE ) return 6;
                    if( state[6]===op && state[2]===EMPTY_CELL_VALUE ) return 2;
                    return false;
                },
                emptyCorner = function(state, mark) {
                    var areAllCornersEmpty = function(state) {
                        return state[0]===EMPTY_CELL_VALUE
                            && state[2]===EMPTY_CELL_VALUE
                            && state[6]===EMPTY_CELL_VALUE
                            && state[8]===EMPTY_CELL_VALUE;
                    };
                    return areAllCornersEmpty(state) ? 0 : false;
                },
                anyEmptyCorner = function(state, mark) {
                    if( state[0]===EMPTY_CELL_VALUE ) return 0;
                    if( state[2]===EMPTY_CELL_VALUE ) return 2;
                    if( state[6]===EMPTY_CELL_VALUE ) return 6;
                    if( state[8]===EMPTY_CELL_VALUE ) return 8;
                    return false;
                },
                strategies = [ win, block,
                               fork,
                               blockFork,
                               center,
                               oppositeCorner,
                               emptyCorner,
                               //anyEmptyCorner,
                               emptySide,
                               anyEmptySquare ],
                pick = function(strategies, state, mark) {
                    var i, cell;
                    for(i=0; i<strategies.length; i++) {
                        if( (cell=strategies[i](state.slice(), mark))!==false ) {
                            d('Strat: ' + i);
                            return cell;
                        }
                    }
                    throw new Error("Should not be here.");
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
            // ai = AIs.dumb,
            ai = AIs.wikipedia,
            isComputerPlayer = function(player) {
                return parseInt(player, 10)===PLAYER.COMPUTER;
            };
            d('construct', this);
            this.readyToStart = false;
            this.board = board(BOARD_SIZE, EMPTY_CELL_VALUE);

            this.computerMove = function() {
                var move = ai(this.board.asArray(), this.board.nextMark);
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
