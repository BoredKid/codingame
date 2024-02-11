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
// compute a new power value according to the present power value and the thrust(the targetPower)
export const getNewPower = (targetPower, power) => {
    let safeThrust = targetPower;
    if (targetPower > ROCKET_MAX_POWER) safeThrust = 4;
    if (targetPower < 0) safeThrust = 0
    return Math.abs(safeThrust - power) < ROCKET_MAX_POWER_DIFF ? safeThrust : (safeThrust > power ? power + ROCKET_MAX_POWER_DIFF : power - ROCKET_MAX_POWER_DIFF)
}

export const getNewAngle = (rotation, angle) => {
    let safeRotation = rotation;
    if (rotation > ROCKET_MAX_ANGLE) safeRotation = ROCKET_MAX_ANGLE;
    if (rotation < -ROCKET_MAX_ANGLE) safeRotation = -ROCKET_MAX_ANGLE;
    return Math.abs(safeRotation - angle) <= ROCKET_MAX_DIFF_ANGLE ? safeRotation : (safeRotation > angle ? angle + ROCKET_MAX_DIFF_ANGLE : angle - ROCKET_MAX_DIFF_ANGLE)
}

export const findLandingZone = (land) => {
    for (let i = 1; i < land.length; i++) {
        const { x: x0, y: y0 } = land[i - 1];
        const { x: x1, y: y1 } = land[i]
        if (Math.abs(x0 - x1) > 999 && y0 === y1) {
            return { start: x0 + 100, end: x1 - 100, altitude: y0 }
        }
    }
}

export const calcAltitude = (x, x0, y0, x1, y1) => {
    return Math.floor((y1 * Math.abs(x - x0) + y0 * Math.abs(x1 - x)) / (Math.abs(x0 - x1)))
}

export const hasCrashedOutsideOfLandingZone = (land, x, y, landingZone) => {
    if (x >= landingZone.start && x <= landingZone.end) {
        return false;
    } else {
        // find where the altitude of the land where the rocket is
        let i = 0;
        while (i < land.length && x > land[i].x) {
            i += 1;
        }
        if (i === land.length) {
            // somethings wrong because the point is not on the map
            return true;
        } else {
            const { x: x0, y: y0 } = land[i - 1];
            const { x: x1, y: y1 } = land[i];
            return y < calcAltitude(x, x0, y0, x1, y1)
        }
    }
}

// we're not going to bother with with calculating distance from the closest point of the rocket for now
export const calcDistanceToLandingZone = (landingZone, x, y) => {
    const xLanding = Math.floor((landingZone.start + landingZone.end) / 2);
    return Math.floor(Math.sqrt(Math.pow(xLanding - x, 2) + Math.pow(landingZone.altitude - y, 2)))

}

// GENETIC ALGO
// GENETIC ALGO CONSTS
const POP = 20; // doit etre divisible par 5
const ADN = 40; // doit etre divisible par 2, nombre de tours contenus dans une solution
// TODO: generate random genes
const GENES = [
    { rotation: 0, thrust: 0 },
    { rotation: 0, thrust: 4 },
    { rotation: 90, thrust: 0 },
    { rotation: 90, thrust: 4 },
    { rotation: -90, thrust: 0 },
    { rotation: -90, thrust: 4 },
]
const GENERATIONS = 200;
const MUTATIONS_NUMBER = 200;

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

export const initPopulation = () => {
    let firstPopulation = [];

    for (i = 0; i < POP; i++) {
        firstPopulation[i] = Array(ADN).fill({}).map(() => GENES[Math.floor(Math.random() * GENES.length)])
    }

    return firstPopulation;
}

