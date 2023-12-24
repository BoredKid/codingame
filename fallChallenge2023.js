/**
 * Score points by scanning valuable fish faster than your opponent.
 **/

// mes fonctions
const getMoveFromRadar = (radar) =>{
    switch (radar) {
        case 'TL':
          return [0,0]
        case 'TR':
            return [9999,0]
        case 'BR':
            return [9999,9999]
        case 'BL':
            return [0,9999]
        default:
          return [5000,5000]
      }
}

const goToOppositeDirection = (diffX, diffY)=>{
    return [diffX > 0 ? 9999 : 0, diffY > 0 ? 9999 : 0]
}

const calcDistance = (x1,y1,x2,y2) =>{
    return Math.round(Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2)))
}

// le programme

const creatureCount = parseInt(readline());
let allCreatures = {
}
for (let i = 0; i < creatureCount; i++) {
    var inputs = readline().split(' ');

    const creatureId = parseInt(inputs[0]);
    const color = parseInt(inputs[1]);
    const type = parseInt(inputs[2]);
    allCreatures[creatureId]={
        color,
        type
    }
}

// game loop
while (true) {
    const myScore = parseInt(readline());
    const foeScore = parseInt(readline());
    const myScanCount = parseInt(readline());
    let scannedCreatures =[];
    for (let i = 0; i < myScanCount; i++) {
        scannedCreatures[i] = parseInt(readline());

    }
    const foeScanCount = parseInt(readline());
    for (let i = 0; i < foeScanCount; i++) {
        const creatureId = parseInt(readline());
    }
    const myDroneCount = parseInt(readline());
    let drones ={
    }
    let myDrones=[];
    for (let i = 0; i < myDroneCount; i++) {
        var inputs = readline().split(' ');
        const droneId = parseInt(inputs[0]);
        const droneX = parseInt(inputs[1]);
        const droneY = parseInt(inputs[2]);
        const emergency = parseInt(inputs[3]);
        const battery = parseInt(inputs[4]);
        drones[droneId]={droneX,droneY,scanToValidate:[]}
        myDrones=myDrones.concat([droneId])
    }
    const foeDroneCount = parseInt(readline());
    for (let i = 0; i < foeDroneCount; i++) {
        var inputs = readline().split(' ');
        const droneId = parseInt(inputs[0]);
        const droneX = parseInt(inputs[1]);
        const droneY = parseInt(inputs[2]);
        const emergency = parseInt(inputs[3]);
        const battery = parseInt(inputs[4]);
        drones[droneId]={droneX,droneY,scanToValidate:[]}
    }
    const droneScanCount = parseInt(readline());
    for (let i = 0; i < droneScanCount; i++) {
        var inputs = readline().split(' ');
        const droneId = parseInt(inputs[0]);
       
        const creatureId = parseInt(inputs[1]);
        drones[droneId].scanToValidate=drones[droneId].scanToValidate.concat([creatureId]);
    }

    // we add the unvalidated scans to the scanned creatures to remove them from the targets
    for(droneId of myDrones){
        scannedCreatures = scannedCreatures.concat(drones[droneId].scanToValidate)
    }
    const visibleCreatureCount = parseInt(readline());
    let creaturesToSee = [];
    let monsters = [];
    for (let i = 0; i < visibleCreatureCount; i++) {
        var inputs = readline().split(' ');
        const creatureId = parseInt(inputs[0]);
        const creatureX = parseInt(inputs[1]);
        const creatureY = parseInt(inputs[2]);
        const creatureVx = parseInt(inputs[3]);
        const creatureVy = parseInt(inputs[4]);
        if(allCreatures[creatureId].type===-1){
            monsters=monsters.concat([{creatureX, creatureY}])
        } else if( !scannedCreatures.includes(creatureId)){
            creaturesToSee = creaturesToSee.concat([[creatureX, creatureY]])
        }
    }
    const radarBlipCount = parseInt(readline());
    let numberOfNotDiscoveredCreatures = radarBlipCount;
    let radarAlreadySet = [] // to check if a submarine is already running to this creature
    for (let i = 0; i < radarBlipCount; i++) {
        var inputs = readline().split(' ');
        const droneId = parseInt(inputs[0]);
        const creatureId = parseInt(inputs[1]);
        const radar = inputs[2];
        if(scannedCreatures.includes(creatureId)){
            numberOfNotDiscoveredCreatures= numberOfNotDiscoveredCreatures-1;
        }
        else if(!scannedCreatures.includes(creatureId) && !drones[droneId].radar && !radarAlreadySet.includes(creatureId)){
            radarAlreadySet=radarAlreadySet.concat([creatureId])
            drones[droneId].radar=radar
        }
    }

    console.error(myDrones)
    const totalScanToValidate = myDrones.reduce((somme,id) => {
        console.error(id.toString(),drones[id.toString()])
        return somme+drones[id.toString()].scanToValidate.length
    }
        , 0)
    for (let i = 0; i < myDroneCount; i++) {
        const presentDroneId = myDrones[i];
        const presentDrone = drones[presentDroneId];
        const sortedMonsters = monsters.sort((monsterA, monsterB) => calcDistance(presentDrone.droneX,presentDrone.droneY, monsterA.creatureX, monsterA.creatureY)-calcDistance(presentDrone.droneX,presentDrone.droneY, monsterB.creatureX, monsterB.creatureY));
        console.error(sortedMonsters, monsters)
        let light = "1"
        if(sortedMonsters.length > 0 && calcDistance(presentDrone.droneX,presentDrone.droneY, sortedMonsters[0].creatureX, sortedMonsters[0].creatureY)<=2000){
            light="0"
        }
        // precaution against monsters
        // 729
        if(sortedMonsters.length > 0 && calcDistance(presentDrone.droneX,presentDrone.droneY, sortedMonsters[0].creatureX, sortedMonsters[0].creatureY)<=1500){
            const recommendedDirection = goToOppositeDirection(presentDrone.droneX-sortedMonsters[0].creatureX,presentDrone.droneY-sortedMonsters[0].creatureY);
             console.log(`MOVE ${recommendedDirection[0]} ${recommendedDirection[1]} 0 Faut fuir là ...`)
        }
         // trying to find thos creatures

        else if(presentDrone.scanToValidate.length >= 3 || totalScanToValidate >= numberOfNotDiscoveredCreatures) console.log(`MOVE ${presentDrone.droneX} 0 ${light} Obj: Surface`);
        else if(creaturesToSee.length>0) console.log(`MOVE ${creaturesToSee[0][0]} ${creaturesToSee[0][1]} ${light} Obj:${creaturesToSee[0][0]} ${creaturesToSee[0][1]}`);         // MOVE <x> <y> <light (1|0)> | WAIT <light (1|0)>
        else if(drones[presentDroneId].radar) {
            const radarMove = getMoveFromRadar(presentDrone.radar);
            console.log(`MOVE ${radarMove[0]} ${radarMove[1]} 0 Radar:${drones[presentDroneId].radar}`);  
        }
        else console.log("WAIT 0")
    }
}
