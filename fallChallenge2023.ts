// * Interfaces *
interface Vector {
    x: number
    y: number
}

interface AltitudeRange {
    min: number,
    max: number
}

enum FishColor {
    MONSTER = -1,
    PINK = 0,
    YELLOW = 1,
    GREEN = 2,
    BLUE = 3
}

enum FishType {
    MONSTER = -1,
    OCTOPUS = 0,
    CLASSIC = 1,
    SHELL = 2
}

interface FishDetail {
    color: FishColor
    type: FishType
}

interface Fish {
    fishId: number
    pos: Vector
    speed: Vector
    detail: FishDetail
}

interface Drone {
    droneId: number
    pos: Vector
    dead: number
    battery: number
    scans: number[]
    lastTarget?: Vector
    numberOfScansToGoUp?: number
    fishTypeTargeted?: FishType | null
}

// Les valeurs du radars pour repérés les poissons
// NB: Si l'entité partage la même coordonnée x que le drone, elle sera considérée comme étant à
// gauche. Si l'entité partage la même coordonnée y que le drone, elle sera considérée comme étant
// en haut.
enum RadarValue {
    TL = "TL", // TOP LEFT
    TR = "TR", // TOP RIGHT
    BL = "BL", // BOTTOM LEFT
    BR = "BR", // BOTTOM RIGHT
}

interface RadarBlip {
    fishId: number
    dir: RadarValue
}



// * CONSTANTES *

const MAX_TURN = 200; // le nombre maximum de tour

const MAP_SIZE = 10000;
const ORIGIN = { x: 0, y: 0 }; // en haut à gauche
const SCAN_VALIDATION_ZONE = 499; // l'altitude en dessous de laquelle les scans sont validés

const SPEED_MAX_DRONE = 600; // un drone parcours une distance de 600u maximum par tour
const DROWNING_SPEED = 300; // la vitesse à laquelle le drone coule lorsque qu'on lui donne pas d'instruction
const URGENCE_MODE_DISTANCE = 500; // la distance en dessous de laquelle un drone passe en mode urgence au contact d'un monstre
const URGENCE_MODE_SPEED = 300; // la vitesse à laquelle le drone remonte à la surface en mode urgance

const BASE_LIGHT_RADIUS = 800; // le rayon lumineux de base constant du drone
const AUGMENTED_LIGHT_RADIUS = 2000; // le rayon lumineux augmenté du drone
const MONSTER_DETECTION_BONUS = 300; // la distance à partir de laquelle on peut repérer un monstre (à ajouter au rayon de la lumière)
const LIGHT_BATTERY_CAPACITY = 30; // la quantité d'énergie max dans les batteries de lumières
const AUGMENTED_LIGHT_CONSUMPTION = 5; // la quantité d'énergie consumé lorsqu'on allume les batteries
const AUGMENTED_LIGHT_RESTAURATION = 1; // la quantité d'énergie régénérée des batteries lorsque la lumière est éteinte

const FISH_BASE_SPEED = 200; // la distance parcouru par un poisson dans un tour
const FISH_FRIGHT_SPEED = 400; // la distance parcouru par un poisson dans un tour si il est effrayé
const DISTANCE_BOUNCE_FISH = 600; // la distance à laquelle un poisson fait demi-tour si il croise un autre poisson
const FRIGHT_DISTANCE = 1400; // la distance en dessous de laquelle un poisson est effrayé si le moteur du drone est activé
const MONSTER_ANGRY_SPEED = 540; // la distance parcouru par un monstre lorsqu'il est enragé
const MONSTER_GENTLE_SPEED = 270; // la distance parcouru par un monstre lorsqu'il est calme
const DISTANCE_BOUNCE_MONSTER = 600; // la distance à laquelle un monstre fait demi-tour si il croise un autre monstre
const FISH_TYPE_ALTITUDE: { [key in FishType]: AltitudeRange } = {
    [FishType.MONSTER]: { min: 2500, max: 10000 },
    [FishType.OCTOPUS]: { min: 2500, max: 5000 },
    [FishType.CLASSIC]: { min: 5000, max: 7500 },
    [FishType.SHELL]: { min: 7500, max: 10000 }
}

const FISH_TYPE_POINTS: { [key in FishType]: number } = {
    [FishType.MONSTER]: 0,
    [FishType.OCTOPUS]: 1,
    [FishType.CLASSIC]: 2,
    [FishType.SHELL]: 3
}
const ALL_FISH_SAME_COLOR = 3; // le nombre de points obtenu pour tous les poissons d'une meme couleur scannés
const ALL_FISH_SAME_TYPE = 4; // le nombre de points obtenu pour tous les poisson du meme type scannés


