import { stub, stubMongooseModelStupidly } from "jest-micro-auto-stub";
import mongoose from "mongoose";
import { logger } from "sc-common";
import { Core } from "sc-game-base";

import { choices, choicesMapper } from "../../../src/constants";
import { RoundResultConsumer, SettleGameRoundConsumer } from "../../../src/consumers";
import { GameCron } from "../../../src/crons/game-cron";

describe("game cron instance", () => {
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

    const gameData = new Core.GameData(0);

    /** @type {logger}*/
    const logService = stub(logger);

    /** @type {mongoose.Model}*/
    const betsRepository = stubMongooseModelStupidly(mongoose.Model);
    betsRepository.updateOne = jest.fn();

    /** @type {mongoose.Model}*/
    const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
    betLogsRepository.create = jest.fn();

    /** @type {mongoose.Model}*/
    const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
    userInfosRepository.updateOne = jest.fn();

    const bot = stub(Core.Crons.BaseBot);

    /** @type {SettleGameRoundConsumer}*/
    const settleGameRoundConsumer = stub(SettleGameRoundConsumer);

    /** @type {Core.BaseEventPublishers.GameStatusPublisher}*/
    const gameStatusPublisher = stub(Core.BaseEventPublishers.GameStatusPublisher);

    /** @type {Core.BaseEventPublishers.RunningRoundInfoPublisher}*/
    const runningRoundInfoPublisher = stub(Core.BaseEventPublishers.RunningRoundInfoPublisher);

    /** @type {mongoose.Model}*/
    const gameConfigsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const roundsRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const archiveStatusesRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const notificationRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {RoundResultConsumer}*/
    const roundResultConsumer = stub(RoundResultConsumer);

    /** @type {mongoose.Model}*/
    const partnerConfigRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyGroupGamesRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyGroupRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const currencyRepository = stubMongooseModelStupidly(mongoose.Model);

    /** @type {mongoose.Model}*/
    const exchangeRatesRepository = stubMongooseModelStupidly(mongoose.Model);

    const gameCron = new GameCron({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        gameConfigsRepository,
        roundsRepository,
        archiveStatusesRepository,
        notificationRepository,
        exchangeRatesRepository,
        currencyGroupGamesRepository,
        partnerConfigRepository,
        currencyGroupRepository,
        currencyRepository,
        roundResultConsumer,
    });

    it("should be instance of Core.Crons.BaseGameCron", () => {
        expect(gameCron instanceof Core.Crons.BaseGameCron).toBeTruthy();
    });

    describe("checkGameStatus tests", () => {
        it("game is enabled, should update gameData.gameConfigs and call publishStartGame", async () => {
            const gameConfigs = { enabled: true };
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce(gameConfigs);

            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameStatusPublisher.publishStartGame).toHaveBeenCalled();
        });

        it("game is disabled, should reset gameData.remainingTime, update game configs and call publishDisableGameStatus", async () => {
            const gameConfigs = { enabled: false };
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce(gameConfigs);

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameData.remainingTime).toEqual(definition.durations.wholeRound);
            expect(gameConfigsRepository.updateOne).toHaveBeenCalled();
            expect(gameStatusPublisher.publishDisableGameStatus).toHaveBeenCalled();
        });

        it("game is currently disabled, then being enabled, should call publishEnablingGameStatus", async () => {
            const gameConfigs = { enabled: true };
            gameData.disabled = true;
            gameData.remainingTime = definition.durations.wholeRound;
            gameConfigsRepository.findOne().lean().exec.mockReturnValueOnce(gameConfigs);

            await gameCron.checkGameStatus();

            expect(gameData.gameConfigs).toEqual(gameConfigs);
            expect(gameStatusPublisher.publishEnablingGameStatus).toHaveBeenCalled();
        });
    });
    describe("proceed tests", () => {
        it("should call checkGameStatus after each round", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.wholeRound;
            gameCron.checkGameStatus = jest.fn();

            // act
            await gameCron.proceed();

            // assert
            expect(gameCron.checkGameStatus).toHaveBeenCalled();
        });

        it("should call resetForNewRound and generateResult at starting round", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.placingBets + 1;

            jest.spyOn(gameCron, "resetForNewRound");

            // act
            await gameCron.proceed();

            // assert
            expect(gameCron.resetForNewRound).toHaveBeenCalled();
            expect(roundResultConsumer.generateResult).toHaveBeenCalled();
        });

        it("should call settleRound when remainingTime is less than 0", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = 0;

            // act
            await gameCron.proceed();

            // assert
            expect(gameData.remainingTime).toEqual(definition.durations.wholeRound);
            expect(settleGameRoundConsumer.settleRound).toHaveBeenCalled();
        });

        it("should call runningRoundInfoPublisher.publish when remaining time is in placing bet time", async () => {
            // arrange
            gameData.disabled = false;
            gameData.remainingTime = definition.durations.placingBets;

            gameCron.checkGameStatus = jest.fn();

            // act
            await gameCron.proceed();

            // assert
            expect(runningRoundInfoPublisher.publish).toHaveBeenCalled();
        });
    });

    describe("start tests", () => {
        it("should call getLastArchiveRound when last round doesn't exist", async () => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(null);
            spyOn(gameCron, "getLastArchiveRound");

            // act
            await gameCron.start();

            // arrange
            expect(gameCron.getLastArchiveRound).toHaveBeenCalled();
        });

        it("should increase round id when last round was settled", async () => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 1, settled: true });

            // act
            await gameCron.start();

            // arrange
            expect(gameData.roundId).toStrictEqual(2);
        });

        describe("when last round is not settled", () => {
            it("should call checkGameStatus and set current running round to latest round", async () => {
                roundsRepository.findOne().lean().exec.mockReturnValueOnce({
                    id: 1,
                    settled: false,
                });

                // act
                await gameCron.start();

                // arrange
                expect(gameData.roundId).toStrictEqual(1);
            });
        });
    });
});
