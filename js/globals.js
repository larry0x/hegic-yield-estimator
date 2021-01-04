const INFURA_ENDPOINT = 'https://mainnet.infura.io/v3/76f654581e954e648afb88c05b47f204';
const PROVIDER = new ethers.providers.JsonRpcProvider(INFURA_ENDPOINT);

// const RHEGIC_DAILY_DISTRIBUTION = 660000;  // Phase 1
const RHEGIC_DAILY_DISTRIBUTION = 495000;  // Phase 2
// const RHEGIC_DAILY_DISTRIBUTION = 165000;  // Phase 3

let RHEGIC_PRICE = null;

let PRICES = null;
let CONTRACTS = null;
let RATIOS = null;
let POOL_SIZES = null;

let USER_BALANCES = null;
let USER_INCOMES = null;