// * FONCTIONS UTILES *

const calcDistance: (vec1: Vector, vec2: Vector) => number = (vec1, vec2) => {
    return Math.round(Math.sqrt(Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2)))
}

const goToOppositeDirection: (diffX: number, diffY: number, altitude: number) => Vector = (diffX, diffY, altitude) => {
    return { x: diffX > 0 ? 9999 : 0, y: altitude >= 7500 ? 0 : diffY > 0 ? 9999 : 0 }
}

const getMoveFromRadar: (radar: RadarValue) => number[] = (radar) => {
    switch (radar) {
        case 'TL':
            return [0, 0]
        case 'TR':
            return [9999, 0]
        case 'BR':
            return [9999, 9999]
        case 'BL':
            return [0, 9999]
        default:
            return [5000, 5000]
    }
}

const getFishtypeTargeted: (position: Vector, previousFishTypeTargeted: FishType) => FishType | null = (position, previousFishTypeTargeted) => {
    if (previousFishTypeTargeted !== null) {
        if (previousFishTypeTargeted === FishType.SHELL && position.y > 8000) return null;
        else if (previousFishTypeTargeted < FishType.SHELL && position.y > 5000) return FishType.SHELL;
        else if (previousFishTypeTargeted < FishType.CLASSIC && position.y > 2500) return FishType.CLASSIC;
        else return previousFishTypeTargeted;
    }
    else return previousFishTypeTargeted;
}

const degToRadian: (angleInDeg: number) => number = (angleInDeg) => {
    return angleInDeg * 2 * Math.PI / 360;
}

const radToDeg: (angleInRad: number) => number = (angleInRad) => {
    return Math.round(angleInRad * 360 / (2 * Math.PI))
}

const isInboundPosition: (position: Vector) => boolean = ({ x, y }: Vector) => {
    if (x < 0 || x > 10000) return false;
    if (y < 0 || y > 10000) return false;
    return true;
}

// fonction pour calculer les potential next positions du drones en fonction de la position des monstres
const calcNextPositions: (position: Vector, monsters: Fish[], safeDistance: number) => Vector[] = (position: Vector, monsters: Fish[], safeDistance: number) => {
    let potentialNextPositions = [];
    for (let theta = 0; theta < 360; theta += 1) {
        const thetaRad = degToRadian(theta);
        const newPotentialPosition = { x: position.x + Math.round(Math.cos(thetaRad) * SPEED_MAX_DRONE), y: position.y + Math.round(Math.sin(thetaRad) * SPEED_MAX_DRONE) };
        if (isInboundPosition(newPotentialPosition)) {
            let isInASafePos = true;
            for (let monster of monsters) {
                const presentMonsterPosition = monster.pos;
                const futurMonsterPosition = { x: monster.pos.x + monster.speed.x, y: monster.pos.y + monster.speed.y }
                if (calcDistance(newPotentialPosition, presentMonsterPosition) < URGENCE_MODE_DISTANCE + safeDistance || calcDistance(newPotentialPosition, futurMonsterPosition) < URGENCE_MODE_DISTANCE + safeDistance) {
                    isInASafePos = false;
                    break;
                }
            }
            if (isInASafePos) {
                potentialNextPositions = potentialNextPositions.concat([newPotentialPosition]);
            }
        }
    }
    return potentialNextPositions;
}

// find closest available position to target
const findBetterNextPosition: (dronePosition: Vector, potentialNextPositions: Vector[], target: Vector) => Vector = (dronePosition: Vector, potentialNextPositions: Vector[], target: Vector) => {
    let dmin = 999999;
    let bestPos = dronePosition;
    for (let position of potentialNextPositions) {
        let tempDist = calcDistance(target, position);
        if (tempDist <= dmin) {
            dmin = tempDist;
            bestPos = { ...position };
        }
    }
    return bestPos;
}

// * Execution du programme: Initialisation *

const fishDetails = new Map<number, FishDetail>()
let monsterNumber = 0;

const fishCount = parseInt(readline())
for (let i = 0; i < fishCount; i++) {
    const [fishId, color, type] = readline().split(' ').map(Number)
    fishDetails.set(fishId, { color, type })
    if (type === FishType.MONSTER) monsterNumber += 1;
}

let droneInfo = []

// initialization
let myScans: number[] = []
let foeScans: number[] = []
let droneById = new Map<number, Drone>()
let myDrones: Drone[] = []
let foeDrones: Drone[] = []
let visibleFish: Fish[] = []
let myRadarBlips = new Map<number, RadarBlip[]>()

