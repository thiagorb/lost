import { Polygon } from "./Geometry";
import { Renderable, Steppable } from "./Game";
import { Vector2D, Matrix } from "./Vectorial";

export default class RenderablePolygon extends Polygon implements Renderable, Steppable {
    public color: string;
    public position: Vector2D = [0, 0];
    public direction = 0;
    public transformedPolygon: Polygon;

    constructor(vertices: Matrix, color: string) {
        super(vertices);
        this.color = color;
        this.transformedPolygon = new Polygon(Matrix.copy(this.vertices));
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
        var transform = Matrix.multiply(
            Matrix.rotate(this.direction),
            Matrix.translate(this.position[0], this.position[1]));
        Matrix.multiply(
            this.vertices,
            transform,
            this.transformedPolygon.vertices);
    }
    
    step() {
    }
}