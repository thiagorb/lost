import RenderablePolygon from './RenderablePolygon';
import StarsManager from './StarsManager';
import * as Geometry from './Geometry';
import * as Game from './Game';
import * as Vectorial from './Vectorial';
import { SPS } from './GlobalConstants';
import { Ship } from './Ship';

let viewSize: Vectorial.Vector2D = [2000, 2000];
let viewPosition: Vectorial.Vector2D = [0, 0];
const roomSize: Vectorial.Vector2D = [40000, 40000];
const maxViewSize = 2000;
const STARS = 1000;
const MIN_Z = 0.1;
const MAX_Z = 0.9;

const border = [
    viewSize[0] / MIN_Z,
    viewSize[1] / MIN_Z
];

const nextP = (position: Vectorial.Vector2D, coord: 0 | 1, speed: Vectorial.Vector2D) => {
    position[coord] = (position[coord] + speed[coord] + roomSize[coord] - border[coord] - border[coord] / 2) % (roomSize[coord] - border[coord]) + border[coord] / 2;
};

const constrain = (x: number, min: number, max: number) => {
    const delta = max - min;
    return (x - min - delta * Math.floor(x / delta)) % delta + min;
};

const constrainDeltaAngle = (x: number) => constrain(x, -Math.PI, Math.PI);

class RenderableCircle extends Geometry.Circle implements Game.Renderable, Game.Steppable {
    private color: string;

    constructor(center: Vectorial.Vector2D, radius: number, color: string) {
        super(radius, center);
        this.color = color;
    }

    prepareContext(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.center[0], this.center[1]);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    restoreContext(ctx: CanvasRenderingContext2D) {
        ctx.restore();
    }

    render(ctx: CanvasRenderingContext2D) {
        this.prepareContext(ctx);
        this.draw(ctx);
        this.restoreContext(ctx);
    }
    
    preStep() {
        
    }
    
    step() {
    }
}

class Planet extends RenderableCircle {
}

export class GameView extends Game.GameView {
    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        const stars = new StarsManager(
            MIN_Z,
            MAX_Z,
            3,
            STARS,
            {
                getRoomSize: () => roomSize,
                getViewPosition: () => viewPosition,
                getViewSize: () => viewSize
            }
        );
        const ship = new Ship();
        
        this.addRenderObject({
            render: ctx => {
                var px = this.canvas.width / viewSize[0];
                var py = this.canvas.height / viewSize[1];
                var p = Math.max(px, py);

                p = Math.max(p, Math.min(1, 3 / Math.pow(Vectorial.squaredLength(ship.speed), 0.3)));

                var effectiveViewWidth = viewSize[0] * p;
                var effectiveViewHeight = viewSize[1] * p;
                ctx.setTransform(p, 0, 0, p, (this.canvas.width - effectiveViewWidth) / 2, (this.canvas.height - effectiveViewHeight) / 2);
                ctx.translate(-viewPosition[0], -viewPosition[1]);
            }
        });
        
        this.addRenderObject(stars);

        this.addObject(ship);

        const planet = new Planet([roomSize[0] / 2 + 1400, roomSize[1] / 2 + 1300], 500, "#55D");
        this.addObject(planet);

        let breaking = false;

        this.addKeyListener(Game.Keys.SPACE, () => {
            if (ship.landed || ship.dead) {
                return;
            }
            breaking = true;

            const desiredDirection = Geometry.direction(0, 0, -ship.speed[0], -ship.speed[1]);
            const deltaDirection = constrainDeltaAngle(desiredDirection - ship.direction);

            if (deltaDirection !== 0) {
                let turn = 0;
                const angularDirection = ship.angularSpeed > 0 ? 1 : -1;

                if (deltaDirection > 0 !== ship.angularSpeed > 0) {
                    turn = -angularDirection;
                } else {
                    const timeToStopRotation = angularDirection * ship.angularSpeed / Ship.STEER_ACCELERATION;

                    const timesToZeroDelta = Geometry.bhaskara(
                        -angularDirection * Ship.STEER_ACCELERATION / 2,
                        -ship.angularSpeed,
                        deltaDirection
                    ).filter(t => t > 0).sort().shift();

                    if (timesToZeroDelta !== undefined && timesToZeroDelta > timeToStopRotation) {
                        turn = angularDirection;
                    } else if (timesToZeroDelta < timeToStopRotation) {
                        turn = -angularDirection;
                    }
                }

                if (turn > 0) {
                    ship.steerLeft();
                } else if (turn < 0) {
                    ship.steerRight();
                }
            }

            if (Vectorial.squaredLength(ship.speed) > 0.01 && Math.abs(deltaDirection) < Math.PI / 4) {
                ship.accelerate(0.5);
            }
        });

        this.addKeyListener(Game.Keys.UP, () => {
            if (!breaking) {
                ship.accelerate();
            }
        });
        
        this.addKeyListener(Game.Keys.LEFT, () => {
            if (!breaking) {
                ship.steerLeft();
            }
        });
        
        this.addKeyListener(Game.Keys.RIGHT, () => {
            if (!breaking) {
                ship.steerRight();
            }
        });

        this.addStepObject({
            preStep: () => {
                breaking = false;
                
                nextP(ship.position, 0, ship.speed);
                nextP(ship.position, 1, ship.speed);

                if (!ship.dead && !ship.landed) {
                    // gravity
                    const squaredDistance = Geometry.squaredDistance(ship.position, planet.center);
                    if (squaredDistance < 4 * planet.squaredRadius) {
                        const direction = Geometry.direction(ship.position[0], ship.position[1], planet.center[0], planet.center[1]);
                        ship.speed[0] += SPS * 20 * Math.cos(direction) / squaredDistance;
                        ship.speed[1] -= SPS * 20 * Math.sin(direction) / squaredDistance;
                    }

                    // collision
                    if (ship.transformedPolygon.intersectsWithCircle(planet)) {
                        const speedLimit = 100 / SPS;
                        const angleLimit = Math.PI / 20;
                        const speed = Vectorial.squaredLength(ship.speed);
                        const landingAngle = Geometry.direction(planet.center[0], planet.center[1], ship.position[0], ship.position[1]);
                        const deltaAngle = Math.abs(constrainDeltaAngle(ship.direction - landingAngle));
                        console.log('speed', speed, 'limit', speedLimit);
                        console.log('angle', deltaAngle, 'limit', angleLimit);
                        if (speed < speedLimit && deltaAngle < angleLimit) {
                            ship.landed = true;
                            breaking = false;
                            ship.direction = landingAngle;
                            console.log('landed');
                        } else {
                            ship.dead = true;
                            breaking = false;
                            console.log('died');
                        }
                        ship.speed = [0, 0];
                        ship.angularSpeed = 0;
                    }
                }
            },
            step: () => {
                stars.speed = ship.speed;

                viewPosition = [ship.position[0] - viewSize[0] / 2, ship.position[1] - viewSize[1] / 2];
            }
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