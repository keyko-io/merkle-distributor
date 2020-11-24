import hre from "hardhat";
import { ContractFactory } from "ethers";

async function main() {
    const ERC20Test: ContractFactory = await hre.ethers.getContractFactory("TestERC20");
    const erc20 = await ERC20Test.deploy('ecw', 'emcoin', '123456789123456789012345678');

    const MerkleDistributor: ContractFactory = await hre.ethers.getContractFactory("MerkleDistributor");
    const merkleDistributor = await MerkleDistributor.deploy(erc20.address, "0x7816b5d5f383cdb81cd54e2973b0e6529be4858cc3a9ed48c362d59b4d91f402");
  
    console.log("MerkleDistributor deployed to:", merkleDistributor.address);
 }


  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });