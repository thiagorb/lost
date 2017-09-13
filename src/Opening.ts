import StarsManager from './StarsManager';
import { Renderable, Steppable, View } from './Game';
import { Vector2D } from './Vectorial';
import { GameInfoProvider } from './Lost';

let viewSize: Vector2D = [2000, 2000];
let viewPosition: Vector2D = [0, 0];
const roomSize: Vector2D = [40000, 40000];
const STARS = 1000;
const MIN_Z = 0.1;
const MAX_Z = 0.9;
const SPS = 60;

const gameInfo: GameInfoProvider = {
    getRoomSize: () => roomSize,
    getViewPosition: () => viewPosition,
    getViewSize: () => viewSize
};

const border = [
    viewSize[0] / MIN_Z,
    viewSize[1] / MIN_Z
];

const nextP = (position: Vector2D, coord: 0 | 1, speed: Vector2D) => {
    position[coord] = (position[coord] + speed[coord] + roomSize[coord] - border[coord] - border[coord] / 2) % (roomSize[coord] - border[coord]) + border[coord] / 2;
};

const constrain = (x: number, min: number, max: number) => {
    const delta = max - min;
    return (x - min - delta * Math.floor(x / delta)) % delta + min;
};

export class Opening extends View {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        const stars = new StarsManager(
            MIN_Z,
            MAX_Z,
            3,
            STARS,
            gameInfo
        );

        this.addRenderObject({
            render: ctx => {
                var px = this.canvas.width / viewSize[0];
                var py = this.canvas.height / viewSize[1];
                
                const p = Math.max(px, py);

                var effectiveViewWidth = viewSize[0] * p;
                var effectiveViewHeight = viewSize[1] * p;
                ctx.save();
                ctx.translate((this.canvas.width - effectiveViewWidth) / 2, (this.canvas.height - effectiveViewHeight) / 2);
                ctx.scale(p, p);
                ctx.translate(-viewPosition[0], -viewPosition[1]);
            }
        });
        
        this.addRenderObject(stars);

        this.addRenderObject({
            render(ctx: CanvasRenderingContext2D) {
                ctx.restore();
            }
        });

        const speed: Vector2D = [30 / SPS, 30 / SPS];

        this.addStepObject({
            preStep() {
                nextP(viewPosition, 0, speed);
                nextP(viewPosition, 1, speed);  
            },

            step() {
                
            }
        });
    }
    
    start() {
        super.start(SPS);
    }
}