let myScore = parseInt(readline())
let foeScore = parseInt(readline())

let myScanCount = parseInt(readline())
for (let i = 0; i < myScanCount; i++) {
    const fishId = parseInt(readline())
    myScans.push(fishId)
}

let foeScanCount = parseInt(readline())
for (let i = 0; i < foeScanCount; i++) {
    const fishId = parseInt(readline())
    foeScans.push(fishId)
}

let myDroneCount = parseInt(readline())
for (let i = 0; i < myDroneCount; i++) {
    const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
    const pos = { x: droneX, y: droneY }
    const drone: Drone = { droneId, pos, dead, battery, scans: [], lastTarget: { x: 0, y: 0 }, numberOfScansToGoUp: i % 2 == 0 ? 2 : 3, fishTypeTargeted: FishType.OCTOPUS }
    droneById.set(droneId, drone)
    myDrones.push(drone)
    myRadarBlips.set(droneId, [])
}

let foeDroneCount = parseInt(readline())
for (let i = 0; i < foeDroneCount; i++) {
    const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
    const pos = { x: droneX, y: droneY }
    const drone = { droneId, pos, dead, battery, scans: [] }
    droneById.set(droneId, drone)
    foeDrones.push(drone)
}


let droneScanCount = parseInt(readline())
for (let i = 0; i < droneScanCount; i++) {
    const [droneId, fishId] = readline().split(' ').map(Number)
    droneById.get(droneId)!.scans.push(fishId)
}

let visibleFishCount = parseInt(readline())
for (let i = 0; i < visibleFishCount; i++) {
    const [fishId, fishX, fishY, fishVx, fishVy] = readline().split(' ').map(Number)
    const pos = { x: fishX, y: fishY }
    const speed = { x: fishVx, y: fishVy }
    visibleFish.push({ fishId, pos, speed, detail: fishDetails.get(fishId)! })
}

let myRadarBlipCount = parseInt(readline());
let fishesStillInGame = {};
for (let i = 0; i < myRadarBlipCount; i++) {
    const [_droneId, _fishId, dir] = readline().split(' ')
    const droneId = parseInt(_droneId)
    const fishId = parseInt(_fishId)
    if (dir in RadarValue) {
        myRadarBlips.get(droneId)!.push({ fishId, dir: dir as RadarValue })
    }
    fishesStillInGame[fishId] = true;
}


