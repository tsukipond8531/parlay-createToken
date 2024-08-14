const { ethers } = require('ethers');
require('dotenv').config();

const parlayJson = require('./contracts/ParlayCoreSimple.json');
const parlayAbi = parlayJson.abi;

const rpcUrl = `https://sepolia.infura.io/v3/${process.env.infuraKey}`;

async function main() {
  try {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const chainId = (await provider.getNetwork()).chainId;
    const owner = new ethers.Wallet(process.env.privateKey, provider);

    const parlayContract = new ethers.Contract(
      process.env.parlayAddress,
      parlayAbi,
      owner
    );

    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const timestamp = block.timestamp;    
    
    const name = 'ParlayTestToken';
    const symbol = 'PTEST';
    const deadline = timestamp + 3600;
    const etherFee = ethers.utils.parseEther('0.01');
    const etherBuy = 0;
    const initialMaxWalletBalance = ethers.utils.parseEther('10000');
    const isDevLockup = false;
    const sigNonce = await parlayContract.signatureNonces(owner.address);    
    
    const eip712Message = {
      "domain": {
        "name": "ParlayCoreSimple",
        "version": "1",
        "chainId": chainId,
        "verifyingContract": process.env.parlayAddress,
      },
      "primaryType": "CreateTokenRequest",
      "types": {
        "EIP712Domain": [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" }
          ],
        "CreateTokenRequest": [
          { name: "name", type: "string" },
          { name: "symbol", type: "string" },
          { name: "deadline", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "creatorSignatureNonce", type: "uint256" },
          { name: "etherFee", type: "uint256" },
          { name: "etherBuy", type: "uint256" },
          { name: "initialMaxWalletBalance", type: "uint256" },
          { name: "isDevLockup", type: "bool" },
        ],
      },
      "message": {
        "name": name,
        "symbol": symbol,
        "deadline": deadline,
        "creator": owner.address,
        "creatorSignatureNonce": sigNonce.toString(),
        "etherFee": etherFee.toString(),
        "etherBuy": etherBuy.toString(),
        "initialMaxWalletBalance": initialMaxWalletBalance.toString(),
        "isDevLockup": isDevLockup,
      }
    }

    const domain = eip712Message['domain'];
    const message = eip712Message['message'];
    const types = {
      "CreateTokenRequest": [
        { name: "name", type: "string" },
        { name: "symbol", type: "string" },
        { name: "deadline", type: "uint256" },
        { name: "creator", type: "address" },
        { name: "creatorSignatureNonce", type: "uint256" },
        { name: "etherFee", type: "uint256" },
        { name: "etherBuy", type: "uint256" },
        { name: "initialMaxWalletBalance", type: "uint256" },
        { name: "isDevLockup", type: "bool" },
      ],
    };


    const signature =await owner._signTypedData(domain, types, message);  
    const sig = ethers.utils.splitSignature(signature);  
    const res = await parlayContract.connect(owner).createToken(name, symbol, deadline, etherFee, etherBuy, initialMaxWalletBalance, isDevLockup, sig.v, sig.r, sig.s, {value: ethers.utils.parseEther('0.01')});
    console.log(res.hash);
  } catch (err) {
    console.log(err);
  }
}

main();