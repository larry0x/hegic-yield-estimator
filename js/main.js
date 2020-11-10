const INFURA_ENDPOINT = 'https://mainnet.infura.io/v3/76f654581e954e648afb88c05b47f204';
const PROVIDER = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);

const ADDRESSES = {
    writeWbtc: '0x20DD9e22d22dd0a6ef74a520cb08303B5faD5dE7',
    wbtcStakingRewards: '0x202Ec7190F75046348DE5AB3a97Cc45D7B440680',
    writeEth: '0x878F15ffC8b894A1BA7647c7176E4C01f74e140b',
    ethStakingRewards: '0x9b18975e64763bDA591618cdF02D2f14a9875981',
    rHegic: '0x47C0aD2aE6c0Ed4bcf7bc5b380D7205E89436e84',
    uniswapRhegicEthPool: '0xae95aebf655e9b40c7e0d262198b970cd25f28af'
};

const RHEGIC_DAILY_DISTRIBUTION = 660000;

var RHEGIC_PRICE = undefined;

var PRICES = undefined;
var CONTRACTS = undefined;
var RATIOS = undefined;
var POOL_SIZES = undefined;

var USER_BALANCES = undefined;
var USER_INCOMES = undefined;

// https://stackoverflow.com/questions/149055/
const _formatNumber = (number, decPlaces) => {
    if (typeof number == 'string') {
        number = number.replace(/,/gi, '');
        number = parseFloat(number);
    }

    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
    var sign = number < 0 ? '-' : '';
    var i = String(parseInt(number = Math.abs(Number(number) || 0).toFixed(decPlaces)));
    var j = (j = i.length) > 3 ? j % 3 : 0;

    var formattedNumber = sign +
        (j ? i.substr(0, j) + ',' : '') +
        i.substr(j).replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        (decPlaces ? '.' + Math.abs(number - i).toFixed(decPlaces).slice(2) : '');

    console.log('Number formatted:', number, '<>', formattedNumber);
    return formattedNumber;
};

const getContracts = async () => {
    console.log('Initializing smart contracts...');

    var writeWbtcAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/writeWbtcAbi.json'));
    var writeEthAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/writeEthAbi.json'));
    var rHegicAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/rHegicAbi.json'));
    var stakingRewardsAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/stakingRewardsAbi.json'));
    var uniswapV2PairAbi = JSON.parse(await $.get('https://raw.githubusercontent.com/Larrypcdotcom/hegic-yield-estimator/main/abi/UniswapV2PairAbi.json'));

    CONTRACTS = {
        writeWbtc: new ethers.Contract(
            ADDRESSES.writeWbtc,
            writeWbtcAbi,
            PROVIDER
        ),
        writeEth: new ethers.Contract(
            ADDRESSES.writeEth,
            writeEthAbi,
            PROVIDER
        ),
        rHegic: new ethers.Contract(
            ADDRESSES.rHegic,
            rHegicAbi,
            PROVIDER
        ),
        wbtcStakingRewards: new ethers.Contract(
            ADDRESSES.wbtcStakingRewards,
            stakingRewardsAbi,
            PROVIDER
        ),
        ethStakingRewards: new ethers.Contract(
            ADDRESSES.ethStakingRewards,
            stakingRewardsAbi,
            PROVIDER
        ),
        uniswapRhegicEthPool: new ethers.Contract(
            ADDRESSES.uniswapRhegicEthPool,
            uniswapV2PairAbi,
            PROVIDER
        )
    };

    console.log(CONTRACTS);
};

const getCoinPrices = async () => {
    console.log('Fetching coin prices...');

    var response = await $.get('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin%2Cethereum%2Chegic&vs_currencies=usd');
    var reserves = await CONTRACTS.uniswapRhegicEthPool.getReserves()

    PRICES = {
        wbtc: response['wrapped-bitcoin'].usd,
        eth: response.ethereum.usd,
        hegic: response.hegic.usd,
        rHegic: response.ethereum.usd * parseFloat(reserves._reserve1) / parseFloat(reserves._reserve0)
    };

    console.log(PRICES);
};

