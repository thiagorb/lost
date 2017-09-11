module Lost {
    const SPS = 120;
    let viewSize: Vectorial.Vector2D = [2000, 2000];
    let viewPosition: Vectorial.Vector2D = [0, 0];
    const roomSize: Vectorial.Vector2D = [40000, 40000];
    const maxViewSize = 2000;
    const STARS = 1000;
    const MIN_Z = 0.1;
    const MAX_Z = 0.9;


    class RenderablePolygon extends Geometry.Polygon implements Game.Renderable, Game.Steppable {
        public color: string;
        public position: Vectorial.Vector2D = [0, 0];
        public direction = 0;
        public transformedPolygon: Geometry.Polygon;

        constructor(vertices: Vectorial.Matrix, color: string) {
            super(vertices);
            this.color = color;
            this.transformedPolygon = new Geometry.Polygon(Vectorial.Matrix.copy(this.vertices));
        }

        prepareContext(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.translate(this.position[0], this.position[1]);
            ctx.rotate(-this.direction);
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.vertices[0][0], this.vertices[0][1]);
            for (var i = 1; i < this.vertices.length; i++) {
                ctx.lineTo(this.vertices[i][0], this.vertices[i][1]);
            }
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
            var transform = Vectorial.Matrix.multiply(
                Vectorial.Matrix.rotate(this.direction),
                Vectorial.Matrix.translate(this.position[0], this.position[1]));
            Vectorial.Matrix.multiply(
                this.vertices,
                transform,
                this.transformedPolygon.vertices);
        }
        
        step() {
        }
    }
    
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

    class Ship extends RenderablePolygon {
        sprite: HTMLImageElement;
        public static readonly STEER_ACCELERATION = 0.05 / SPS;
        static readonly FireSpeed = 1 / SPS;
        
        fire: number;
        dead: boolean;
        landed: boolean;
        speed: Vectorial.Vector2D = [1, 0];
        angularSpeed: number = 0;

        constructor() {
            super(
                [
                    [-30, 7],
                    [-35, 26],
                    [-34, 32],
                    [-16, 35],
                    [-10, 30],
                    [0, 12],
                    [-35, 26],
                    [26, 8],
                    [-35, 0],
                    [26, -8],
                    [-35, -26],
                    [0, -12],
                    [-10, -30],
                    [-16, -35],
                    [-34, -32],
                    [-35, -26],
                    [-30, -7],
                ],
                "#F80"
            );

            this.sprite = new Image();
            this.sprite.src = './ship.svg';
            this.fire = 0;

            this.position = [roomSize[0] / 2, roomSize[1] / 2];
        }

        preStep() {
            this.fire = Math.max(0, this.fire - Ship.FireSpeed);
            if (this.dead) {
                return;
            }
            nextP(this.position, 0, this.speed);
            nextP(this.position, 1, this.speed);
            super.preStep();
            this.direction += this.angularSpeed;
            this.color = this.dead ? "#F00" : "#F80"
        }

        accelerate(factor = 1) {
            if (!this.dead) {
                this.fire = Math.min(1, this.fire + 2 * Ship.FireSpeed);
                this.landed = false;
                this.speed[0] += factor * 5 * Math.cos(this.direction) / SPS;
                this.speed[1] -= factor * 5 * Math.sin(this.direction) / SPS;
            }
        }
        
        steerLeft() {
            if (!this.landed && !this.dead) {
                this.angularSpeed += Ship.STEER_ACCELERATION;
            }
        }
                
        steerRight() {
            if (!this.landed && !this.dead) {
                this.angularSpeed -= Ship.STEER_ACCELERATION;
            }
        }

        draw(ctx: CanvasRenderingContext2D) {
            ctx.save();
            ctx.translate(-this.sprite.width / 2 + 7, 0);
            ctx.scale(25 * this.fire, 8);
            const gradient = ctx.createRadialGradient(0, 0, 0.4, 0, 0, 1);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, 'rgba(64, 64, 255, 0)');
            ctx.fillStyle = gradient;

            /*
            ctx.beginPath();
            ctx.rect(-100, -100, 200, 200);
            ctx.fill();
            */

            ctx.beginPath();
            ctx.arc(0, 0, 1, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
        }
    }

    class Planet extends RenderableCircle {
    }
    
    const border = [
        viewSize[0] / MIN_Z,
        viewSize[1] / MIN_Z
    ];

    const nextP = (position, coord, speed) => {
        position[coord] = (position[coord] + speed[coord] + roomSize[coord] - border[coord] - border[coord] / 2) % (roomSize[coord] - border[coord]) + border[coord] / 2;
    };

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

                    //p = 0.1; // to debug

                    var effectiveViewWidth = viewSize[0] * p;
                    var effectiveViewHeight = viewSize[1] * p;
                    ctx.setTransform(p, 0, 0, p, (this.canvas.width - effectiveViewWidth) / 2, (this.canvas.height - effectiveViewHeight) / 2);
                    ctx.translate(-viewPosition[0], -viewPosition[1]);
                }
            });
            
            this.addRenderObject(stars);

            console.log(stars);
            this.addObject(ship);

            const planet = new Planet([roomSize[0] / 2 + 1400, roomSize[1] / 2 + 1300], 500, "#55D");
            this.addObject(planet);

            let breaking = false;

            const constrain = (x: number, min: number, max: number) => {
                const delta = max - min;
                return (x - min - delta * Math.floor(x / delta)) % delta + min;
            };

            const constrainDeltaAngle = x => constrain(x, -Math.PI, Math.PI);

            const positionFormula = (initialPosition, initialSpeed, acceleration, time) =>
                initialPosition + initialSpeed * time + acceleration * time * time / 2;
            
            const isNegative = (n: number) => n < 0;

            /*
            const debug = {
                desiredDirection: 0,
                deltaDirection: 0
            };
            //*/
            
            this.addKeyListener(Game.Keys.SPACE, () => {
                if (ship.landed || ship.dead) {
                    return;
                }
                breaking = true;

                const desiredDirection = Geometry.direction(0, 0, -ship.speed[0], -ship.speed[1]);
                const deltaDirection = constrainDeltaAngle(desiredDirection - ship.direction);

                /*
                debug.deltaDirection = deltaDirection;
                debug.desiredDirection = desiredDirection;
                //*/

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

            /*
            this.addRenderObject({
                render(ctx: CanvasRenderingContext2D) {
                    ctx.save();
                    ctx.translate(ship.position[0], ship.position[1]);
                    
                    ctx.strokeStyle = "red";
                    ctx.moveTo(0, 0);
                    ctx.lineTo(70 * Math.cos(ship.direction), -70 * Math.sin(ship.direction));
                    ctx.stroke();

                    ctx.strokeStyle = "blue";
                    ctx.moveTo(0, 0);
                    ctx.lineTo(70 * ship.speed[0], 70 * ship.speed[1]);
                    ctx.stroke();

                    ctx.strokeStyle = "green";
                    ctx.moveTo(0, 0);
                    ctx.lineTo(70 * Math.cos(debug.desiredDirection), -70 * Math.sin(debug.desiredDirection));
                    ctx.stroke();

                    ctx.restore();
                }
            });
            //*/

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
    
    function rectangle(width: number, height: number, center?: boolean) {
        var halfWidth = center? width / 2 : 0;
        var halfHeight = center? height / 2 : 0;
        return [
            [-halfWidth, -halfHeight, 1],
            [width - halfWidth, - halfHeight, 1],
            [width - halfWidth, height - halfHeight, 1],
            [-halfWidth, height - halfHeight, 1]
        ];
    }
    
    function gear(tooth: number, teethWidth1: number, teethWidth2: number, teethHeight: number, scale: number) {
        var vertices = new Array<Array<number>>();
        for (var i = 0; i < tooth; i++) {
            var toothDegree = i * (Math.PI * 2 / tooth);
            var toothDegree90 = i * (Math.PI * 2 / tooth) + Math.PI / 2;
            var cos = Math.cos(toothDegree);
            var cos90 = Math.cos(toothDegree90);
            var sin = Math.sin(toothDegree);
            var sin90 = Math.sin(toothDegree90);
            vertices.push([scale * (cos * teethHeight - cos90 * teethWidth2), scale * (sin * teethHeight - sin90 * teethWidth2)]);
            vertices.push([scale * (cos - cos90 * teethWidth1), scale * (sin - sin90 * teethWidth1)]);
            vertices.push([scale * (cos + cos90 * teethWidth1), scale * (sin + sin90 * teethWidth1)]);
            vertices.push([scale * (cos * teethHeight + cos90 * teethWidth2), scale * (sin * teethHeight + sin90 * teethWidth2)]);
        }
        return vertices;
    }
    
    function circle(radius: number, steps: number) {
        var vertices = [];
        for (var i = 0; i < steps; i++) {
            vertices.push([Math.cos(Math.PI * 2 * i / steps) * radius, Math.sin(Math.PI * 2 * i / steps) * radius, 1]);
        }
        return vertices;
    }
}