'use strict';

var console = console || null;

// @TODO Try out magic square method of checking if puzzle is solved

angular
    .module('ticTacToe', [])
    .directive('tttGameBoard', [function() {

        function state(width, height, value) {
            value = value || null;
            var state=[], i, j;

            for(i=0; i<width; i++) {
                state[i]=[];
                for(j=0; j<height; j++) {
                    //state[i][j]=value;
                    state[i][j]={
                        value: value,
                        isWinner: false
                    };
                }
            }
            return {
                state: state,
                isWon: false,
                checkForWin: function() {
                    var state = this.state,
                        checkHorizontal = function() {
                        var y, x,
                            expected,
                            winningLine;
                        for( y=0; y<state.length; y++ ) {
                            expected = state[y][0].value;
                            if( expected===null ) continue;
                            winningLine = [[y, 0]];
                            for( x=1; x<state[y].length; x++ ) {
                                if ( state[y][x].value!==expected ) {
                                    winningLine = null;
                                    break;
                                } else {
                                    winningLine.push([y, x]);
                                }
                            }
                            if( winningLine!==null ) {
                                this.setWinner(expected, winningLine);
                                return true;
                            }
                        }
                        return false;
                    }.bind(this),
                    checkVertical = function() {
                        var y, x,
                            expected,
                            winningLine;
                        for( x=0; x<state[0].length; x++ ) {
                            expected = state[0][x].value;
                            if( expected===null ) continue;
                            winningLine = [[0,x]];
                            for( y=1; y<state.length; y++ ) {
                                if ( state[y][x].value!==expected ) {
                                    winningLine = null;
                                    break;
                                } else winningLine.push([y,x]);
                            }
                            if( winningLine!==null ) {
                                this.setWinner(expected, winningLine);
                                return true;
                            }
                        }
                        return false;
                    }.bind(this),
                    checkDiagonal = function() {
                        var y=1, x=1,
                            expected=state[0][0].value,
                            winningLine;

                        if( expected!==null ) {
                            winningLine = [[0,0]];
                            while(y<state.length && x<state[y].length) {
                                if( expected!==state[y][x].value ) {
                                    winningLine = null;
                                    break;
                                } else winningLine.push([y, x]);
                                x++; y++;
                            }
                            if( winningLine!==null ) {
                                this.setWinner(expected, winningLine);
                                return true;
                            }
                        }

                        x = 1, y = state.length-1;
                        expected=state[y][0].value;
                        winningLine = [[y, 0]];
                        y--; 
                        if( expected!==null ) {
                            while(y>=0 && x<state[y].length) {
                                if( expected!==state[y][x].value ) {
                                    winningLine = null;
                                    break;
                                } else winningLine.push([y, x]);
                                x++; y--;
                            }
                            if( winningLine!==null ) {
                                this.setWinner(expected, winningLine);
                                return true;
                            }
                        }
                        return false;
                    }.bind(this);

                    if( checkHorizontal() || checkVertical() || checkDiagonal() ) {
                        this.isWon = true;
                        return true;
                    } else {
                        return false;
                    }
                },
                setWinner:  function(who, line) {
                    this.winner = who;
                    line.forEach(function(coords) {
                        var x, y;
                        y = coords[0];
                        x = coords[1];
                        this.state[y][x].isWinner = true;
                    }, this);
                }
            };
        }



//        var template = '',
        var
        AIs = {
            // https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
            wikipedia: function(state, type) {
                var strategies = [function win(state) {
                    
                },
                                  function block(state) {
                                      
                                  }];
            
            },
            // http://www.flyingmachinestudios.com/programming/minimax/
            // http://aihorizon.com/essays/basiccs/trees/minimax.htm
            // https://en.wikipedia.org/wiki/Tic-tac-toe#Strategy
            minimax: function(state, type) {
                
            }
        },
        GameBoardController = [function() {
            // x always first
            var //self = this,
                nextMark = 'X';

            this.gameState = state(3, 3, null);


            this.mark = function(x, y) {
                console.log(this.gameState.state[x][y]); // eslint-disable-line no-console
                if( !this.gameState.isWon && this.gameState.state[x][y].value===null) {
                    this.gameState.state[x][y].value = nextMark;
                    nextMark = nextMark==='X' ? 'O' : 'X';
                    if( this.gameState.checkForWin() ) {
                        console.log('Won'); // eslint-disable-line no-console
                    }
                }
            };
        }],

        bindings = {}; 

        return {
            restrict: 'E',
            //            template: template
            templateUrl: 'gameboard.html',
            controller: GameBoardController,
            controllerAs: 'c',
            bindToController: bindings
        };
    }]);

