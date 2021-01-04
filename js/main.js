const calculateIncomes = (userBalances) => {
  console.log('Calculating yield...');

  var WBTCPoolDailyIncome = RHEGIC_DAILY_DISTRIBUTION * userBalances.writeWBTCStaked / POOL_SIZES.WBTCPoolSize;
  var WBTCPoolIncomes = {
    daily: WBTCPoolDailyIncome,
    weekly: WBTCPoolDailyIncome * 7,
    monthly: WBTCPoolDailyIncome * 30,
    annually: WBTCPoolDailyIncome * 365
  };

  var ETHPoolDailyIncome = RHEGIC_DAILY_DISTRIBUTION * userBalances.writeETHStaked / POOL_SIZES.ETHPoolSize;
  var ETHPoolIncomes = {
    daily: ETHPoolDailyIncome,
    weekly: ETHPoolDailyIncome * 7,
    monthly: ETHPoolDailyIncome * 30,
    annually: ETHPoolDailyIncome * 365
  };

  userIncomes = { WBTCPoolIncomes, ETHPoolIncomes };
  console.log(userIncomes);
  return userIncomes;
};

const readQueryString = () => {
  var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
  var vars = {};

  for(i = 0; i < hashes.length; i++) {
    hash = hashes[i].split('=');
    vars[hash[0]] = hash[1];
  }

  if ('address' in vars) {
    $('#userAddressInput').val(vars.address);
    return vars.address;
  } else {
    return null;
  }
};

const showSpinner = (text) => {
  $('#spinnerContainer').fadeIn();
};

const hideSpinner = () => {
  $('#spinnerContainer').fadeOut();
};

const removeOverlay = () => {
  $('#cardsOverlay').fadeOut();
  $('#cardsContainer').removeClass('blur');
};

const updatePrice = () => {
  if (!RHEGIC_PRICE) {
    RHEGIC_PRICE = PRICES.rHEGIC;
  }
  $('#rHEGICPrice').html(formatNumber(RHEGIC_PRICE, RHEGIC_PRICE >= 1 ? 2 : 4));
};

const updateHoldings = () => {
  $('#rHEGICInWallet').html(formatNumber(USER_BALANCES.rHEGICInWallet, 0));
  $('#rHEGICClaimableInWBTCPool').html(formatNumber(USER_BALANCES.rHEGICClaimableInWBTCPool, 0));
  $('#rHEGICClaimableInETHPool').html(formatNumber(USER_BALANCES.rHEGICClaimableInETHPool, 0));
  $('#rHEGICTotal').html(formatNumber(USER_BALANCES.rHEGICTotal, 0));
  $('#rHEGICTotalUsd').html(formatNumber(USER_BALANCES.rHEGICTotal * RHEGIC_PRICE, 2));
};

const updateAPY = () => {
  var userWBTCPrinciple = USER_BALANCES.writeWBTCStaked * RATIOS.writeWBTCToWBTC * PRICES.WBTC;
  var WBTCPoolAPY = userWBTCPrinciple > 0 ? USER_INCOMES.WBTCPoolIncomes.annually * RHEGIC_PRICE / userWBTCPrinciple : 0;

  var userETHPrinciple = USER_BALANCES.writeETHStaked * RATIOS.writeETHToETH * PRICES.ETH;
  var ETHPoolAPY = userETHPrinciple > 0 ? USER_INCOMES.ETHPoolIncomes.annually * RHEGIC_PRICE / userETHPrinciple : 0;

  $('#WBTCPoolAPY').html(formatNumber(100 * WBTCPoolAPY, 0));
  $('#ETHPoolAPY').html(formatNumber(100 * ETHPoolAPY, 0));
};

const setActiveToggle = (option) => {
  $('#dailyToggle').removeClass('active');
  $('#weeklyToggle').removeClass('active');
  $('#monthlyToggle').removeClass('active');
  $('#annuallyToggle').removeClass('active');
  $(`#${option}Toggle`).addClass('active');
};

const findCurrentToggleOption = () => {
  if ($('#dailyToggle').hasClass('active')) {
    return 'daily';
  } else if ($('#weeklyToggle').hasClass('active')) {
    return 'weekly';
  } else if ($('#monthlyToggle').hasClass('active')) {
    return 'monthly';
  } else {
    return 'annually';
  }
};

