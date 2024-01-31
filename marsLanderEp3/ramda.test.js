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

// utils
const getNewPower = (thrust, power) => {
    let safeThrust = thrust;
    if (thrust > ROCKET_MAX_POWER) safeThrust = 4;
    if (thrust < 0) safeThrust = 0
    return Math.abs(safeThrust - power) < ROCKET_MAX_POWER_DIFF ? safeThrust : (safeThrust > power ? power + ROCKET_MAX_POWER_DIFF : power - ROCKET_MAX_POWER_DIFF)
}

const getNewAngle = (rotation, angle) => {
    let safeRotation = rotation;
    if (rotation > ROCKET_MAX_ANGLE) safeRotation = ROCKET_MAX_ANGLE;
    if (rotation < -ROCKET_MAX_ANGLE) safeRotation = -ROCKET_MAX_ANGLE;
    return Math.abs(safeRotation - angle) <= ROCKET_MAX_DIFF_ANGLE ? safeRotation : (safeRotation > angle ? angle + ROCKET_MAX_DIFF_ANGLE : angle - ROCKET_MAX_DIFF_ANGLE)
}


const calcNextTurn = ({ rotation, thrust }, X, Y, hSpeed, vSpeed, fuel, angle, power) => {
    const newPower = getNewPower(thrust, power);
    const newAngle = getNewAngle(rotation, angle);
    const newFuel = fuel - newPower;
    const newVSpeed = vSpeed + Math.cos(newAngle * 2 * Math.PI / 360) * newPower - GRAVITY;
    const newHSpeed = hSpeed + Math.sin(-newAngle * 2 * Math.PI / 360) * newPower;
    const newY = Y + Math.round((newVSpeed + vSpeed) / 2)
    const newX = X + Math.round((newHSpeed + hSpeed) / 2)

    return { newPower, newAngle, newFuel, newVSpeed: Math.round(newVSpeed), newHSpeed: Math.round(newHSpeed), newY, newX }
}

console.log(calcNextTurn({ rotation: -45, thrust: 4 }, 5000, 2500, -50, 0, 1000, 90, 0))
console.log(calcNextTurn({ rotation: -45, thrust: 4 }, 4950, 2498, -51, -3, 999, 75, 1))