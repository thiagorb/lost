import * as Vectorial from './Vectorial';
import * as Game from './Game';

class MapperStorage<T> {
    step: number;
    storage: T[];

    constructor(
        public readonly minValue: number, 
        public readonly maxValue: number, 
        public readonly length: number
    ) {
        this.storage = [];
        this.step = (maxValue - minValue) / length;
        console.log(this.length);
        
        for (let i = 0; i < length; i++) {
            this.storage.push(undefined);
        }
    }

    get(value: number) {
        const index = this.getIndex(value);

        return index !== null ? this.storage[index] : null;
    }

    getIndex(value: number): number {
        const index = (this.length * (value - this.minValue) / (this.maxValue - this.minValue)) | 0;
        return index;
    }

    getValue(index: number): number {
        return this.minValue + index * this.step;
    }

    setIndex(index: number, t: T) {
        if (index !== null) {
            this.storage[index] = t;
        }
    }
    
    forEachValue(callback: (value: number, index: number) => any) {
        for (let i = 0; i < this.length; i++) {
            callback(this.getValue(i), i);
        }
    }

    forEachItem(callback: (t: T, value: number) => any) {
        this.storage.forEach((layer, index) => callback(layer, this.getValue(index)));
    }
}

type Star = {0: number, 1: number, 2: number};

interface GameInfoProvider {
    getViewSize(): Vectorial.Vector2D;
    
    getViewPosition(): Vectorial.Vector2D;

    getRoomSize(): Vectorial.Vector2D;
}

export default class StarsManager implements Game.Renderable {
    private readonly layers = new MapperStorage<MapperStorage<MapperStorage<Array<Star>>>>(this.MIN_Z, this.MAX_Z, this.Z_LAYERS);
    private readonly projector = new Projector(this.gameInfoProvider);
    public speed: Vectorial.Vector2D = [0, 0];

    constructor(
        private readonly MIN_Z: number,
        private readonly MAX_Z: number,
        private readonly Z_LAYERS: number,
        private readonly STARS: number,
        private readonly gameInfoProvider: GameInfoProvider
    ) {
        this.layers.forEachValue((minZ, layerIndex) => {
            const layer = new MapperStorage<MapperStorage<Array<Star>>>(
                0, 
                this.gameInfoProvider.getRoomSize()[0],
                Math.round(this.gameInfoProvider.getRoomSize()[0] / (this.gameInfoProvider.getViewSize()[0] / minZ))
            );
            this.layers.setIndex(layerIndex, layer);

            layer.forEachValue((minX, quadrantIndex) => {
                const quadrant = new MapperStorage<Array<Star>>(
                    0, 
                    this.gameInfoProvider.getRoomSize()[1],
                    Math.round(this.gameInfoProvider.getRoomSize()[1] / (this.gameInfoProvider.getViewSize()[1] / minZ))
                );

                layer.setIndex(quadrantIndex, quadrant);

                quadrant.forEachValue((minY, starsIndex) => {
                    quadrant.setIndex(starsIndex, []);
                });
            });
        });

        for (let i = 0; i < this.STARS; i++) {
            const z = this.MIN_Z + Math.random() * (this.MAX_Z - this.MIN_Z);
            const layer = this.layers.get(z);
            const x = Math.random() * (this.gameInfoProvider.getRoomSize()[0] - this.gameInfoProvider.getViewSize()[0] / this.MIN_Z);
            const quadrant = layer.get(x);
            const y = Math.random() * (this.gameInfoProvider.getRoomSize()[1] - this.gameInfoProvider.getViewSize()[1] / this.MIN_Z);
            this.addStar(x, y, z);
        }
    }

