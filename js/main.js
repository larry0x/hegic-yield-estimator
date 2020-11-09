const INFURA_ENDPOINT = 'https://mainnet.infura.io/v3/76f654581e954e648afb88c05b47f204';
const PROVIDER = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);

const ADDRESSES = {
    writeWbtc: '0x20DD9e22d22dd0a6ef74a520cb08303B5faD5dE7',
    wbtcPool: '0x202Ec7190F75046348DE5AB3a97Cc45D7B440680',
    writeEth: '0x878F15ffC8b894A1BA7647c7176E4C01f74e140b',
    ethPool: '0x9b18975e64763bDA591618cdF02D2f14a9875981'
};

var PRICES = {
    hegic: undefined,
    wbtc: undefined,
    eth: undefined,
};

var CONTRACTS = {
    writeWbtc: undefined,
    writeEth: undefined
};

var RATIOS = {
    wbtcToWriteWbtc: undefined,
    writeWbtcToWbtc: undefined,
    ethToWriteEth: undefined,
    writeEthToEth: undefined
};

var POOL_SIZES = {
    wbtcPoolSizeUsd: undefined,
    ethPoolSizeUsd: undefined
};

var RESULT = {};

// https://stackoverflow.com/questions/149055/how-to-format-numbers-as-currency-string
const _formatMoney = (number, decPlaces, decSep, thouSep) => {
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces,
    decSep = typeof decSep === "undefined" ? "." : decSep;
    thouSep = typeof thouSep === "undefined" ? "," : thouSep;
    var sign = number < 0 ? "-" : "";
    var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
    var j = (j = i.length) > 3 ? j % 3 : 0;

    return sign +
        (j ? i.substr(0, j) + thouSep : "") +
        i.substr(j).replace(/(\decSep{3})(?=\decSep)/g, "$1" + thouSep) +
        (decPlaces ? decSep + Math.abs(number - i).toFixed(decPlaces).slice(2) : "");
};

const getCoinPrices = async () => {
    var response = await $.get('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin%2Cethereum%2Chegic&vs_currencies=usd')
    PRICES.wbtc = response['wrapped-bitcoin'].usd;
    PRICES.eth = response.ethereum.usd;
    PRICES.hegic = response.hegic.usd;
};

const getContracts = async () => {
    var writeWbtcAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/writeWbtcAbi.json'));
    CONTRACTS.writeWbtc = new ethers.Contract(ADDRESSES.writeWbtc, writeWbtcAbi, PROVIDER);

    var writeEthAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/writeEthAbi.json'));
    CONTRACTS.writeEth = new ethers.Contract(ADDRESSES.writeEth, writeEthAbi, PROVIDER);
};

const getWriteTokenConversionRatios = async () => {
    const wbtcBalance = parseInt(await CONTRACTS.writeWbtc.totalBalance()) * 10e-8;
    const writeWbtcSupply = parseInt(await CONTRACTS.writeWbtc.totalSupply()) * 10e-18;
    RATIOS.wbtcToWriteWbtc = writeWbtcSupply / wbtcBalance;
    RATIOS.writeWbtcToWbtc = wbtcBalance / writeWbtcSupply;

    const ethBalance = parseInt(await CONTRACTS.writeEth.totalBalance()) * 10e-18;
    const writeEthSupply = parseInt(await CONTRACTS.writeEth.totalSupply()) * 10e-18;
    RATIOS.ethToWriteEth = writeEthSupply / ethBalance;
    RATIOS.writeEthToEth = ethBalance / writeEthSupply;
};

const getPoolSizes = async () => {
    const amountWriteWbtcStaked = parseInt(await CONTRACTS.writeWbtc.balanceOf(ADDRESSES.wbtcPool)) * 10e-19;  // Why -19 not -18???
    console.log('amountWriteWbtcStaked', amountWriteWbtcStaked);
    const amountWriteEthStaked = parseInt(await CONTRACTS.writeEth.balanceOf(ADDRESSES.ethPool)) * 10e-19;

    POOL_SIZES.wbtcPoolSize = amountWriteWbtcStaked * RATIOS.writeWbtcToWbtc;
    POOL_SIZES.ethPoolSize = amountWriteEthStaked * RATIOS.writeEthToEth;
    POOL_SIZES.wbtcPoolSizeUsd = POOL_SIZES.wbtcPoolSize * PRICES.wbtc;
    POOL_SIZES.ethPoolSizeUsd = POOL_SIZES.ethPoolSize * PRICES.eth;
};

const showIncome = (interval) => {
    $('#dailyToggle').removeClass('active');
    $('#weeklyToggle').removeClass('active');
    $('#monthlyToggle').removeClass('active');
    $('#annuallyToggle').removeClass('active');
    $(`#${interval}Toggle`).addClass('active');
    $('#income')[0].innerHTML = RESULT.income[interval];
};

