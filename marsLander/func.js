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

// GENETIC ALGO
// GENETIC ALGO CONSTS
const POP = 40; // doit etre divisible par 5
const ADN = 4; // doit etre divisible par 2, nombre de tours cotenu dans une solution
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

export const initPopulation = () => {
    let firstPopulation = [];

    for (i = 0; i < POP; i++) {
        firstPopulation[i] = Array(ADN).fill({}).map(() => GENES[Math.floor(Math.random() * GENES.length)])
    }

    return firstPopulation;
}

// TODO: end evaluate function and calcScore
const evaluate = (land, individual, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {
    let missionFailed = false;
    let [x, y, hSpeed, vSpeed, fuel, angle, power] = [firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower];

    for (let i = 0; i < ADN; i++) {
        // if (tryToAccelerateWithoutFuel(fuel, individual[i])) {
        //     missionFailed = true;
        //     break;
        // }
        const { newPower, newAngle, newFuel, newVSpeed, newHSpeed, newY, newX } = calcNextTurn(individual[i], x, y, hSpeed, vSpeed, fuel, angle, power);
        [x, y, hSpeed, vSpeed, fuel, angle, power] = [newX, newY, newHSpeed, newVSpeed, newFuel, newAngle, newPower];

        // if (hasCrashed(land, x, y)) {
        //     missionFailed = true;
        //     break;
        // }

    }

    if (missionFailed) return -50000
    else {
        // return calcScore(land, x, y, hSpeed, vSpeed, fuel, angle, power)
        return Math.floor(Math.random() * 10000)
    }


}

const tournament = (population, land, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {
    let scores = []

    for (let j = 0; j < POP; j++) {
        scores[j] = evaluate(land, population[j], firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower);
    }
    return scores;
}

const getNewPopulation = (population, scores) => {
    let sortedPopulation = population.map((individual, i) => ({ individual, score: scores[i] })).sort((a, b) => b.score - a.score);
    let sortedPopulationNoScore = sortedPopulation.map(member => member.individual);
    let newPop = sortedPopulationNoScore.slice(0, POP / 5);
    for (let a = 0; a < POP / 5; a++) {
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
    for (let b = 0; b < POP / 5; b++) {
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
    for (let c = 0; c < POP / 5; c++) {
        newPop = newPop.concat([Array(ADN).fill({}).map(() => GENES[Math.floor(Math.random() * GENES.length)])])
    }

    return newPop;
}

const geneticAlgorithm = (land, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower) => {
    let population = initPopulation();
    for (let g = 0; g < GENERATIONS; g++) {
        const scores = tournament(population, land, firstX, firstY, firstHSpeed, firstVSpeed, firstFuel, firstAngle, firstPower)
        population = getNewPopulation(population, scores);
    }

    return population[0][0]; // the best solution
}