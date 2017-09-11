import * as Vectorial from './Vectorial';

export const bhaskara = (a: number, b: number, c: number) => {
    const disc = b * b - 4 * a * c;
    if (disc <= 0) return [undefined, undefined];
    const sqrtdisc = Math.sqrt(disc);
    const _2a = (2 * a);
    return [(-b + sqrtdisc) / _2a, (-b - sqrtdisc) / _2a];
};

export class Segment {
    private x: number;
    private y: number;
    private a: number;
    private b: number;

    constructor(x1: number, y1: number, x2: number, y2: number) {
        this.x = x1;
        this.y = y1;
        this.a = x2 - x1;
        this.b = y2 - y1;
    }

    // Returns the factor used to multiply this segment coefficients, in order to get
    // the coordinates of the intersection of this segment with the other segment.
    intersectionFactor(other: Segment): number {
        return (other.a * (this.y - other.y) - other.b * (this.x - other.x)) / (other.b * this.a - this.b * other.a);
    }
    
    // Returns the factor used to multiply the other segment coefficients, in order to get
    // the coordinates of the intersection of this segment with the other segment.
    intersectionFactorOther(other: Segment, factor: number): number {
        if (other.a)
            return (this.x + this.a * factor - other.x) / other.a;
        else
            return (this.y + this.b * factor - other.y) / other.b;
    }

    // Returns true if this segment intersects the other segment.
    intersectsWith(other: Segment): boolean {
        var factor = this.intersectionFactor(other);
        if (factor < 0 || factor > 1) return false;
        var otherFactor = this.intersectionFactorOther(other, factor);
        return otherFactor >= 0 && otherFactor <= 1;
    }

    intersectsWithCircle(circle: Circle): boolean {
        const tx = this.x - circle.center[0];
        const ty = this.y - circle.center[1];
        
        const a = this.a * this.a + this.b * this.b;
        const b = 2 * (tx * this.a + ty * this.b);
        const c = tx * tx + ty * ty - circle.squaredRadius;

        const [t1, t2] = bhaskara(a, b, c);

        return ((0 <= t1 && t1 <= 1) || (0 <= t2 && t2 <= 1));
    }
}

export interface Shape {
    intersectsWithSegment(segment: Segment): boolean;

    intersectsWithPolygon(polygon: Polygon): boolean;

    intersectsWithCircle(circle: Circle): boolean;
}

export class Polygon implements Shape {
    vertices: Array<Array<number>>;

    constructor(vertices: Vectorial.Matrix) {
        this.vertices = [];
        for (var i = 0; i < vertices.length; i++) {
            this.vertices.push([vertices[i][0], vertices[i][1], 1]);
        }
    }

    intersectsWithSegment(segment: Segment): boolean {
        return this.anySegment(s => s.intersectsWith(segment));
    }

    intersectsWithPolygon(other: Polygon): boolean {
        return this.anySegment(s => other.intersectsWithSegment(s));
    }
    
    intersectsWithCircle(circle: Circle) {
        return this.anySegment(s => circle.intersectsWithSegment(s));
    }

    anySegment(callback: (s: Segment) => boolean): boolean {
        for (var i = 0; i < this.vertices.length; i++) {
            var i1 = (i + 1) % this.vertices.length;
            const s = new Segment(this.vertices[i][0], this.vertices[i][1], this.vertices[i1][0], this.vertices[i1][1]);
            if (callback(s)) return true;
        }
        return false;
    }
}

export const squaredDistance = (p1: Vectorial.Vector2D, p2: Vectorial.Vector2D) => {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return dx * dx + dy * dy;
}

export const direction = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.atan2(y1 - y2, x2 - x1);
};

export class Circle implements Shape {
    radius: number;
    center: Vectorial.Vector2D;
    squaredRadius: number;

    constructor(radius: number, center: Vectorial.Vector2D)
    {
        this.radius = radius;
        this.squaredRadius = radius * radius;
        this.center = center;
    }
    
    intersectsWithPolygon(polygon: Polygon) {
        return polygon.intersectsWithCircle(this);
    }

    intersectsWithCircle(circle: Circle) {
        const radiusSum = this.radius + circle.radius;
        return squaredDistance(this.center, circle.center) <= radiusSum * radiusSum;
    }
    
    intersectsWithSegment(segment: Segment) {
        return segment.intersectsWithCircle(this);
    }
}