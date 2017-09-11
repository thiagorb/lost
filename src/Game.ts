module Game {
    export interface Steppable {
        preStep();
        step();
    }

    export interface Renderable {
        render(g: CanvasRenderingContext2D);
    }

    export class GameView {
        stepToken: number;
        countFPSToken: number;
        stepObjects: Array<Steppable> = new Array();
        renderObjects: Array<Renderable> = new Array();
        canvas: HTMLCanvasElement;
        
        private keyboardController: KeyboardController;
        private countFPS = 0;
        private fps = 0;
        private countSPS = 0;
        private sps = 0;
        public running = false;

        constructor(canvas: HTMLCanvasElement) {
            window.addEventListener("resize", () => this.resizeCanvas());
            this.canvas = canvas;
            this.resizeCanvas();
            this.keyboardController = new KeyboardController();
            this.addStepObject(this.keyboardController);
        }

        addStepObject(o: Steppable) {
            this.stepObjects.push(o);
        }

        addRenderObject(o: Renderable) {
            this.renderObjects.push(o);
        }

        addObject(o: Steppable & Renderable) {
            this.addStepObject(o);
            this.addRenderObject(o);
        }

        step() {
            this.stepObjects.forEach(o => o.preStep());
            this.stepObjects.forEach(o => o.step());
            this.countSPS++;
        }

        render() {
            var g = this.canvas.getContext("2d");
            g.setTransform(1, 0, 0, 1, 0, 0);
            g.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.renderObjects.forEach(o => o.render(g));
            this.countFPS++;
            if (this.running) window.requestAnimationFrame(() => this.render());
        }

        start(sps) {
            this.stop();
            this.running = true;
            this.step();
            window.requestAnimationFrame(() => this.render());
            this.stepToken = setInterval(() => this.step(), 1000 / sps);
            this.countFPSToken = setInterval(() => {
                this.fps = this.countFPS;
                this.countFPS = 0;
                this.sps = this.countSPS;
                this.countSPS = 0;
            }, 1000);
        }

        stop() {
            if (this.stepToken) clearInterval(this.stepToken);
            if (this.countFPSToken) clearInterval(this.countFPSToken);
            this.stepToken = null;
            this.countFPSToken = null;
            this.running = false;
        }

        addKeyListener(keyCode: number, callback: Function) {
            this.keyboardController.addListener(keyCode, callback);
        }

        resizeCanvas() {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        }
    }

    class KeyboardController implements Steppable {
        pressedKeys: {} = {};
        keyListeners: {} = {};

        constructor() {
            document.addEventListener("keydown", ev => {
                this.pressedKeys[ev.keyCode] = true;
            });
            document.addEventListener("keyup", ev => {
                this.pressedKeys[ev.keyCode] = false;
            });
        }

        preStep() {

        }

        step() {
            for (var keyCode in this.keyListeners) {
                if (this.pressedKeys[keyCode])
                    this.keyListeners[keyCode].forEach(callback => callback());
            }
        }

        addListener(keyCode: number, callback: Function) {
            var listeners: Array<Function> = this.keyListeners[keyCode];
            if (!listeners) {
                listeners = [];
                this.keyListeners[keyCode] = listeners;
            }
            listeners.push(callback);
        }
    }

    export enum Keys {
        LEFT = 37,
        UP = 38,
        RIGHT = 39,
        DOWN = 40,
        SPACE = 32
    };
}