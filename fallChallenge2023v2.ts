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
}

interface RadarBlip {
    fishId: number
    dir: string
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

// * Execution du programme: Initialisation *

const fishDetails = new Map<number, FishDetail>()

const fishCount = parseInt(readline())
for (let i = 0; i < fishCount; i++) {
    const [fishId, color, type] = readline().split(' ').map(Number)
    fishDetails.set(fishId, { color, type })
}

//  * Execution du programme:  game loop *
while (true) {
    const myScans: number[] = []
    const foeScans: number[] = []
    const droneById = new Map<number, Drone>()
    const myDrones: Drone[] = []
    const foeDrones: Drone[] = []
    const visibleFish: Fish[] = []
    const myRadarBlips = new Map<number, RadarBlip[]>()

    const myScore = parseInt(readline())
    const foeScore = parseInt(readline())

    const myScanCount = parseInt(readline())
    for (let i = 0; i < myScanCount; i++) {
        const fishId = parseInt(readline())
        myScans.push(fishId)
    }

    const foeScanCount = parseInt(readline())
    for (let i = 0; i < foeScanCount; i++) {
        const fishId = parseInt(readline())
        foeScans.push(fishId)
    }

    const myDroneCount = parseInt(readline())
    for (let i = 0; i < myDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
        const pos = { x: droneX, y: droneY }
        const drone = { droneId, pos, dead, battery, scans: [] }
        droneById.set(droneId, drone)
        myDrones.push(drone)
        myRadarBlips.set(droneId, [])
    }

    const foeDroneCount = parseInt(readline())
    for (let i = 0; i < foeDroneCount; i++) {
        const [droneId, droneX, droneY, dead, battery] = readline().split(' ').map(Number)
        const pos = { x: droneX, y: droneY }
        const drone = { droneId, pos, dead, battery, scans: [] }
        droneById.set(droneId, drone)
        foeDrones.push(drone)
    }


    const droneScanCount = parseInt(readline())
    for (let i = 0; i < droneScanCount; i++) {
        const [droneId, fishId] = readline().split(' ').map(Number)
        droneById.get(droneId)!.scans.push(fishId)
    }

    const visibleFishCount = parseInt(readline())
    for (let i = 0; i < visibleFishCount; i++) {
        const [fishId, fishX, fishY, fishVx, fishVy] = readline().split(' ').map(Number)
        const pos = { x: fishX, y: fishY }
        const speed = { x: fishVx, y: fishVy }
        visibleFish.push({ fishId, pos, speed, detail: fishDetails.get(fishId)! })
    }

    const myRadarBlipCount = parseInt(readline())
    for (let i = 0; i < myRadarBlipCount; i++) {
        const [_droneId, _fishId, dir] = readline().split(' ')
        const droneId = parseInt(_droneId)
        const fishId = parseInt(_fishId)
        myRadarBlips.get(droneId)!.push({ fishId, dir })
    }

    console.error(FISH_TYPE_ALTITUDE)

    for (const drone of myDrones) {
        const x = drone.pos.x
        const y = drone.pos.y
        // TODO: Implement logic on where to move here
        const targetX = 5000
        const targetY = 5000
        const light = 1

        console.log(`MOVE ${targetX} ${targetY} ${light}`)
    }
}