const evaluate = (land, landingZone, individual, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {
    let missionFailed = false;

    let [x, y, hSpeed, vSpeed, fuel, angle, power] = [firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower];

    for (let i = 0; i < ADN; i++) {

        const { newPower, newAngle, newFuel, newVSpeed, newHSpeed, newY, newX } = calcNextTurn(individual[i], x, y, hSpeed, vSpeed, fuel, angle, power);
        [x, y, hSpeed, vSpeed, fuel, angle, power] = [newX, newY, newHSpeed, newVSpeed, newFuel, newAngle, newPower];
        if (y <= landingZone.altitude && landingZone.start < x && x < landingZone.end) { // ship has landed
            break;
        }
        if (hasCrashedOutsideOfLandingZone(land, x, y, landingZone)) { // ship has crashed
            missionFailed = true;
            break;
        }

    }

    // if (missionFailed) {
    //     return -200;
    // } else
    if (!(y <= landingZone.altitude && landingZone.start < x && x < landingZone.end)) { // si on a pas atteri sur la zone
        let distanceFromLandingZone = calcDistanceToLandingZone(landingZone, x, y);
        const distancePenality = Math.round(distanceFromLandingZone);
        const velocityPenality = Math.round((Math.abs(vSpeed) + Math.abs(hSpeed)) * 2);
        return 1000 - (distancePenality + velocityPenality);
    } else if (Math.abs(hSpeed) > 20 || Math.abs(vSpeed) > 40 || angle !== 0) {
        const vSpeedPenalty = vSpeed;
        const hSpeedPenalty = Math.abs(hSpeed);
        const anglePenalty = Math.abs(angle);
        const penality = (-vSpeedPenalty) + hSpeedPenalty + anglePenalty;
        return 1000 - penality
    } else {
        return 1000;
    }


}

const tournament = (population, land, landingZone, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {
    let scores = []

    for (let j = 0; j < POP; j++) {
        scores[j] = evaluate(land, landingZone, population[j], firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower);
    }
    return scores;
}

const getNewPopulation = (population, scores) => {
    let sortedPopulation = population.map((individual, i) => ({ individual, score: scores[i] })).sort((a, b) => b.score - a.score);
    let sortedPopulationNoScore = sortedPopulation.map(member => member.individual);
    let fifthPop = POP / 5;
    let newPop = sortedPopulationNoScore.slice(0, fifthPop);
    for (let a = 0; a < fifthPop; a++) {
        let newIndividual1 = [];
        let newIndividual2 = [];
        for (let m = 0; m < ADN; m++) {
            if (m % 2 === 0) {
                newIndividual1[m] = sortedPopulationNoScore[a][m];
                newIndividual2[m] = sortedPopulationNoScore[a + 1][m];
            } else {
                newIndividual2[m] = sortedPopulationNoScore[a][m];
                newIndividual1[m] = sortedPopulationNoScore[a + 1][m];
            }
        }
        newPop = newPop.concat([newIndividual1, newIndividual2])
    }
    for (let b = 0; b < fifthPop; b++) {
        let newIndividual = [];
        for (let m = 0; m < ADN; m++) {
            if (m <= ADN / 2) {
                newIndividual[m] = sortedPopulationNoScore[b][m];
            } else {
                newIndividual[m] = sortedPopulationNoScore[b + 1][m];
            }
        }
        newPop = newPop.concat([newIndividual])
    }
    for (let c = 0; c < fifthPop; c++) {
        newPop = newPop.concat([Array(ADN).fill({}).map(() => GENES[Math.floor(Math.random() * GENES.length)])])
    }

    for (let m = 0; m < MUTATIONS_NUMBER; m++) {
        let i = Math.floor(Math.random() * POP);
        let g = Math.floor(Math.random() * ADN);
        newPop[i][g] = GENES[Math.floor(Math.random() * GENES.length)];
    } // mutations
    return newPop;
}

const geneticAlgorithm = (land, landingZone, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {

    let population = initPopulation();
    let bestScore = [];
    for (let g = 0; g < GENERATIONS; g++) {
        const scores = tournament(population, land, landingZone, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower)
        bestScore = scores;
        population = getNewPopulation(population, scores);
    }

    console.error(bestScore)
    return population[0][0]; // the best solution
}