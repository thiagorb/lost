export interface Steppable {
    preStep(): void;
    step(): void;
}

export interface Renderable {
    render(g: CanvasRenderingContext2D): void;
}

export class View {
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
        this.canvas = canvas;
        this.resizeCanvas();
        this.keyboardController = new KeyboardController();
        this.addStepObject(this.keyboardController);
        this.resizeCanvas = this.resizeCanvas.bind(this);
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
        var g = this.canvas.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.renderObjects.forEach(o => o.render(g));
        this.countFPS++;
        if (this.running) window.requestAnimationFrame(() => this.render());
    }

    start(sps: number) {
        this.stop();
        this.keyboardController.stop();
        window.addEventListener('resize', this.resizeCanvas);
        this.running = true;
        this.keyboardController.start();
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
        window.removeEventListener('resize', this.resizeCanvas);
        if (this.stepToken) clearInterval(this.stepToken);
        if (this.countFPSToken) clearInterval(this.countFPSToken);
        this.stepToken = null;
        this.countFPSToken = null;
        this.running = false;
    }

    addKeyListener(keyCode: number, callback: KeyListener) {
        this.keyboardController.addListener(keyCode, callback);
    }

    resizeCanvas() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }
}

type KeyListener = () => void;

class KeyboardController implements Steppable {
    pressedKeys: {[keyCode: number]: boolean} = {};
    keyListeners: {[keyCode: number]: KeyListener[]} = {};

    constructor() {
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    start()
    {
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('keyup', this.onKeyUp);
    }

    stop()
    {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }

    onKeyDown(ev: KeyboardEvent) {
        this.pressedKeys[ev.keyCode] = true;
    }

    onKeyUp(ev: KeyboardEvent) {
        this.pressedKeys[ev.keyCode] = false;
    }

    preStep() {

    }

    step() {
        for (const keyCode in this.keyListeners) {
            if (this.pressedKeys[keyCode])
                this.keyListeners[keyCode].forEach(callback => callback());
        }
    }

    addListener(keyCode: number, callback: KeyListener) {
        let listeners = this.keyListeners[keyCode];
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