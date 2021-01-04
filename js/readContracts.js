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
      '0x47C0aD2aE6c0Ed4bcf7bc5b380D7205E89436e84',
      await $.get('interfaces/rHEGIC.abi.json'),
      PROVIDER
    ),
    StakingRewardsWBTC: new ethers.Contract(
      '0x202Ec7190F75046348DE5AB3a97Cc45D7B440680',
      await $.get('interfaces/StakingRewards.abi.json'),
      PROVIDER
    ),
    StakingRewardsETH: new ethers.Contract(
      '0x9b18975e64763bDA591618cdF02D2f14a9875981',
      await $.get('interfaces/StakingRewards.abi.json'),
      PROVIDER
    )
  };

  console.log(CONTRACTS);
};

const getWriteTokenConversionRatios = async () => {
  console.log('Calculating writeToken conversion ratios...');

  const WBTCBalance = parseInt(await CONTRACTS.writeWBTC.totalBalance()) * 10e-8;
  const writeWBTCSupply = parseInt(await CONTRACTS.writeWBTC.totalSupply()) * 10e-18;

  const ETHBalance = parseInt(await CONTRACTS.writeETH.totalBalance()) * 10e-18;
  const writeETHSupply = parseInt(await CONTRACTS.writeETH.totalSupply()) * 10e-18;

  RATIOS = {
    WBTCTowriteWBTC: writeWBTCSupply / WBTCBalance,
    writeWBTCToWBTC: WBTCBalance / writeWBTCSupply,
    ETHTowriteETH: writeETHSupply / ETHBalance,
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
