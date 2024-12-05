const game = {
    id: 1509,
    name: "skkenopower",
};

const currencyData = { code: "USD", name: "$US" };

const socketOptions = {
    socketUri: `http://localhost:8089/user/${game.name}`,
    gameName: "KenoPower",
    proxyRoute: "/socket.io",
};

const gameConfig = {
    type: 1,
    gameId: game.id,
    name: game.name,
    enabled: true,
    minBet: 1,
    maxBet: 2000,
    maxBetPerChoices: {
        blue: 2000,
        red: 2000,
        big: 2000,
        small: 2000,
        odd: 2000,
        even: 2000,
        blueBig: 2000,
        blueSmall: 2000,
        redBig: 2000,
        redSmall: 2000,
    },
    chips: ["1", "5", "10", "50", "100", "200", "1000", "2000"],
    bot_maxbet: 10,
    hour_maxbot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    disabled_message: "Game đang được bảo trì, vui lòng quay lại sau 10 phút.",
    odds: {
        blue: 1.97,
        red: 1.97,
        big: 1.97,
        small: 1.97,
        odd: 1.97,
        even: 1.97,
        blueBig: 1.97,
        blueSmall: 1.97,
        redBig: 1.97,
        redSmall: 1.97,
    },
};

const rounds = [
    {
        settled: true,
        id: 1,
        md5: "126bfb6cf2a2c43c16e3e160476b4619",
        resultKey: {
            iv: "cfdd1cc0e0d8b6608694f135e7b607e2",
            content: "3612ba40bee4dc8ba05c92220941c7db4641a0e717cd6ec0cbab9e10bee4d2dbc291570f5e80c91d",
        },
        encryptedResult: {
            iv: "132060b37acb8ae77c12ad44434150b9",
            content:
                "830729d7a49a677508c38545b95fd043fda9c2c776f19f8f47803c58524791270686bc4aa9ec2d3c9682b95965552abf68a244ab6dff3771d202590775bfeace883b3159d5822190a6b13f677ebbe8bae2b12a1882c90b448d33987aed5f2dbde2c829e53dbe08df9c8fbf568604b724dd199d5c6dad2822355297f8581b0d45ead1f46be9",
        },
        exchangeRateId: 2681,
        result: {
            blue: [1, 2, 15, 27, 28, 29, 31, 33, 38, 48, 50, 51, 56, 59, 61, 64, 65, 66, 70, 71],
            red: [1, 4, 6, 15, 16, 19, 22, 25, 28, 31, 36, 39, 42, 44, 54, 63, 67, 70, 71, 79],
        },
        settlementResult: {
            blue: true,
            red: false,
            tie: false,
            big: false,
            small: true,
            odd: true,
            even: false,
            blueBig: true,
            blueSmall: false,
            redBig: false,
            redSmall: true,
        },
    },
    {
        settled: true,
        id: 2,
        md5: "0c55b0ffdf981e0cd29b8bdf91947bf5",
        resultKey: {
            iv: "bf4c2f31f8929a24c4c520f93263a30c",
            content: "c55a78097ec5a3a31e53a3929b20b4618e9fafbf27ff39fff55e49ff445cc4b36e7b89709a061ab6",
        },
        encryptedResult: {
            iv: "00422eca3d1c02ee437091199180dd1b",
            content:
                "8c65c9ad6de271b74bf22cc8f7782bf0baa9eb19b11284d81e74682ef80161f669f19ae47411efb926f92874cec46928d8f61eb60a731427bf040997cc76dc73efb59985a7589fd52997ea2c09382ac8e864d4e62bab9f607133133441a2576f33d32378b562d029de50622e0f2ffd8c9db543fc75565db43525673392955cbb9170bda4cfb93d21",
        },
        exchangeRateId: 2681,
        result: {
            blue: [1, 2, 10, 12, 13, 22, 32, 36, 39, 44, 46, 60, 67, 69, 71, 72, 73, 74, 78, 79],
            red: [10, 11, 13, 14, 15, 19, 22, 24, 30, 40, 42, 43, 46, 47, 52, 56, 68, 69, 77, 79],
        },
        settlementResult: {
            blue: true,
            red: false,
            tie: false,
            big: true,
            small: false,
            odd: true,
            even: false,
            blueBig: true,
            blueSmall: false,
            redBig: false,
            redSmall: true,
        },
    },
];

const userBetData = (uid) => {
    return [
        {
            uid,
            name: "NormalUser",
            phien: 1190119,
            choice: "big",
            amount: 100,
            roundId: 518967,
            siteId: "111",
            currency: "$US",
            rate: 1,
            operatorId: "dummy-operator-id",
            playerId: "2609",
        },
        {
            uid,
            name: "NormalUser",
            phien: 1190119,
            choice: "even",
            amount: 100,
            roundId: 518967,
            siteId: "111",
            currency: "$US",
            rate: 1,
            operatorId: "dummy-operator-id",
            playerId: "2609",
        },
    ];
};

export { game, currencyData, socketOptions, gameConfig, rounds, userBetData };
