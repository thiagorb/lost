import { Renderable, Steppable } from "./Game";
import { GameInfoProvider } from "./Lost";
import { SPS } from "./GlobalConstants";
import { Vector2D } from "./Vectorial";

export default class Resource implements Renderable {
    public value: number;

    constructor(
        private readonly name: string,
        private readonly consumptionRate: number,
        private readonly renderX: number,
        private readonly renderY: number,
        initialValue: number, 
        private readonly gameInfo: GameInfoProvider
    ) { 
        this.value = initialValue;
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.strokeStyle = '#FFF';
        ctx.strokeRect(this.renderX, this.renderY, 100, 20);
        ctx.fillStyle = '#0F0';
        ctx.fillRect(this.renderX + 2, this.renderY + 2, 96 * this.value, 16);
        ctx.strokeText(this.name, this.renderX, 55);
    }

    consume(factor = 1)
    {
        this.value = Math.max(0, this.value - factor * this.consumptionRate);
    }

    generate()
    {
        this.value = Math.min(1, this.value + 20 * this.consumptionRate);
    }
}