import RenderablePolygon from './RenderablePolygon';
import StarsManager from './StarsManager';
import { SPS } from './GlobalConstants';
import { Ship } from './Ship';
import { Vector2D, squaredLength } from './Vectorial';
import { Circle, direction, bhaskara, squaredDistance } from './Geometry';
import { Renderable, Steppable, View, Keys } from './Game';
import { minmax } from './Helpers';
import Resource from './Resource';

let viewSize: Vector2D = [2000, 2000];
let viewPosition: Vector2D = [0, 0];
const roomSize: Vector2D = [400000, 400000];
const maxViewSize = 2000;
const STARS = 1000000;
const MIN_Z = 0.1;
const MAX_Z = 0.9;

export interface GameInfoProvider {
    getViewSize(): Vector2D;
    
    getViewPosition(): Vector2D;

    getRoomSize(): Vector2D;
}

const gameInfo: GameInfoProvider = {
    getRoomSize: () => roomSize,
    getViewPosition: () => viewPosition,
    getViewSize: () => viewSize
};

const border = [
    viewSize[0] / MIN_Z,
    viewSize[1] / MIN_Z
];

export const nextP = (position: Vector2D, coord: 0 | 1, speed: Vector2D) => {
    position[coord] = (position[coord] + speed[coord] + roomSize[coord] - border[coord] - border[coord] / 2) % (roomSize[coord] - border[coord]) + border[coord] / 2;
};

const constrain = (x: number, min: number, max: number) => {
    const delta = max - min;
    return (x - min - delta * Math.floor(x / delta)) % delta + min;
};

const constrainDeltaAngle = (x: number) => constrain(x, -Math.PI, Math.PI);

class RenderableCircle extends Circle implements Renderable, Steppable {
    public color: string;

    constructor(center: Vector2D, radius: number, color: string) {
        super(radius, center);
        this.color = color;
    }

    prepareContext(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.center[0], this.center[1]);
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.scale(this.radius, this.radius);
        const fill = ctx.createRadialGradient(0, 0, 0.3, 0, 0, 1);
        fill.addColorStop(0, this.color);
        fill.addColorStop(1, 'black');

        ctx.fillStyle = fill;
        ctx.strokeStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, 0.99, 0, 6.3, true);
        
        ctx.fill();
        ctx.restore();
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

const rand = (min: number, max: number) => Math.random() * (max - min) + min;
const randInt = (min: number, max: number) => Math.floor(rand(min, max));

const randomPlanet = () => {
    const planet = new Planet(
        [
            rand(border[0] + 3000, roomSize[0] - border[0] - 3000), 
            rand(border[1] + 3000, roomSize[1] - border[1] - 3000),
        ], 
        randInt(200, 1000),
        `rgb(${randInt(128, 256)}, ${randInt(128, 256)}, ${randInt(128, 256)})`
    );
    return planet;
};

const createHomePlanet = () => {
    const homePlanet = randomPlanet();
    const angle = Math.random() * 6.28;
    homePlanet.center = [
        roomSize[0] / 2 + (roomSize[0] / 2 - border[0] / 2 - 3000) * Math.cos(angle),
        roomSize[1] / 2 + (roomSize[1] / 2 - border[1] / 2 - 3000) * Math.sin(angle),
    ];
    return homePlanet;
};

export type GameResult = 
    "win" |
    "crashed" |
    "out_of_fuel" |
    "out_of_food";

