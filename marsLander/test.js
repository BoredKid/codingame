import { calcNextTurn } from "./func.js";

test('calcNextTurn', () => {
    const firstTurnOutput = { "newPower": 1, "newAngle": 75, "newFuel": 999, "newVSpeed": -3, "newHSpeed": -51, "newY": 2498, "newX": 4950 }
    expect(calcNextTurn({ rotation: -45, thrust: 4 }, 5000, 2500, -50, 0, 1000, 90, 0)).toEqual(firstTurnOutput)
    const secondTurnOutput = { "newPower": 2, "newAngle": 60, "newFuel": 997, "newVSpeed": -6, "newHSpeed": -53, "newY": 2494, "newX": 4898 };
    expect(calcNextTurn({ rotation: -45, thrust: 4 }, 4950, 2498, -51, -3, 999, 75, 1)).toEqual(secondTurnOutput)
})