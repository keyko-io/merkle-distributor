import { task } from "hardhat/config"
import { ContractFactory } from "ethers";
import fs from 'fs'
import { parseBalanceMap } from '../src/parse-balance-map'
import { verifyMerkleRoot } from '../scripts/verify-merkle-root'

async function main(jsonFile: string, hre: any) {
  const rewards = JSON.parse(fs.readFileSync(jsonFile, { encoding: 'utf8' }))
  const merkleData = parseBalanceMap(rewards)
  const merkleRoot = merkleData.merkleRoot
  console.log(`Constructed Merkle Root: ${merkleRoot}`)
  await verifyMerkleRoot(merkleData)

  // TODO: grab env specific token address (alfajores, baklava, mainnet)
  const ERC20Test: ContractFactory = await hre.ethers.getContractFactory("TestERC20");
  const erc20 = await ERC20Test.deploy('ecw', 'emcoin', '123456789123456789012345678');
  const MerkleDistributor: ContractFactory = await hre.ethers.getContractFactory("MerkleDistributor");
  const merkleDistributor = await MerkleDistributor.deploy(erc20.address, merkleRoot);


  console.log("MerkleDistributor deployed to:", merkleDistributor.address);
  merkleData.contractAddress = merkleDistributor.address
 }

 task('deploy-merkle', 'generates a merkle tree based on rewards and deploys merkle distributor contract')
  .addParam('input', 'json file with rewards')
  .setAction(
    async (params, hre) => { 
      await main(params.input, hre)
      .then(() => process.exit(0))
      .catch(error => {
        console.log('heeeeere')
        console.error(error);
        process.exit(1);
      });
  })