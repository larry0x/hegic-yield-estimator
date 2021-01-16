const getContracts = async () => {
  console.log('Initializing smart contracts...');

  CONTRACTS = {
    writeWBTC: new ethers.Contract(
      '0x20DD9e22d22dd0a6ef74a520cb08303B5faD5dE7',
      await $.get('interfaces/writeWBTC.abi.json'),
      PROVIDER
    ),
    writeETH: new ethers.Contract(
      '0x878F15ffC8b894A1BA7647c7176E4C01f74e140b',
      await $.get('interfaces/writeETH.abi.json'),
      PROVIDER
    ),
    rHEGIC: new ethers.Contract(
      '0xAd7Ca17e23f13982796D27d1E6406366Def6eE5f',
      await $.get('interfaces/rHEGIC.abi.json'),
      PROVIDER
    ),
    StakingRewardsWBTC: new ethers.Contract(
      '0x493134A9eAbc8D2b5e08C5AB08e9D413fb4D1a55',
      await $.get('interfaces/StakingRewards.abi.json'),
      PROVIDER
    ),
    StakingRewardsETH: new ethers.Contract(
      '0x8FcAEf0dBf40D36e5397aE1979c9075Bf34C180e',
      await $.get('interfaces/StakingRewards.abi.json'),
      PROVIDER
    ),
    UniswapPair: new ethers.Contract(
      '0x51996fc38c8d839abd6c2db9a4c221df1cb487a0',
      await $.get('interfaces/UniswapV2Pair.abi.json'),
      PROVIDER
    )
  };

  console.log(CONTRACTS);
};

const getCoinPrices = async () => {
  console.log('Fetching coin prices...');

  var response = await $.get('https://api.coingecko.com/api/v3/simple/price?ids=wrapped-bitcoin%2CETHereum%2Chegic&vs_currencies=usd');

  PRICES = {
    WBTC: response['wrapped-bitcoin'].usd,
    ETH: response.ethereum.usd,
    HEGIC: response.hegic.usd,
  };

  const [ token0Reserve, token1Reserve ] = await CONTRACTS.UniswapPair.getReserves();
  PRICES.rHEGIC = PRICES.ETH * token1Reserve / token0Reserve;

  console.log(PRICES);
};


const getWriteTokenConversionRatios = async () => {
  console.log('Calculating writeToken conversion ratios...');

  const WBTCBalance = parseInt(await CONTRACTS.writeWBTC.totalBalance()) * 10e-8;
  const writeWBTCSupply = parseInt(await CONTRACTS.writeWBTC.totalSupply()) * 10e-18;

  const ETHBalance = parseInt(await CONTRACTS.writeETH.totalBalance()) * 10e-18;
  const writeETHSupply = parseInt(await CONTRACTS.writeETH.totalSupply()) * 10e-18;

  RATIOS = {
    WBTCToWriteWBTC: writeWBTCSupply / WBTCBalance,
    writeWBTCToWBTC: WBTCBalance / writeWBTCSupply,
    ETHToWriteETH: writeETHSupply / ETHBalance,
    writeETHToETH: ETHBalance / writeETHSupply
  };

  console.log(RATIOS);
};

const getPoolSizes = async () => {
  console.log('Calculating pool sizes...');

  const amountWriteWBTCStaked = parseInt(await CONTRACTS.writeWBTC.balanceOf(CONTRACTS.StakingRewardsWBTC.address)) * 10e-19;
  const amountWriteETHStaked = parseInt(await CONTRACTS.writeETH.balanceOf(CONTRACTS.StakingRewardsETH.address)) * 10e-19;

  POOL_SIZES = {
    WBTCPoolSize: amountWriteWBTCStaked,
    ETHPoolSize: amountWriteETHStaked
  };

  console.log(POOL_SIZES);
};

const getUserBalances = async (address) => {
  if (!address) {
    address = $('#userAddressInput')[0].value;
  }

  console.log(`Calculating user balances for address ${address}...`);

  var rHEGICInWallet = parseFloat(await CONTRACTS.rHEGIC.balanceOf(address)) * 10e-19;
  var rHEGICClaimableInWBTCPool = parseFloat(await CONTRACTS.StakingRewardsWBTC.earned(address)) * 10e-19;
  var rHEGICClaimableInETHPool = parseFloat(await CONTRACTS.StakingRewardsETH.earned(address)) * 10e-19;
  var rHEGICTotal = rHEGICInWallet + rHEGICClaimableInWBTCPool + rHEGICClaimableInETHPool;

  var writeWBTCStaked = parseFloat(await CONTRACTS.StakingRewardsWBTC.balanceOf(address)) * 10e-19;
  var writeETHStaked = parseFloat(await CONTRACTS.StakingRewardsETH.balanceOf(address)) * 10e-19;

  var userBalances = {
    rHEGICInWallet, rHEGICClaimableInWBTCPool,
    rHEGICClaimableInETHPool, rHEGICTotal,
    writeWBTCStaked, writeETHStaked
  };

  console.log(userBalances);
  return userBalances
};