const updateIncomes = (toggleOption) => {
  if (!toggleOption) {
    toggleOption = findCurrentToggleOption();
  }

  var WBTCIncome = USER_INCOMES.WBTCPoolIncomes[toggleOption];
  var WBTCIncomeUsd = USER_INCOMES.WBTCPoolIncomes[toggleOption] * RHEGIC_PRICE;
  var ETHIncome = USER_INCOMES.ETHPoolIncomes[toggleOption];
  var ETHIncomeUsd = USER_INCOMES.ETHPoolIncomes[toggleOption] * RHEGIC_PRICE;
  var totalIncome = WBTCIncome + ETHIncome;
  var totalIncomeUsd = WBTCIncomeUsd + ETHIncomeUsd;

  $('#WBTCIncomeUsd').html(formatNumber(WBTCIncomeUsd, 2));
  $('#WBTCIncome').html(formatNumber(WBTCIncome, 0));
  $('#ETHIncomeUsd').html(formatNumber(ETHIncomeUsd, 2));
  $('#ETHIncome').html(formatNumber(ETHIncome, 0));
  $('#totalIncomeUsd').html(formatNumber(totalIncomeUsd, 2));
  $('#totalIncome').html(formatNumber(totalIncome, 0));
};

const showTooltip = (element, msg) => {
  element.tooltip('hide')
    .attr('data-original-title', msg)
    .tooltip('show');
};

const hideToolTip = (element, msg, timeout = 1000) => {
  setTimeout(() => {
    element.tooltip('hide');
  }, timeout)
};

$(() => {
  $('#submitBtn').click(async (event) => {
    event.preventDefault();
    removeOverlay();
    showSpinner();

    var addressInput = $('#userAddressInput');

    // First try resolve ENS domain
    var address = PROVIDER.resolveName(addressInput.val());

    // If isn't a valid ENS address, will return null
    if (!address) {
      try {
        address = ethers.utils.getAddress(addressInput.val());  // If address is invalid, will return error
        if (addressInput.hasClass('is-invalid')) {
          addressInput.removeClass('is-invalid');
        }
      } catch (err) {
        console.log('Invalid address!!!')
        addressInput.addClass('is-invalid');
        hideSpinner();
        return err;
      }
    }

    getContracts()
    .then(getCoinPrices)
    .then(updatePrice)
    .then(getWriteTokenConversionRatios)
    .then(getPoolSizes)
    .then(readQueryString)
    .then(getUserBalances)
    .then((userBalances) => {
      USER_BALANCES = userBalances;
      USER_INCOMES = calculateIncomes(userBalances);

      updateHoldings();
      updateAPY();
      updateIncomes();
      hideSpinner();
    });
  });

  $('#copyUrlButton')
  .tooltip({
    trigger: 'click',
    placement: 'bottom'
  })
  .click(function (event) {
    event.preventDefault();

    var address = $('#userAddressInput')[0].value;
    var url = `https://larrypcdotcom.github.io/hegic-yield-estimator/?address=${address}`;

    var $temp = $('<input>');
    $('body').append($temp);
    $temp.val(url).select();
    document.execCommand('copy');
    $temp.remove();

    showTooltip($(this), 'Copied!');
    hideToolTip($(this));
  });

  $('#useRHegicPriceRadio').click((event) => {
    RHEGIC_PRICE = PRICES.rHEGIC;
    updatePrice();
    if (USER_INCOMES) {
      updateHoldings();
      updateAPY();
      updateIncomes();
    }
  });
  $('#useHegicPriceRadio').click((event) => {
    RHEGIC_PRICE = PRICES.hegic;
    updatePrice();
    if (USER_INCOMES) {
      updateHoldings();
      updateAPY();
      updateIncomes();
    }
  });

  $('#dailyToggle').click((event) => {
    event.preventDefault();
    setActiveToggle('daily');
    updateIncomes('daily');
  });
  $('#weeklyToggle').click((event) => {
    event.preventDefault();
    setActiveToggle('weekly');
    updateIncomes('weekly');
  });
  $('#monthlyToggle').click((event) => {
    event.preventDefault();
    setActiveToggle('monthly');
    updateIncomes('monthly');
  });
  $('#annuallyToggle').click((event) => {
    event.preventDefault();
    setActiveToggle('annually');
    updateIncomes('annually');
  });

  var address = readQueryString();
  if (address) {
    $('#userAddressInput').val(address);
    $('#submitBtn').trigger('click');
  }
});