export class GameView extends View {
    constructor(private readonly onGameOver: (result: GameResult) => void, canvas: HTMLCanvasElement) {
        super(canvas);
        const stars = new StarsManager(
            MIN_Z,
            MAX_Z,
            3,
            STARS,
            gameInfo
        );

        const fuel = new Resource("FUEL", 0.02 / SPS, 20, 20, 0.85, gameInfo);
        const food = new Resource("FOOD", 0.01 / SPS, 140, 20, 0.85, gameInfo);

        const ship = new Ship(fuel, [roomSize[0] / 2, roomSize[1] / 2]);
        
        this.addRenderObject({
            render: ctx => {
                var px = this.canvas.width / viewSize[0];
                var py = this.canvas.height / viewSize[1];
                
                const p = minmax(Math.max(px, py), 1.5 * Math.max(px, py), 3 / Math.pow(squaredLength(ship.speed), 0.3));

                var effectiveViewWidth = viewSize[0] * p;
                var effectiveViewHeight = viewSize[1] * p;
                ctx.save();
                ctx.translate((this.canvas.width - effectiveViewWidth) / 2, (this.canvas.height - effectiveViewHeight) / 2);
                ctx.scale(p, p);
                ctx.translate(-viewPosition[0], -viewPosition[1]);
            }
        });
        
        this.addRenderObject(stars);

        this.addObject(ship);

        const planets: Planet[] = [];

        for (let i = 0; i < 20; i++) {
            const planet = randomPlanet();
            this.addObject(planet);
            planets.push(planet);
        }

        const homePlanet = createHomePlanet();
        planets.push(homePlanet);
        this.addRenderObject(homePlanet);

        this.addRenderObject({
            render(ctx: CanvasRenderingContext2D) {
                ctx.restore();

                const limitX = roomSize[0] / 2 - border[0] / 2;
                const limitY = roomSize[1] / 2 - border[1] / 2;
                
                ctx.save();
                ctx.lineWidth = 5;
                planets.forEach(planet => {
                    const x = constrain(planet.center[0] - ship.position[0], -limitX, limitX);
                    const y = constrain(planet.center[1] - ship.position[1], -limitY, limitY);

                    const p = Math.min(Math.abs((canvas.width - 100) / x), Math.abs((canvas.height - 100) / y)) / 2;
                    const distance = Math.pow(x * x + y * y, 0.25);
                    const size = minmax(1, 50, 1000 / distance);
                    
                    ctx.strokeStyle = planet === homePlanet ? 'red' : 'white';
                    ctx.fillStyle = planet.color;
                    ctx.beginPath();
                    ctx.arc(canvas.width / 2 + x * p, canvas.height / 2 + y * p, size, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                });
                ctx.restore();
            }
        });

        this.addRenderObject(fuel);
        this.addRenderObject(food);

        let breaking = false;

        this.addKeyListener(Keys.SPACE, () => {
            if (ship.landed || ship.dead) {
                return;
            }
            breaking = true;

            const desiredDirection = direction(0, 0, -ship.speed[0], -ship.speed[1]);
            const deltaDirection = constrainDeltaAngle(desiredDirection - ship.direction);

            if (deltaDirection !== 0) {
                let turn = 0;
                const angularDirection = ship.angularSpeed > 0 ? 1 : -1;

                if (deltaDirection > 0 !== ship.angularSpeed > 0) {
                    turn = -angularDirection;
                } else {
                    const timeToStopRotation = angularDirection * ship.angularSpeed / Ship.STEER_ACCELERATION;

                    const timesToZeroDelta = bhaskara(
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

            if (squaredLength(ship.speed) > 0.01 && Math.abs(deltaDirection) < Math.PI / 4) {
                ship.accelerate(0.5);
            }
        });

        this.addKeyListener(Keys.UP, () => {
            if (!breaking) {
                ship.accelerate();
            }
        });
        
        this.addKeyListener(Keys.LEFT, () => {
            if (!breaking) {
                ship.steerLeft();
            }
        });
        
        this.addKeyListener(Keys.RIGHT, () => {
            if (!breaking) {
                ship.steerRight();
            }
        });

        this.addStepObject({
            preStep: () => {
                breaking = false;
                
                nextP(ship.position, 0, ship.speed);
                nextP(ship.position, 1, ship.speed);


                if (ship.landed) {
                    fuel.generate();
                    food.generate();
                } else {
                    food.consume();
                }

                if (fuel.value <= 0) {
                    this.onGameOver('out_of_fuel');
                }

                if (food.value <= 0) {
                    this.onGameOver('out_of_food');
                    ship.dead = true;
                }

                if (!ship.dead && !ship.landed) {
                    planets.forEach(planet => {
                        // gravity
                        const squaredDistanceShipPlanet = squaredDistance(ship.position, planet.center);

                        if (squaredDistanceShipPlanet < 9 * planet.squaredRadius) {
                            const directionShipPlanet = direction(ship.position[0], ship.position[1], planet.center[0], planet.center[1]);
                            ship.speed[0] += SPS * 20 * (planet.radius / 500) * Math.cos(directionShipPlanet) / squaredDistanceShipPlanet;
                            ship.speed[1] -= SPS * 20 * (planet.radius / 500) * Math.sin(directionShipPlanet) / squaredDistanceShipPlanet;
                        }
                        
                        if (squaredDistanceShipPlanet >= planet.squaredRadius + 200 * 200) {
                            return;
                        }
    
                        // collision
                        if (ship.transformedPolygon.intersectsWithCircle(planet)) {
                            const speedLimit = 100 / SPS;
                            const angleLimit = Math.PI / 20;
                            const speed = squaredLength(ship.speed);
                            const landingAngle = direction(planet.center[0], planet.center[1], ship.position[0], ship.position[1]);
                            const deltaAngle = Math.abs(constrainDeltaAngle(ship.direction - landingAngle));
                            if (speed < speedLimit && deltaAngle < angleLimit) {
                                ship.direction = landingAngle;
                                if (planet === homePlanet) {
                                    ship.dead = true;
                                    this.onGameOver('win');
                                } else {
                                    ship.landed = true;
                                }
                            } else {
                                ship.dead = true;
                                this.onGameOver('crashed');
                            }
                            breaking = false;
                            ship.speed = [0, 0];
                            ship.angularSpeed = 0;
                        }
                    });
                }
            },
            step: () => {
                stars.speed = ship.speed;

                viewPosition = [ship.position[0] - viewSize[0] / 2, ship.position[1] - viewSize[1] / 2];
            }
        });
    }
    
    start() {
        super.start(SPS);
    }
}