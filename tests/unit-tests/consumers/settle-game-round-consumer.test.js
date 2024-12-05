import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { Core } from "sc-game-base";
import { choices, choicesMapper } from "../../../src/constants";
import { RoundResultPublisher } from "../../../src/publishers/round-result-publisher";
import { SettleGameRoundConsumer } from "../../../src/consumers/settle-game-round-consumer";
import { decrypt } from "../../../src/helpers/crypto-helper";
import { sumArrayNumber } from "../../../src/helpers/array-helper";

jest.mock("../../../src/helpers/crypto-helper");
jest.mock("../../../src/helpers/array-helper");

const gameData = new Core.GameData(30);

gameData.gameConfigs = {
    enabled: true,
    minbet: 1,
    maxbet: 1000,
    choices_maxbet: {
        blue: 1000,
        red: 1000,
    },
    odds: {
        blue: 1.96,
        red: 1.96,
        big: 1.96,
        small: 1.96,
        odd: 1.96,
        even: 1.96,
        blueBig: 1.96,
        blueSmall: 1.96,
        redBig: 1.96,
        redSmall: 1.96,
    },
    enableFreeBet: false,
};
const definition = {
    id: 1509,
    name: "KenoPower",
    durations: {
        wholeRound: 50,
        placingBets: 37,
        lockingBet: 5,
    },
    choices,
    choicesMapper,
    defaultBetTracks: {},
};

/** @type {mongoose.Model}*/
const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

/** @type {RoundResultPublisher}*/
const roundResultPublisher = stub(RoundResultPublisher);

/** @type {Core.BaseEventPublishers.UserBetResultPublisher}*/
const userBetResultPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);

/** @type {mongoose.Model}*/
const betsRepository = stubMongooseModelStupidly(mongoose.Model);

