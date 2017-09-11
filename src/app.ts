interface LevelStorageData {
    time: number;
    stars: number;
}

window.onload = () => {
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = 
            ["webkit", "moz", "o", "ms"].reduce(function (existing, vendor) {
                return existing || window[vendor + "RequestAnimationFrame"];
            }, null)
            || function(callback) { window.setTimeout(callback, 1000 / 60); };
    }
    
    var $ = function (query: string): Element { return document.querySelector(query) };
    var $$ = function (query: string): NodeList { return document.querySelectorAll(query) };
    
    var gameView;
    //*
    gameView = new Lost.GameView(<HTMLCanvasElement>$("canvas"));
    /*/
    gameView = new Test.GameView(<HTMLCanvasElement>$("canvas"));
    //*/
    gameView.start();
};