//  * Execution du programme:  game loop *
while (true) {
    // tous les scans non validés encore
    const scansToValidate = myDrones.reduce((scans, drone) => scans.concat(drone.scans), []);

    // we need to know if there are still fishes to scan while taking into account the fact that fishes leave the map
    const scannedFishesStillInGame = Object.keys(fishesStillInGame).filter(fishId => myScans.includes(parseInt(fishId)) || scansToValidate.includes(parseInt(fishId)));
    const creaturesLeftToScan = Object.keys(fishesStillInGame).length - (scannedFishesStillInGame.length + monsterNumber);

    const visibleMonsters = visibleFish.filter((fish => fish.detail.type === FishType.MONSTER));
    // on enleve des poissons visibles tous les monstres et les poissons déjà scannés (validés ou pas)
    const visibleUnscannedFish = visibleFish.filter(fish => fish.detail.type !== FishType.MONSTER && !myScans.includes(fish.fishId) && !scansToValidate.includes(fish.fishId));
    let alreadyPursuedFishes = []; // dans ce tableau on mettra les poissons déjà poursuivis

    for (const droneIndex in myDrones) {
        const drone = myDrones[droneIndex];
        const x = drone.pos.x
        const y = drone.pos.y

        const monstersSortedByClosest = visibleMonsters.sort((monsterA, monsterB) => calcDistance(drone.pos, monsterA.pos) - calcDistance(drone.pos, monsterB.pos));
        // we remove already scanned fish and unscanned fishes that are visible from other drones and monsters
        const radarBlipsWithoutMonsterOfRightType = myRadarBlips.get(drone.droneId)?.filter(blip => !myScans.includes(blip.fishId) && !alreadyPursuedFishes.includes(blip.fishId) && !visibleUnscannedFish.map(fish => fish.fishId).includes(blip.fishId) && fishDetails.get(blip.fishId)?.type !== FishType.MONSTER
            && (drone.fishTypeTargeted === null || fishDetails.get(blip.fishId)?.type === drone.fishTypeTargeted))

        let targetX = null;
        let targetY = null;
        let light = drone.pos.y >= 2500 ? 1 : 0; // no need to activate light too early
        let message = "Nothing to do so ... Surface";

        // target decision
        if ((drone.fishTypeTargeted === null && drone.scans.length >= drone.numberOfScansToGoUp) || creaturesLeftToScan <= 0) {
            targetX = x;
            targetY = 0;
            message = "Surface"
        }
        else if (radarBlipsWithoutMonsterOfRightType?.length > 0) {
            [targetX, targetY] = getMoveFromRadar(radarBlipsWithoutMonsterOfRightType[0].dir)
            message = `Radar ${radarBlipsWithoutMonsterOfRightType[0].fishId} ${radarBlipsWithoutMonsterOfRightType[0].dir} Type ${drone.fishTypeTargeted}`
            alreadyPursuedFishes.push(radarBlipsWithoutMonsterOfRightType[0].fishId);
        }


        // we log the selected move
        if (targetX !== null && targetY !== null && calcDistance({ x: targetX, y: targetY }, drone.pos) > 0) {
            let potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 150);
            if (potentialNextPositions.length < 1) {
                potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 100);
            }
            if (potentialNextPositions.length < 1) {
                potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 50);
            }
            const { x, y } = findBetterNextPosition(drone.pos, potentialNextPositions, { x: targetX, y: targetY },);
            myDrones[droneIndex] = { ...myDrones[droneIndex], lastTarget: { x: targetX, y: targetY } }
            console.log(`MOVE ${x} ${y} ${light} ${drone.droneId} ${message}`)
        } else {
            // if no specific target then go to surface since we don't have nothing to do
            let potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 150);
            if (potentialNextPositions.length < 1) {
                potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 100);
            }
            if (potentialNextPositions.length < 1) {
                potentialNextPositions = calcNextPositions(drone.pos, monstersSortedByClosest, 50);
            }
            const { x, y } = findBetterNextPosition(drone.pos, potentialNextPositions, { x: drone.pos.x, y: 0 },);
            myDrones[droneIndex] = { ...myDrones[droneIndex], lastTarget: { x: targetX, y: targetY } }
            console.log(`MOVE ${x} ${y} ${light} ${drone.droneId} ${message}`)
        }

    }

    myScans = []
    foeScans = []
    droneById = new Map<number, Drone>()
    foeDrones = []
    visibleFish = []
    myRadarBlips = new Map<number, RadarBlip[]>()

    myScore = parseInt(readline())
    foeScore = parseInt(readline())

    myScanCount = parseInt(readline())
    for (let i = 0; i < myScanCount; i++) {
        const fishId = parseInt(readline())
        myScans.push(fishId)
    }

    foeScanCount = parseInt(readline())
    for (let i = 0; i < foeScanCount; i++) {
        const fishId = parseInt(readline())
        foeScans.push(fishId)
    }

    myDroneCount = parseInt(readline())
    for (let i = 0; i < myDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
        const pos = { x: droneX, y: droneY }
        const previousDroneState = myDrones[i];
        const drone: Drone = { ...previousDroneState, droneId, pos, dead, battery, scans: [], fishTypeTargeted: getFishtypeTargeted(pos, previousDroneState.fishTypeTargeted) }
        droneById.set(droneId, drone)
        myDrones[i] = drone;
        myRadarBlips.set(droneId, [])
    }

    foeDroneCount = parseInt(readline())
    for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
        const pos = { x: droneX, y: droneY }
        const drone = { droneId, pos, dead, battery, scans: [] }
        droneById.set(droneId, drone)
        foeDrones.push(drone)
    }


    droneScanCount = parseInt(readline())
    for (let i = 0; i < droneScanCount; i++) {
        const [droneId, fishId] = readline().split(' ').map(Number)
        droneById.get(droneId)!.scans.push(fishId)
    }

    visibleFishCount = parseInt(readline())
    for (let i = 0; i < visibleFishCount; i++) {
        const [fishId, fishX, fishY, fishVx, fishVy] = readline().split(' ').map(Number)
        const pos = { x: fishX, y: fishY }
        const speed = { x: fishVx, y: fishVy }
        visibleFish.push({ fishId, pos, speed, detail: fishDetails.get(fishId)! })
    }

    myRadarBlipCount = parseInt(readline())
    fishesStillInGame = {};
    for (let i = 0; i < myRadarBlipCount; i++) {
        const [_droneId, _fishId, dir] = readline().split(' ')
        const droneId = parseInt(_droneId)
        const fishId = parseInt(_fishId)
        if (dir in RadarValue) {
            myRadarBlips.get(droneId)!.push({ fishId, dir: dir as RadarValue })
        }
        fishesStillInGame[fishId] = true;
    }


}