const showResult = (result) => {
    $('#assetPriceHeader')[0].innerHTML = RESULT.assetName + ' Price';
    $('#assetPrice')[0].innerHTML = RESULT.assetPriceStr;
    $('#poolSize')[0].innerHTML = RESULT.poolSizeStr;
    $('#apy')[0].innerHTML = RESULT.apyStr;
    $('#hegicTokenPrice')[0].innerHTML = '$' + _formatMoney(PRICES.hegic, PRICES.hegic >= 1 ? 2 : 4);
    showIncome('daily');
};

const calculateYield = (amount, pool) => {
    if (pool == 'wbtc') {
        assetName = 'WBTC';
        assetPriceStr = '$' + _formatMoney(PRICES.wbtc);
        poolSize = POOL_SIZES.wbtcPoolSizeUsd;
        poolSizeStr = _formatMoney(POOL_SIZES.wbtcPoolSize, 0) + ' WBTC';
    } else {
        assetName = 'ETH';
        assetPriceStr = '$' + _formatMoney(PRICES.eth);
        poolSize = POOL_SIZES.ethPoolSizeUsd;
        poolSizeStr = _formatMoney(POOL_SIZES.ethPoolSize, 0) + ' ETH';
    }

    var dailyHegic = 660000 * amount / poolSize;
    var weeklyHegic = dailyHegic * 7;
    var monthlyHegic = dailyHegic * 30;
    var annuallyHegic = dailyHegic * 365;

    var dailyUsd = dailyHegic * PRICES.hegic;
    var weeklyUsd = weeklyHegic * PRICES.hegic;
    var monthlyUsd = monthlyHegic * PRICES.hegic;
    var annuallyUsd = annuallyHegic * PRICES.hegic;

    var daily = `$${_formatMoney(dailyUsd)} / ${_formatMoney(dailyHegic, 0)} rHEGIC`;
    var weekly = `$${_formatMoney(weeklyUsd)} / ${_formatMoney(weeklyHegic, 0)} rHEGIC`;
    var monthly = `$${_formatMoney(monthlyUsd)} / ${_formatMoney(monthlyHegic, 0)} rHEGIC`;
    var annually = `$${_formatMoney(annuallyUsd)} / ${_formatMoney(annuallyHegic, 0)} rHEGIC`;

    var apy = annuallyUsd / amount;
    var apyStr = parseInt(100 * apy) + '%';

    var income = { daily, weekly, monthly, annually };
    RESULT = { assetName, poolSizeStr, assetPriceStr, apyStr, income };
    showResult();
};

$('#submitBtn').click((event) => {
    event.preventDefault();
    if ($('#wbtcPool')[0].checked) {
        calculateYield($('#amount')[0].value, 'wbtc');
    } else {
        calculateYield($('#amount')[0].value, 'eth');
    }
});

$('#dailyToggle').click((event) => {
    event.preventDefault();
    showIncome('daily');
});

$('#weeklyToggle').click((event) => {
    event.preventDefault();
    showIncome('weekly');
});

$('#monthlyToggle').click((event) => {
    event.preventDefault();
    showIncome('monthly');
});

$('#annuallyToggle').click((event) => {
    event.preventDefault();
    showIncome('annually');
});

const _initialize = () => {
    console.log('Getting prices from CoinGecko...');
    getCoinPrices().then(async () => {

        console.log('Done!');
        console.log('HEGIC price:', '$' + _formatMoney(PRICES.hegic));
        console.log('ETH price:', '$' + _formatMoney(PRICES.eth));
        console.log('WBTC price:', '$' + _formatMoney(PRICES.wbtc));

        console.log('Initializing smart contracts...');
        await getContracts();

    }).then(async () => {

        console.log('Done!');
        console.log('writeWBTC contract address:', CONTRACTS.writeWbtc.address);
        console.log('writeETH contract address:', CONTRACTS.writeEth.address);

        console.log('Calculating writeToken conversion ratios...');
        await getWriteTokenConversionRatios();

    }).then(async () => {

        console.log('Done!');
        console.log(`1.0 WBTC = ${_formatMoney(RATIOS.wbtcToWriteWbtc, 4)} writeWBTC`);
        console.log(`1.0 Eth = ${_formatMoney(RATIOS.ethToWriteEth, 4)} writeETH`);

        console.log('Calculating staking pool sizes...');
        await getPoolSizes();

    }).then(() => {

        console.log('Done!');
        console.log('WBTC reward pool size:', _formatMoney(parseInt(POOL_SIZES.wbtcPoolSize), 0) + ' WBTC');
        console.log('ETH reward pool size:', _formatMoney(parseInt(POOL_SIZES.ethPoolSize), 0) + ' ETH');

        calculateYield(10000, 'wbtc');

    });
};

$(_initialize);
