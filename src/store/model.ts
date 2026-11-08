import { Action, Computed, Thunk, action, computed, thunk } from "easy-peasy";

// const scoringFunctions = {
//     ones: (roll) => roll.filter((val) => val === 1).length * 1,
//     twos: (roll) => roll.filter((val) => val === 2).length * 2,
//     threes: (roll) => roll.filter((val) => val === 3).length * 3,
//     fours: (roll) => roll.filter((val) => val === 4).length * 4,
//     fives: (roll) => roll.filter((val) => val === 5).length * 5,
//     sixes: (roll) => roll.filter((val) => val === 6).length * 6,
//     threeOfAKind: (roll) => {
//       const counts = roll.reduce((acc, val) => {
//         acc[val] = acc[val] ? acc[val] + 1 : 1;
//         return acc;
//       }, {});
//       const three = Object.keys(counts).find((key) => counts[key] >= 3);
//       return three ? roll.reduce((acc, val) => acc + val, 0) : 0;
//     },
//     fourOfAKind: (roll) => {
//       const counts = roll.reduce((acc, val) => {
//         acc[val] = acc[val] ? acc[val] + 1 : 1;
//         return acc;
//       }, {});
//       const four = Object.keys(counts).find((key) => counts[key] >= 4);
//       return four ? roll.reduce((acc, val) => acc + val, 0) : 0;
//     },
//     fullHouse: (roll) => {
//       const counts = roll.reduce((acc, val) => {
//         acc[val] = acc[val] ? acc[val] + 1 : 1;
//         return acc;
//       }, {});
//       const three = Object.keys(counts).find((key) => counts[key] >= 3);
//       const two = Object.keys(counts).find((key) => counts[key] >= 2);
//       return three && two ? 25 : 0;
//     },
//     smallStraight: (roll) => {
//       const sorted = roll.sort();
//       const unique = [...new Set(sorted)];
//       const straights = [
//         [1, 2, 3, 4],
//         [2, 3, 4,    
type index = 0|1|2|3|4;
type Die = 1|2|3|4|5|6|null;
type Dice = [Die, Die, Die, Die, Die];
type Hold = [boolean, boolean, boolean, boolean, boolean];


interface Player
{
    id: number;
    name: string;
    scores?: number[];
    games?: number;
}

export interface PlayersModel {
    list: Player[];
    addPlayer: Action<PlayersModel, Player>;
    removePlayer: Action<PlayersModel, number>;
    resetAll: Action<PlayersModel>;
    getPlayer: Computed<PlayersModel, (id: number) => Player | undefined>;
    updatePlayer: Action<PlayersModel, {id:number, data: Partial<Player>}>;
    count: Computed<PlayersModel, number>;
}

export interface GameModel {
    round: number;
        turn: number;
        player: Player | null;
        roll: Dice|null[];
        hold: Hold|false[];
        started: Computed<GameModel, boolean>;
        ended: Computed<GameModel, boolean>;
        rollDice: Thunk<GameModel, Die[]>;
        setRoll: Action<GameModel, Dice>;
        canRoll: Computed<GameModel, boolean>;
        setHold: Action<GameModel, number>;
        resetRoll: Action<GameModel>;
        setTurn: Action<GameModel, number>;
        start: Action<GameModel>;

        // nextPlayer: Thunk<GameModel>;
        // setScore: Action<GameModel, {player: number, section: string, field: number, score: number}>;
        // currentPlayer: Computed<GameModel, Player>;
        // submitScore: Thunk<GameModel, {player: number, section: string, field: number, score: number}>;
        // score: {
        //     store: {player: number, section: string, field: number, score: number}[];
        //     setScore: Action<GameModel, {player: number, section: string, field: number, score: number}>;
        //     getPlayerScores: Thunk<GameModel, number, void, Promise<{player: number, section: string, field: number, score: number}[]>>;
        //     getScore: Thunk<GameModel, {player: number, field: number}, void, Promise<{player: number, section: string, field: number, score: number} | undefined>>;
        //     getTops: Thunk<GameModel, number, void, Promise<number[]>>;
        //     getTopTotal: Thunk<GameModel, number, void, Promise<number>>;
        //     getBonus: Thunk<GameModel, number, void, Promise<number>>;
        //     getTotal: Thunk<GameModel, number, void, Promise<number>>;
        //     getBottomTotal: Thunk<GameModel, number, void, Promise<number>>;
        // }
}


export interface StoreModel {
    global: {
        players: PlayersModel
        
    },
    game: GameModel
    start: Action<StoreModel>;
    
}

const PlayerBen: Player = {
    id: 1,
    name: "Ben",
}

