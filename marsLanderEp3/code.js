// CONSTS
const ZONE_WIDTH = 7000;
const ZONE_HEIGHT = 3000;
const LANDING_ZONE_MIN_WIDTH = 1000;

const ROCKET_MAX_POWER = 4;
const ROCKET_MAX_ANGLE = 90; // in deg
const ROCKET_MAX_POWER_DIFF = 1;
const ROCKET_MAX_DIFF_ANGLE = 15;

const VERTICAL_LANDING_SPEED_MAX = 40;
const HORIZONTAL_LANDING_SPEED_MAX = 20;
const LANDING_ANGLE = 0;

const GRAVITY = 3.711;


const surfaceN = parseInt(readline()); // the number of points used to draw the surface of Mars.
let land = [];
for (let i = 0; i < surfaceN; i++) {
    var inputs = readline().split(' ');
    const landX = parseInt(inputs[0]); // X coordinate of a surface point. (0 to 6999)
    const landY = parseInt(inputs[1]); // Y coordinate of a surface point. By linking all the points together in a sequential fashion, you form the surface of Mars.
    land[i] = { x: landX, y: landY }
}

// game loop
while (true) {
    var inputs = readline().split(' ');
    const X = parseInt(inputs[0]);
    const Y = parseInt(inputs[1]);
    const hSpeed = parseInt(inputs[2]); // the horizontal speed (in m/s), can be negative.
    const vSpeed = parseInt(inputs[3]); // the vertical speed (in m/s), can be negative.
    const fuel = parseInt(inputs[4]); // the quantity of remaining fuel in liters.
    const rotate = parseInt(inputs[5]); // the rotation angle in degrees (-90 to 90).
    const power = parseInt(inputs[6]); // the thrust power (0 to 4).

    // Write an action using console.log()
    // To debug: console.error('Debug messages...');


    // rotate power. rotate is the desired rotation angle. power is the desired thrust power.
    console.log('-20 3');
}
