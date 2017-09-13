import { GameView, GameResult } from "./Lost";
import { Opening } from "./Opening";

interface LevelStorageData {
    time: number;
    stars: number;
}

var $ = function (query: string): Element { return document.querySelector(query) };
var $$ = function (query: string): NodeList { return document.querySelectorAll(query) };

const doTransition = (callback1: Function = null, callback2: Function = null) => {
    $('#transition').classList.remove('off');
    window.requestAnimationFrame(() => {
        $('#transition').classList.add('visible');
        setTimeout(
            () => {
                $('#transition').classList.remove('visible');
                if (callback1) callback1();
                setTimeout(
                    () => {
                        $('#transition').classList.add('off');
                        if (callback2) setTimeout(callback2);
                    },
                    1000
                )
            }, 
            1000
        );
    });
};

let opening: Opening;
let game: GameView;

const newGame = (canvas: HTMLCanvasElement) => {
    game = new GameView(
        (result: GameResult) => {
            doTransition(
                () => {
                    $('#gameover').classList.add('active');
                    for (let i = 0; i < $('#gameresult').children.length; i++) {
                        $('#gameresult').children[i].classList.add('invisible');
                    }   
                    $(`#gameover_${result}`).classList.remove('invisible');
                    game.stop();
                    game = null;
                    opening.start();
                }
            )
        },
        canvas
    );
    return game;
};

window.onload = () => {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = 
            ["webkit", "moz", "o", "ms"].reduce(function (existing, vendor) {
                return existing || (<any>window)[vendor + "RequestAnimationFrame"];
            }, null)
            || function(callback) { window.setTimeout(callback, 1000 / 60); };
    }
    
    const canvas = <HTMLCanvasElement>$("canvas");
    opening = new Opening(canvas)
    opening.start();    

    $('#btnStart').addEventListener('click', () => {
        doTransition(
            () => {
                opening.stop();
                $('#initial').classList.remove('active');
                game = newGame(canvas);
                game.start();
            }
        )
    });

    $('#btnHelp').addEventListener('click', () => {
        doTransition(
            () => {
                $('#initial').classList.remove('active');
                $('#help').classList.add('active');
            }
        )
    });
    
    $('#btnBack').addEventListener('click', () => {
        doTransition(
            () => {
                $('#help').classList.remove('active');
                $('#initial').classList.add('active');
            }
        )
    });
    
    $('#btnGameOverBack').addEventListener('click', () => {
        doTransition(
            () => {
                $('#gameover').classList.remove('active');
                $('#initial').classList.add('active');
            }
        )
    });
};