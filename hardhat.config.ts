import "@nomiclabs/hardhat-ethers";

const gasLimit = 13000000
const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const defaultConfig = {
  url: "http://127.0.0.1:8545",
  gas: gasLimit,
  gasPrice: 100000000000,
}

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.6.11",
  defaultNetwork: 'development',
  networks: {
    development: {
      ...defaultConfig,
      from: DEVELOPMENT_FROM,
      gasPrice: 0,
      gas: gasLimit,
    }
  }
};
