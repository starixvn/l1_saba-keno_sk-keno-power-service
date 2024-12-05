import { choices, choicesMapper } from "./constants";
import { getSettlementResult, generateResult } from "./helpers/result-helper";
import getBetLogsRepository from "./models/bet-logs";
import getBetRepository from "./models/bets";
import getRoundRepository from "./models/rounds";

export const hedgeBetGroups = [
    ["blue", "red"],
    ["big", "small"],
    ["even", "odd"],
    ["blueBig", "blueSmall"],
    ["redBig", "redSmall"],
];

export default [
    {
        id: 1509,
        name: "KenoPower1",
        durations: {
            wholeRound: 50,
            placingBets: 42,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
        hedgeBetGroups,
        repositories: {
            roundsRepository: getRoundRepository("kenopower1_phien"),
            betsRepository: getBetRepository("kenopower1_one"),
            betLogsRepository: getBetLogsRepository("kenopower1_cuoc"),
        },
        generateResult,
        settle: getSettlementResult,
    },
    {
        id: 1510,
        name: "KenoPower2",
        durations: {
            wholeRound: 54,
            placingBets: 42,
            lockingBet: 5,
        },
        choices,
        choicesMapper,
        defaultBetTracks: {},
        hedgeBetGroups,
        repositories: {
            roundsRepository: getRoundRepository("kenopower2_phien"),
            betsRepository: getBetRepository("kenopower2_one"),
            betLogsRepository: getBetLogsRepository("kenopower2_cuoc"),
        },
        generateResult,
        settle: getSettlementResult,
    },
];
