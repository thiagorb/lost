import { Polygon } from "./Geometry";
import * as Vectorial from './Vectorial';
import * as Game from './Game';

export default class RenderablePolygon extends Polygon implements Game.Renderable, Game.Steppable {
    public color: string;
    public position: Vectorial.Vector2D = [0, 0];
    public direction = 0;
    public transformedPolygon: Polygon;

    constructor(vertices: Vectorial.Matrix, color: string) {
        super(vertices);
        this.color = color;
        this.transformedPolygon = new Polygon(Vectorial.Matrix.copy(this.vertices));
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