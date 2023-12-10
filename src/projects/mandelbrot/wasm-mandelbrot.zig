// TODO: Add zig to build Pipeline maybe?
// Until then, build with: zig build-lib -target wasm32-freestanding -dynamic -O ReleaseFast wasm-mandelbrot.zig

const std = @import("std");

extern fn draw() void;

const MathPrecision = f64;

export const DIMS = extern struct { WIDTH: u32, HEIGHT: u32 }{
    .WIDTH = 512,
    .HEIGHT = 512,
};

const Mandelbrot = extern struct {
    limit: f64,
    x: f64,
    y: f64,
    z: f64,
    iterations: f64,
    imageData: [DIMS.WIDTH * DIMS.HEIGHT * 4]u8,

    export fn mandelbrot_calc(self: *@This(), x0: MathPrecision, y0: MathPrecision) @TypeOf(self.iterations) {
        var x1: MathPrecision = x0;
        var y1: MathPrecision = y0;
        var x2: MathPrecision = x1 * x1;
        var y2: MathPrecision = y1 * y1;
        var x1y1: MathPrecision = x1 + y1;
        var w: MathPrecision = x1y1 * x1y1;
        var i: usize = 0;
        const limit: usize = @intFromFloat(@ceil(self.iterations));
        return while (i < limit) : (i += 1) {
            x1 = x2 - y2 + x0;
            y1 = w - x2 - y2 + y0;
            x2 = x1 * x1;
            y2 = y1 * y1;
            x1y1 = x1 + y1;
            w = x1y1 * x1y1;
            if (@fabs(x1y1) > self.limit) {
                break @floatFromInt(i);
            }
        } else self.iterations;
    }

    export fn render(self: *@This()) void {
        const zoom: MathPrecision = 3 / self.z;
        const two_zoom: MathPrecision = zoom * 2;
        var xF: MathPrecision = undefined;
        var yF: MathPrecision = undefined;
        for (0..DIMS.WIDTH) |x| {
            xF = @floatFromInt(x);
            for (0..DIMS.HEIGHT) |y| {
                yF = @floatFromInt(y);
                const a: MathPrecision = xF / DIMS.WIDTH * two_zoom - zoom + self.x;
                const b: MathPrecision = yF / DIMS.HEIGHT * two_zoom - zoom + self.y;
                const mandelbrot_val = self.mandelbrot_calc(a, b);
                const mapped_mandel_val: u8 = @as(u8, @intFromFloat(mandelbrot_val / self.iterations * 255)) % 255;
                const index: usize = (y * DIMS.WIDTH + x) * 4;

                inline for (0..3) |i| {
                    self.imageData[index + i] = mapped_mandel_val;
                }
            }
        }
        draw();
    }
};

export const mandelbrot = Mandelbrot{
    .limit = 3,
    .x = 0,
    .y = 0,
    .z = 1,
    .iterations = 512,
    .imageData = [_]u8{ 0, 0, 0, 255 } ** (DIMS.WIDTH * DIMS.HEIGHT),
};