describe("settle game round consumer instance", () => {
    it("should instance of Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
        // act
        const consumer = new SettleGameRoundConsumer({
            definition: definition,
            gameData: gameData,
        });

        // assert
        expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer).toBeTruthy();
    });

    describe("calculateBetResult tests", () => {
        const testCases = [
            {
                settlementResult: {
                    blue: true,
                    red: false,
                    tie: false,
                    big: false,
                    small: true,
                    odd: true,
                    even: false,
                    blueBig: false,
                    blueSmall: true,
                    redBig: false,
                    redSmall: true,
                },
                bet: { blue: 100 },
                expectResult: {
                    totalBetAmount: 100,
                    totalWin: 196,
                    netWin: 96,
                    totalLost: 0,
                    refund: 0,
                    winningByChoices: {
                        blue: 196,
                    },
                },
            },
            {
                settlementResult: {
                    blue: false,
                    red: false,
                    tie: true,
                    big: false,
                    small: true,
                    odd: true,
                    even: false,
                    blueBig: false,
                    blueSmall: true,
                    redBig: false,
                    redSmall: true,
                },
                bet: { blue: 100 },
                expectResult: {
                    totalBetAmount: 100,
                    totalWin: 100,
                    netWin: 0,
                    totalLost: 0,
                    refund: 100,
                    winningByChoices: {
                        blue: 100,
                    },
                },
            },
        ];

        it.each(testCases)("should return correct result", ({ settlementResult, bet, expectResult }) => {
            // arrange
            const consumer = new SettleGameRoundConsumer({
                definition: definition,
                gameData: gameData,
                roundResultPublisher: roundResultPublisher,
                userBetResultPublisher: userBetResultPublisher,
                roundsRepository: roundsRepository,
                betsRepository: betsRepository,
            });

            // act
            const actualResult = consumer.calculateBetResult(settlementResult, bet, gameData.gameConfigs.odds);

            // assert
            expect(actualResult).toEqual(expectResult);
        });
    });

    describe("settleRound tests", () => {
        const roundId = 123;
        describe("when round can not be found", () => {
            beforeEach(() => {
                roundsRepository.findOne({ id: roundId }).lean().exec.mockReturnValueOnce(null);
            });

            it("should not call settleBets", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.gameData.roundId = roundId;
                consumer.settleBets = jest.fn();

                // act
                await consumer.settleRound();

                // assert
                expect(consumer.settleBets).not.toHaveBeenCalled();
            });

            it("should not call update round repository", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.gameData.roundId = roundId;

                // act
                await consumer.settleRound();

                // assert
                expect(roundsRepository.updateOne).not.toHaveBeenCalled();
            });
        });

        describe("when exist round", () => {
            const round = { id: roundId, encryptedResult: { content: "asd" } };
            beforeEach(() => {
                roundsRepository.findOne({ id: roundId }).lean().exec.mockReturnValueOnce(round);
            });

            it("should call decrypt with expected param", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.gameData.roundId = roundId;
                consumer.definition.settle = jest.fn();
                consumer.settleBets = jest.fn();
                sumArrayNumber.mockReturnValue(0);
                decrypt.mockReturnValue(JSON.stringify({}));

                // act
                await consumer.settleRound();

                // assert
                expect(decrypt).toHaveBeenCalledWith(round.encryptedResult);
            });

            it("should call sumArrayNumber", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                const result = { blue: [10, 60], red: [10, 70] };
                decrypt.mockReturnValueOnce(JSON.stringify(result));
                sumArrayNumber.mockReturnValue(0);
                consumer.gameData.roundId = roundId;
                consumer.definition.settle = jest.fn();
                consumer.settleBets = jest.fn();

                // act
                await consumer.settleRound();

                // assert
                expect(sumArrayNumber).toHaveBeenCalledTimes(2);
            });

            it("should call get settlementResult with expected param", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                const result = { blue: [10, 60], red: [10, 70] };
                decrypt.mockReturnValueOnce(JSON.stringify(result));
                sumArrayNumber.mockReturnValueOnce(70).mockReturnValueOnce(80);
                consumer.gameData.roundId = roundId;
                consumer.definition.settle = jest.fn();
                consumer.settleBets = jest.fn();

                // act
                await consumer.settleRound();

                // assert
                expect(consumer.definition.settle).toHaveBeenCalledWith({ totalBlue: 70, totalRed: 80 }, true);
            });

            it("should call settleBets", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                const result = { blue: [10, 60], red: [10, 70] };
                decrypt.mockReturnValueOnce(JSON.stringify(result));
                sumArrayNumber.mockReturnValueOnce(70).mockReturnValueOnce(80);
                const settlementResult = { red: true, blue: false };
                consumer.gameData.roundId = roundId;
                consumer.definition.settle = jest.fn({ totalBlue: 70, totalRed: 80 }, true).mockReturnValue(settlementResult);
                consumer.settleBets = jest.fn();

                // act
                await consumer.settleRound();

                // assert
                expect(consumer.settleBets).toHaveBeenCalledWith({ ...round, result, settlementResult });
            });

            it("should update round", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                const result = { blue: [10, 60], red: [10, 70] };
                decrypt.mockReturnValueOnce(JSON.stringify(result));
                sumArrayNumber.mockReturnValueOnce(70).mockReturnValueOnce(80);
                const settlementResult = { red: true, blue: false };
                consumer.gameData.roundId = roundId;
                consumer.definition.settle = jest.fn({ totalBlue: 70, totalRed: 80 }, true).mockReturnValue(settlementResult);
                consumer.settleBets = jest.fn();

                // act
                await consumer.settleRound();

                // assert
                expect(roundsRepository.updateOne).toHaveBeenCalledWith({ id: round.id }, { settled: true, result, settlementResult });
            });
        });
    });

    describe("settleBets tests", () => {
        const round = {
            id: 123,
            result: { red: [10, 60], blue: [10, 50] },
            settlementResult: { red: true, blue: false },
            time: new Date(123456),
            resultKey: { content: "asd" },
        };

        it("should always call query bets", async () => {
            // arrange
            const consumer = new SettleGameRoundConsumer({
                definition: definition,
                gameData: gameData,
                roundResultPublisher: roundResultPublisher,
                userBetResultPublisher: userBetResultPublisher,
                roundsRepository: roundsRepository,
                betsRepository: betsRepository,
            });
            consumer.queryBets = jest.fn();

            // act
            await consumer.settleBets(round);

            // assert
            expect(consumer.queryBets).toHaveBeenCalledWith(round.id);
        });

        describe("when not bets", () => {
            it("should not call endGame", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue([]);
                consumer.callEndGame = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(consumer.callEndGame).not.toHaveBeenCalled();
            });

            it("should call decrypt with expected param", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue([]);

                // act
                await consumer.settleBets(round);

                // assert
                expect(decrypt).toHaveBeenCalledWith(round.resultKey);
            });

            it("should publish round result", async () => {
                // arrange
                const roundPublisher = stub(RoundResultPublisher);
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue([]);
                decrypt.mockReturnValue("resultKey");

                // act
                await consumer.settleBets(round);

                // assert
                expect(roundPublisher.publishRoundResult).toHaveBeenCalledWith({
                    result: round.result,
                    settlementResult: round.settlementResult,
                    resultKey: "resultKey",
                    roundId: round.id,
                });
            });
        });

        describe("when exist bets", () => {
            const baseBets = [
                { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
            ];
            it("should call calculateBetResult", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest.fn().mockReturnValue({ totalWin: 0, refund: 0 });
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(consumer.calculateBetResult).toHaveBeenCalledTimes(baseBets.length);
                expect(consumer.calculateBetResult).toHaveBeenCalledWith(round.settlementResult, baseBets[0], gameData.gameConfigs.odds);
                expect(consumer.calculateBetResult).toHaveBeenCalledWith(round.settlementResult, baseBets[1], gameData.gameConfigs.odds);
            });

            describe("update bets", () => {
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });

                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                beforeEach(() => {
                    consumer.calculateBetResult = jest
                        .fn()
                        .mockReturnValueOnce({ totalWin: 10, refund: 0 })
                        .mockReturnValueOnce({ totalWin: 0, refund: 0 });
                });
                it("should update betwin", async () => {
                    // arrange
                    const bets = [
                        { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                        { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
                    ];
                    consumer.queryBets = jest.fn(round.id).mockReturnValue(bets);

                    // act
                    await consumer.settleBets(round);

                    // assert
                    expect(bets[0].betwin).toBe(10);
                    expect(bets[1].betwin).toBe(0);
                });

                it("should update refund", async () => {
                    // arrange
                    const bets = [
                        { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                        { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
                    ];
                    consumer.queryBets = jest.fn(round.id).mockReturnValue(bets);

                    // act
                    await consumer.settleBets(round);

                    // assert
                    expect(bets[0].refund).toBe(0);
                    expect(bets[1].refund).toBe(0);
                });

                it("should update paid", async () => {
                    // arrange
                    const bets = [
                        { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                        { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
                    ];
                    consumer.queryBets = jest.fn(round.id).mockReturnValue(bets);

                    // act
                    await consumer.settleBets(round);

                    // assert
                    expect(bets[0].paid).toBeTrue();
                    expect(bets[1].paid).toBeTrue();
                });

                it("should call save", async () => {
                    // arrange
                    const bets = [
                        { uid: 1, rate: { VND: 1000 }, paid: false, save: jest.fn(), red: 10 },
                        { uid: 2, rate: { VND: 1000 }, paid: false, save: jest.fn(), blue: 10 },
                    ];
                    consumer.queryBets = jest.fn(round.id).mockReturnValue(bets);

                    // act
                    await consumer.settleBets(round);

                    // assert
                    expect(bets[0].save).toHaveBeenCalled();
                    expect(bets[1].save).toHaveBeenCalled();
                });
            });

            it("should call endGame", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest
                    .fn()
                    .mockReturnValueOnce({ totalWin: 10, refund: 0 })
                    .mockReturnValueOnce({ totalWin: 0, refund: 10 });
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(consumer.callEndGame).toHaveBeenCalledTimes(baseBets.length);
                expect(consumer.callEndGame).toHaveBeenCalledWith(baseBets[0], round.id, round.time, { totalWin: 10, refund: 0 });
                expect(consumer.callEndGame).toHaveBeenCalledWith(baseBets[1], round.id, round.time, { totalWin: 0, refund: 10 });
            });

            it("should call captureBetResult", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest
                    .fn()
                    .mockReturnValueOnce({ totalWin: 10, refund: 0 })
                    .mockReturnValueOnce({ totalWin: 0, refund: 0 });
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(consumer.captureBetResult).toHaveBeenCalledTimes(baseBets.length);
                expect(consumer.captureBetResult).toHaveBeenCalledWith(baseBets[0].uid, { totalWin: 10, refund: 0 }, baseBets[0].rate);
                expect(consumer.captureBetResult).toHaveBeenCalledWith(baseBets[1].uid, { totalWin: 0, refund: 0 }, baseBets[1].rate);
            });

            it("should publish to user bet result", async () => {
                // arrange
                const userPublisher = stub(Core.BaseEventPublishers.UserBetResultPublisher);
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest
                    .fn()
                    .mockReturnValueOnce({ totalWin: 10, refund: 0 })
                    .mockReturnValueOnce({ totalWin: 0, refund: 0 });
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(userPublisher.publish).toHaveBeenCalledTimes(baseBets.length);
                expect(userPublisher.publish).toHaveBeenCalledWith(baseBets[0].uid, { totalWin: 10, refund: 0 });
                expect(userPublisher.publish).toHaveBeenCalledWith(baseBets[1].uid, { totalWin: 0, refund: 0 });
            });

            it("should call decrypt with expected param", async () => {
                // arrange
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundResultPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest.fn().mockReturnValue({});
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();

                // act
                await consumer.settleBets(round);

                // assert
                expect(decrypt).toHaveBeenCalledWith(round.resultKey);
            });

            it("should publish round result", async () => {
                // arrange
                const roundPublisher = stub(RoundResultPublisher);
                const consumer = new SettleGameRoundConsumer({
                    definition: definition,
                    gameData: gameData,
                    roundResultPublisher: roundPublisher,
                    userBetResultPublisher: userBetResultPublisher,
                    roundsRepository: roundsRepository,
                    betsRepository: betsRepository,
                });
                consumer.queryBets = jest.fn(round.id).mockReturnValue(baseBets);
                consumer.calculateBetResult = jest.fn().mockReturnValue({});
                consumer.callEndGame = jest.fn();
                consumer.captureBetResult = jest.fn();
                decrypt.mockReturnValue("resultKey");

                // act
                await consumer.settleBets(round);

                // assert
                expect(roundPublisher.publishRoundResult).toHaveBeenCalledWith({
                    result: round.result,
                    settlementResult: round.settlementResult,
                    resultKey: "resultKey",
                    roundId: round.id,
                });
            });
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
});
