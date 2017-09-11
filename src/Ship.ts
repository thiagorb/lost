import RenderablePolygon from "./RenderablePolygon";
import { Vector2D } from "./Vectorial";
import { SPS } from "./GlobalConstants";

export class Ship extends RenderablePolygon {
    sprite: HTMLImageElement;
    public static readonly STEER_ACCELERATION = 0.05 / SPS;
    static readonly FireSpeed = 1 / SPS;
    
    fire: number;
    dead: boolean;
    landed: boolean;
    speed: Vector2D = [1, 0];
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
            "#C70"
        );

        this.sprite = new Image();
        this.sprite.src = './ship.svg';
        this.fire = 0;
    }

    preStep() {
        this.fire = Math.max(0, this.fire - Ship.FireSpeed);
        if (this.dead) {
            return;
        }
        super.preStep();
        this.direction += this.angularSpeed;
    }

    accelerate(factor = 1) {
        if (!this.dead) {
            this.fire = Math.min(factor, this.fire + 2 * Ship.FireSpeed);
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
        super.draw(ctx);
        ctx.save();
        ctx.translate(-this.sprite.width / 2 + 7, 0);
        ctx.scale(25 * this.fire, 8);
        const gradient = ctx.createRadialGradient(0, 0, 0.4, 0, 0, 1);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(1, 'rgba(64, 64, 255, 0)');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.arc(0, 0, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        ctx.drawImage(this.sprite, -this.sprite.width / 2, -this.sprite.height / 2);
    }
}