    addStar(x: number, y: number, z: number) {
        const layer = this.layers.get(z);
        const quadrant = layer.get(x);

        if (x < this.gameInfoProvider.getViewSize()[0] / this.MIN_Z) {
            const newX = this.gameInfoProvider.getRoomSize()[0] - this.gameInfoProvider.getViewSize()[0] / this.MIN_Z + x;
            layer.get(newX).get(y).push([newX, y, z]);
        }

        if (y < this.gameInfoProvider.getViewSize()[1] / this.MIN_Z) {
            const newY = this.gameInfoProvider.getRoomSize()[1] - this.gameInfoProvider.getViewSize()[1] / this.MIN_Z + y;
            this.addStar(x, newY, z);
        }
        
        layer.get(x).get(y).push([x, y, z]);
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.strokeStyle = '#fff';
        ctx.lineCap = 'round';
        /*
        
        ctx.strokeStyle = '#f0f';
        ctx.strokeRect(
            0,
            0,
            this.gameInfoProvider.getRoomSize()[0], 
            this.gameInfoProvider.getRoomSize()[1]
        );

        ctx.strokeStyle = '#f00';
        ctx.strokeRect(
            this.gameInfoProvider.getViewPosition()[0],
            this.gameInfoProvider.getViewPosition()[1],
            this.gameInfoProvider.getViewSize()[0], 
            this.gameInfoProvider.getViewSize()[1]
        );

        ctx.strokeStyle = '#ff0';
        ctx.strokeRect(
            this.projector.fromX(0, this.MAX_Z),
            this.projector.fromY(0, this.MAX_Z),
            this.gameInfoProvider.getRoomSize()[0] * this.MAX_Z,
            this.gameInfoProvider.getRoomSize()[1] * this.MAX_Z
        );
        //*/
        this.layers.forEachItem((layer, minZ) => {
            this.iterateStorage(layer, 0, minZ, (quadrant, i) => {
                this.iterateStorage(quadrant, 1, minZ, (stars, j) => {
                    /*
                    ctx.strokeStyle = `rgb(${256 * minZ | 0}, ${256 * (1 - minZ) | 0}, 0)`;
                    ctx.strokeRect(
                        this.projector.fromX(layer.getValue(i), minZ),
                        this.projector.fromY(quadrant.getValue(j), minZ),
                        layer.step * minZ,
                        quadrant.step * minZ
                    );
                    //*/

                    stars.forEach(star => {
                        const z = star[2];
                        const x = this.projector.fromX(star[0], z);
                        const y = this.projector.fromY(star[1], z);
                        ctx.lineWidth = 10 * z;

                        //ctx.lineWidth = 100 * z; // to debug

                        ctx.beginPath();
                        ctx.moveTo(x, y);
                        ctx.lineTo(x - this.speed[0] * z, y - this.speed[1] * z);
                        ctx.stroke();
                    });
                });
            });
        });
        ctx.restore();
    }

    iterateStorage<T>(storage: MapperStorage<T>, coord: 0 | 1, z: number, callback: (t: T, i: number) => any)
    {
        let minI = this.normalizeIndex(storage, storage.getIndex(this.projector.to(coord, this.gameInfoProvider.getViewPosition()[coord], z)));
        let maxI = this.normalizeIndex(storage, storage.getIndex(this.projector.to(coord, this.gameInfoProvider.getViewPosition()[coord] + this.gameInfoProvider.getViewSize()[coord], z)));
        for (let i = minI; i <= maxI; i++) {
            callback(storage.storage[i], i);
        }
    }

    normalizeIndex<T>(storage: MapperStorage<T>, index: number) 
    {
        return Math.min(storage.storage.length - 1, Math.max(0, index));
    }
}

export class Projector
{
    constructor(private readonly gameInfoProvider: GameInfoProvider)
    {}

    from(i: 0 | 1, x: number, z: number)
    {
        return this.gameInfoProvider.getViewPosition()[i] + 
            this.gameInfoProvider.getViewSize()[i] / 2 + 
            (x - this.gameInfoProvider.getViewPosition()[i] - this.gameInfoProvider.getViewSize()[i] / 2) * z;
    }

    to(i: 0 | 1, x: number, z: number)
    {
        return this.from(i, x, 1 / z);
    }
    
    fromX(x: number, z: number)
    {
        return this.from(0, x, z);
    }

    fromY(x: number, z: number)
    {
        return this.from(1, x, z);
    }
    
    toX(x: number, z: number)
    {
        return this.to(0, x, z);
    }

    toY(x: number, z: number)
    {
        return this.to(1, x, z);
    }
}