const getWriteTokenConversionRatios = async () => {
    console.log('Calculating writeToken conversion ratios...');

    const wbtcBalance = parseInt(await CONTRACTS.writeWbtc.totalBalance()) * 10e-8;
    const writeWbtcSupply = parseInt(await CONTRACTS.writeWbtc.totalSupply()) * 10e-18;

    const ethBalance = parseInt(await CONTRACTS.writeEth.totalBalance()) * 10e-18;
    const writeEthSupply = parseInt(await CONTRACTS.writeEth.totalSupply()) * 10e-18;

    RATIOS = {
        wbtcToWriteWbtc: writeWbtcSupply / wbtcBalance,
        writeWbtcToWbtc: wbtcBalance / writeWbtcSupply,
        ethToWriteEth: writeEthSupply / ethBalance,
        writeEthToEth: ethBalance / writeEthSupply
    };

    console.log(RATIOS);
};

const getPoolSizes = async () => {
    console.log('Calculating pool sizes...');

    const amountWriteWbtcStaked = parseInt(await CONTRACTS.writeWbtc.balanceOf(ADDRESSES.wbtcStakingRewards)) * 10e-19;
    const amountWriteEthStaked = parseInt(await CONTRACTS.writeEth.balanceOf(ADDRESSES.ethStakingRewards)) * 10e-19;

    POOL_SIZES = {
        wbtcPoolSize: amountWriteWbtcStaked,
        ethPoolSize: amountWriteEthStaked
    };

    console.log(POOL_SIZES);
};

const getUserBalances = async (address) => {
    if (!address) {
        address = $('#userAddressInput')[0].value;
    }

    console.log(`Calculating user balances for address ${address}...`);

    var rHegicInWallet = parseFloat(await CONTRACTS.rHegic.balanceOf(address)) * 10e-19;
    var rHegicClaimableInWbtcPool = parseFloat(await CONTRACTS.wbtcStakingRewards.earned(address)) * 10e-19;
    var rHegicClaimableInEthPool = parseFloat(await CONTRACTS.ethStakingRewards.earned(address)) * 10e-19;
    var rHegicTotal = rHegicInWallet + rHegicClaimableInWbtcPool + rHegicClaimableInEthPool;

    var writeWbtcStaked = parseFloat(await CONTRACTS.wbtcStakingRewards.balanceOf(address)) * 10e-19;
    var writeEthStaked = parseFloat(await CONTRACTS.ethStakingRewards.balanceOf(address)) * 10e-19;

    var userBalances = {
        rHegicInWallet, rHegicClaimableInWbtcPool,
        rHegicClaimableInEthPool, rHegicTotal,
        writeWbtcStaked, writeEthStaked
    };

    console.log(userBalances);
    return userBalances
};

const calculateIncomes = (userBalances) => {
    console.log('Calculating yield...');

    var wbtcPoolDailyIncome = RHEGIC_DAILY_DISTRIBUTION * userBalances.writeWbtcStaked / POOL_SIZES.wbtcPoolSize;
    var wbtcPoolIncomes = {
        daily: wbtcPoolDailyIncome,
        weekly: wbtcPoolDailyIncome * 7,
        monthly: wbtcPoolDailyIncome * 30,
        annually: wbtcPoolDailyIncome * 365
    };

    var ethPoolDailyIncome = RHEGIC_DAILY_DISTRIBUTION * userBalances.writeEthStaked / POOL_SIZES.ethPoolSize;
    var ethPoolIncomes = {
        daily: ethPoolDailyIncome,
        weekly: ethPoolDailyIncome * 7,
        monthly: ethPoolDailyIncome * 30,
        annually: ethPoolDailyIncome * 365
    };

    userIncomes = { wbtcPoolIncomes, ethPoolIncomes };
    console.log(userIncomes);
    return userIncomes;
};

