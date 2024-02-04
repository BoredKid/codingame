// PROBLEM CONSTS
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
export const getNewPower = (thrust, power) => {
    let safeThrust = thrust;
    if (thrust > ROCKET_MAX_POWER) safeThrust = 4;
    if (thrust < 0) safeThrust = 0
    return Math.abs(safeThrust - power) < ROCKET_MAX_POWER_DIFF ? safeThrust : (safeThrust > power ? power + ROCKET_MAX_POWER_DIFF : power - ROCKET_MAX_POWER_DIFF)
}

export const getNewAngle = (rotation, angle) => {
    let safeRotation = rotation;
    if (rotation > ROCKET_MAX_ANGLE) safeRotation = ROCKET_MAX_ANGLE;
    if (rotation < -ROCKET_MAX_ANGLE) safeRotation = -ROCKET_MAX_ANGLE;
    return Math.abs(safeRotation - angle) <= ROCKET_MAX_DIFF_ANGLE ? safeRotation : (safeRotation > angle ? angle + ROCKET_MAX_DIFF_ANGLE : angle - ROCKET_MAX_DIFF_ANGLE)
}

// GENETIC ALGO
// GENETIC ALGO CONSTS
const POP = 40; // doit etre divisible par 5
const ADN = 4; // doit etre divisible par 2
const GENES = [
    { rotation: 0, thrust: 0 },
    { rotation: 0, thrust: 4 },
    { rotation: 70, thrust: 0 },
    { rotation: 70, thrust: 4 },
    { rotation: -70, thrust: 0 },
    { rotation: -70, thrust: 4 },
]
const GENERATIONS = 200;

// this function calculate the parameters of next turn of the simulation
export const calcNextTurn = ({ rotation, thrust }, X, Y, hSpeed, vSpeed, fuel, angle, power) => {
    const newPower = getNewPower(thrust, power);
    const newAngle = getNewAngle(rotation, angle);
    const newFuel = fuel - newPower;
    const newVAccel = Math.cos(-newAngle * 2 * Math.PI / 360) * newPower - GRAVITY
    const newHAccel = Math.sin(-newAngle * 2 * Math.PI / 360) * newPower
    const newY = Math.round(Y + vSpeed + newVAccel / 2);
    const newX = Math.round(X + hSpeed + newHAccel / 2);
    const newVSpeed = Math.round(vSpeed + newVAccel);
    const newHSpeed = Math.round(hSpeed + newHAccel);

    return { newPower, newAngle, newFuel, newVSpeed, newHSpeed, newY, newX }
}