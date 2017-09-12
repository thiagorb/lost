import StarsManager from "./StarsManager";
import { SPS } from "./GlobalConstants";
import { Vector2D } from "./Vectorial";
import { View, Keys } from "./Game";

let viewSize: Vector2D = [2000, 2000];
let viewPosition: Vector2D = [0, 0];
const roomSize: Vector2D = [40000, 40000];
const maxViewSize = 2000;
const MIN_Z = 0.2;
const MAX_Z = 0.8;

export class GameView extends View {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        const stars = new StarsManager(
            MIN_Z,
            MAX_Z,
            3,
            1000,
            {
                getRoomSize: () => roomSize,
                getViewPosition: () => viewPosition,
                getViewSize: () => viewSize
            }
        );
        console.log(stars);
        
        this.addRenderObject({
            render: ctx => {
                ctx.fillStyle = 'white';
                ctx.lineCap = 'butt';
                ctx.font = '15px Arial';
                ctx.fillText(
                    JSON.stringify(viewPosition), 
                    20, 
                    20
                );

                var px = this.canvas.width / viewSize[0];
                var py = this.canvas.height / viewSize[1];
                var p = Math.max(px, py);
                var effectiveViewWidth = viewSize[0] * p;
                var effectiveViewHeight = viewSize[1] * p;
                ctx.setTransform(p, 0, 0, p, (this.canvas.width - effectiveViewWidth) / 2, (this.canvas.height - effectiveViewHeight) / 2);
                ctx.translate(-viewPosition[0], -viewPosition[1]);
            }
        });
        
        this.addRenderObject(stars);

        const border = [
            viewSize[0] / MIN_Z,
            viewSize[1] / MAX_Z,
        ];

        const nextP = (coord: 0 | 1, speed: number) => {
            viewPosition[coord] = (viewPosition[coord] + (speed * 5000) / SPS + roomSize[coord] - border[coord] - border[coord] / 2) % (roomSize[coord] - border[coord]) + border[coord] / 2;
        };

        this.addKeyListener(Keys.UP, () => {
            nextP(1, -1);
        });
        
        this.addKeyListener(Keys.DOWN, () => {
            nextP(1, 1);
        });
        
        this.addKeyListener(Keys.LEFT, () => {
            nextP(0, -1);
        });
        
        this.addKeyListener(Keys.RIGHT, () => {
            nextP(0, 1);
        });

        document.body.addEventListener(
            "ontouchend" in document.documentElement? "touchend": "mousedown",
            (ev) => {
                if ((<HTMLElement>ev.target).tagName !== "CANVAS") return;
            }
        );
    }
    
    start() {
        super.start(SPS);
    }
}