const _showSpinner = (text) => {
    // if (text) {
    //     $('#spinnerText')[0].innerHTML = text;
    // }
    $('#loading').fadeIn();
};

const _hideSpinner = () => {
    $('#loading').fadeOut();
};

const updatePrice = () => {
    if (!RHEGIC_PRICE) {
        RHEGIC_PRICE = PRICES.rHegic;
    }
    $('#rHegicPrice')[0].innerHTML = _formatNumber(RHEGIC_PRICE, RHEGIC_PRICE >= 1 ? 2 : 4);;
};

const updateHoldings = () => {
    $('#rHegicInWallet')[0].innerHTML = _formatNumber(USER_BALANCES.rHegicInWallet, 0);
    $('#rHegicClaimableInWbtcPool')[0].innerHTML = _formatNumber(USER_BALANCES.rHegicClaimableInWbtcPool, 0);
    $('#rHegicClaimableInEthPool')[0].innerHTML = _formatNumber(USER_BALANCES.rHegicClaimableInEthPool, 0);
    $('#rHegicTotal')[0].innerHTML = _formatNumber(USER_BALANCES.rHegicTotal, 0);
    $('#rHegicTotalUsd')[0].innerHTML = _formatNumber(USER_BALANCES.rHegicTotal * RHEGIC_PRICE, 2);
};

const updateAPY = () => {
    var userWbtcPrinciple = USER_BALANCES.writeWbtcStaked * RATIOS.writeWbtcToWbtc * PRICES.wbtc;
    var wbtcPoolAPY = userWbtcPrinciple > 0 ? USER_INCOMES.wbtcPoolIncomes.annually * RHEGIC_PRICE / userWbtcPrinciple : 0;

    var userEthPrinciple = USER_BALANCES.writeEthStaked * RATIOS.writeEthToEth * PRICES.eth;
    var ethPoolAPY = userEthPrinciple > 0 ? USER_INCOMES.ethPoolIncomes.annually * RHEGIC_PRICE / userEthPrinciple : 0;

    $('#wbtcPoolAPY')[0].innerHTML = _formatNumber(100 * wbtcPoolAPY, 0);
    $('#ethPoolAPY')[0].innerHTML = _formatNumber(100 * ethPoolAPY, 0);
};

const _setActiveToggleWbtc = (option) => {
    $('#dailyToggleWbtc').removeClass('active');
    $('#weeklyToggleWbtc').removeClass('active');
    $('#monthlyToggleWbtc').removeClass('active');
    $('#annuallyToggleWbtc').removeClass('active');
    $(`#${option}ToggleWbtc`).addClass('active');
};

const _setActiveToggleEth = (option) => {
    $('#dailyToggleEth').removeClass('active');
    $('#weeklyToggleEth').removeClass('active');
    $('#monthlyToggleEth').removeClass('active');
    $('#annuallyToggleEth').removeClass('active');
    $(`#${option}ToggleEth`).addClass('active');
};

const _findWbtcToggleOption = () => {
    if ($('#dailyToggleWbtc').hasClass('active')) {
        return 'daily';
    } else if ($('#weeklyToggleWbtc').hasClass('active')) {
        return 'weekly';
    } else if ($('#monthlyToggleWbtc').hasClass('active')) {
        return 'monthly';
    }
    else {
        return 'annually';
    }
};

const _findEthToggleOption = () => {
    if ($('#dailyToggleEth').hasClass('active')) {
        return 'daily';
    } else if ($('#weeklyToggleEth').hasClass('active')) {
        return 'weekly';
    } else if ($('#monthlyToggleEth').hasClass('active')) {
        return 'monthly';
    }
    else {
        return 'annually';
    }
};

const _updateWbtcIncome = (wbtcToggleOption) => {
    if (!wbtcToggleOption) {
        wbtcToggleOption = _findWbtcToggleOption();
    }
    var wbtcIncome = USER_INCOMES.wbtcPoolIncomes[wbtcToggleOption];
    var wbtcIncomeUsd = USER_INCOMES.wbtcPoolIncomes[wbtcToggleOption] * RHEGIC_PRICE;
    $('#wbtcIncomeUsd')[0].innerHTML = _formatNumber(wbtcIncomeUsd, 2);
    $('#wbtcIncome')[0].innerHTML = _formatNumber(wbtcIncome, 0);
};