const model: StoreModel = {
    global: {
        players: {
            list: [PlayerBen],
            addPlayer: action((state, payload) => {
                state.list.push(payload);
            }),
            removePlayer: action((state, payload) => {
                state.list.splice(payload, 1);
            }),
            resetAll: action((state) => {
                state.list = [];
            }),
            getPlayer: computed([state => state.list], (list) => (id: number) => list.find((i) => i.id === id)),        
            updatePlayer: action((state, payload) => {
                state.list[payload.id] = {
                    ...state.list[payload.id],
                    ...payload.data,
                };
            }),
            count: computed(state => state.list.length),
        },
    },
    game: {
        round: 0,
        turn: 0,
        player: null,
        roll: new Array(5).fill(null) as Dice,
        hold: new Array(5).fill(false) as Hold,
        started: computed(state => state.round > 0),
        ended: computed(state => state.round > 13),
        rollDice: thunk((actions, _payload, { getState }) => {
            const state = getState();
            const { turn, roll: die, hold } = state;
            const roll = die.map((val, i) => (hold[i] ? val : {index:i, value: Math.ceil(Math.random() * 6)})) as Dice;
            actions.setRoll(roll);
            actions.setTurn(turn + 1);
        }),
        setRoll: action((state, payload) => {
            state.roll = payload;
        }),
        canRoll: computed(state => (state.turn || 0) < 3),
        setHold: action((state, payload) => {
            if(state?.roll[payload]){
                state.hold[payload] = !state.hold[payload];
            }
        }),
        resetRoll: action((state) => {
            state.roll = new Array(5).fill(null) as Dice;
            state.hold = new Array(5).fill(false) as Hold;
        }),
        setTurn: action((state, payload) => {
            state.turn = payload;
        }),
        start: action((state) => {
            state.round = 1;
            state.turn = 0;
            //state.player = state.players.list[0];
        }),
        // nextPlayer: thunk((actions, payload, { getState } ) => {
        //     actions.resetRoll();
        //     actions.setTurn(0);
        //     actions.setPlayer(state.player === null ? 0 : (state.player + 1) % state.players.list.count);


            
        // }),
        // setScore: action((state, payload) => {
        //     state.players.list[state.player].scores[payload] = payload.score;
        // }),  
        // currentPlayer: computed(state => state.players.list[state.player]),

        // submitScore: thunk((actions, payload, { getState }) => {

        //     const { currentPlayer, player } = getState();
        //     const { score, section, field } = payload;
        //     //const score = scoringFunctions[payload](roll);
        //     actions.score.setScore({ player, section, field, score});
        //     actions.nextPlayer();
        // }),
        //  score: {
        //      store: [],
        //      setScore: action((state, payload) => {
        //          state.store.push(payload);
        //      }),
        //     getPlayerScores: thunk((actions, player, { getState }) => {
        //         return getState().store.filter((score) => score.player === player);
        //     }),
        //     getScore: thunk((actions, {player, field}, { getState }) => {
        //         return getState().store.find((score) => score.player === player && score.field === field);
        //     }),
        //     getTops: thunk((actions, player, { getState }) => {
        //         const scores = actions.getPlayerScores(player);
        //         const tops = [1, 2, 3, 4, 5, 6].map((top) => {
        //             const score = scores.find((score) => score.field === top);
        //             return score ? score.score : 0;
        //         });
        //         return tops;
        //     }),
        //     getTopTotal: thunk((actions, player, { getState }) => {
        //         const tops = actions.getTops(player);
        //         return tops.reduce((a, b) => a + b, 0);
        //     }),
        //     getBonus: thunk((actions, player, { getState }) => {
        //         const total = actions.getTopTotal(player);
        //         return total >= 63 ? 35 : 0;
        //     }),
        
        //     getTotal: thunk((actions, player, { getState }) => {
        //         return actions.getPlayerScores(player).reduce((a, b) => a + b.score, 0);
        //     }),
        //     getBottomTotal: thunk((actions, player, { getState }) => {
        //         const scores = actions.getPlayerScores(player);
        //         scores.filter((score) => score.section === "bottom");
        //         const bottoms = [7, 8, 9, 10, 11, 12, 13].map((bottom) => {
        //             const score = scores.find((score) => score.field === bottom);
        //             return score ? score.score : 0;
        //         });
        //         return bottoms.reduce((a, b) => a + b, 0);
        //     }),
           
        // }
        


    },
    score: {
        store: [],
        setScore: action((state, payload) => {
            state.store.push(payload);
        }),
    },
    getScore: computed(state => 
         (field: string) => {
            return state.score.store.find((score) => score.player === state.game.player && score.field === field);
        
    }),
    start: action((state) => {
        state.game.round = 1;
        state.game.turn = 0;
        state.game.player = state.global.players.list[0];
    })
  };

  export default model;