const _updateEthIncome = (ethToggleOption) => {
    if (!ethToggleOption) {
        ethToggleOption = _findEthToggleOption();
    }
    var ethIncome = USER_INCOMES.ethPoolIncomes[ethToggleOption];
    var ethIncomeUsd = USER_INCOMES.ethPoolIncomes[ethToggleOption] * RHEGIC_PRICE;
    $('#ethIncomeUsd')[0].innerHTML = _formatNumber(ethIncomeUsd, 2);
    $('#ethIncome')[0].innerHTML = _formatNumber(ethIncome, 0);
}

const updateIncomes = () => {
    _updateWbtcIncome();
    _updateEthIncome();
};

$(() => {
    $('#submitBtn').click((event) => {
        event.preventDefault();

        var addressInput = $('#userAddressInput');
        var address = addressInput[0].value;
        console.log('User address', address);

        // Check if Eth address is valid
        try {
            address = ethers.utils.getAddress(address);
            if (addressInput.hasClass('is-invalid')) {
                addressInput.removeClass('is-invalid');
            }
        } catch (err) {
            console.log('Invalid address!!!')
            addressInput.addClass('is-invalid');
            return err;
        }

        _showSpinner('Loading user data...');
        getUserBalances()
        .then((userBalances) => {
            USER_BALANCES = userBalances;
            USER_INCOMES = calculateIncomes(userBalances);

            updateHoldings();
            updateAPY();
            updateIncomes();
            _hideSpinner();
        });
    });

    var useRHegicPriceRadio = $('#useRHegicPriceRadio');
    var useHegicPriceRadio = $('#useHegicPriceRadio');

    useRHegicPriceRadio.click((event) => {
        RHEGIC_PRICE = PRICES.rHegic;
        updatePrice();
        if (USER_INCOMES) {
            updateHoldings();
            updateAPY();
            updateIncomes();
        }
    });

    useHegicPriceRadio.click((event) => {
        RHEGIC_PRICE = PRICES.hegic;
        updatePrice();
        if (USER_INCOMES) {
            updateHoldings();
            updateAPY();
            updateIncomes();
        }
    });

    $('#dailyToggleWbtc').click((event) => {
        event.preventDefault();
        _setActiveToggleWbtc('daily');
        _updateWbtcIncome('daily');
    });
    $('#weeklyToggleWbtc').click((event) => {
        event.preventDefault();
        _setActiveToggleWbtc('weekly');
        _updateWbtcIncome('weekly');
    });
    $('#monthlyToggleWbtc').click((event) => {
        event.preventDefault();
        _setActiveToggleWbtc('monthly');
        _updateWbtcIncome('monthly');
    });
    $('#annuallyToggleWbtc').click((event) => {
        event.preventDefault();
        _setActiveToggleWbtc('annually');
        _updateWbtcIncome('annually');
    });

    $('#dailyToggleEth').click((event) => {
        event.preventDefault();
        _setActiveToggleEth('daily');
        _updateEthIncome('daily');
    });
    $('#weeklyToggleEth').click((event) => {
        event.preventDefault();
        _setActiveToggleEth('weekly');
        _updateEthIncome('weekly');
    });
    $('#monthlyToggleEth').click((event) => {
        event.preventDefault();
        _setActiveToggleEth('monthly');
        _updateEthIncome('monthly');
    });
    $('#annuallyToggleEth').click((event) => {
        event.preventDefault();
        _setActiveToggleEth('annually');
        _updateEthIncome('annually');
    });

    _showSpinner('Loading pool data...');
    getContracts()
    .then(getCoinPrices)
    .then(getWriteTokenConversionRatios)
    .then(getPoolSizes)
    .then(updatePrice)
    .then(_hideSpinner);
});
