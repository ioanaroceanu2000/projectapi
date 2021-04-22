const fs = require('fs');
const express = require('express');
const math = require('mathjs');

const Web3 = require('web3');
const Provider = require('@truffle/hdwallet-provider');
const address = '0x614114ec0a5a6def6172d8cb210facb63d459c04';
const privateKey = '8ba9b5140d9b73afbdbb177247abe308242eaa55a955a52f7ebf2c2ca8aae99a';
/*const address = '0x237B455017bCdEe955086aCbc0D9B8aa2A142da8';
const privateKey = 'fa48156963fd5933453a2c0b6980ce827d0f93d4e4d65cb6c23baf4e1c51c57c';*/
const infuraUrl = "https://ropsten.infura.io/v3/78d88b785a5344a8bdeb7a47a9698f34";
const CONTRACT_ADDRESS = "0xFA586F851AEd88ced0F07FE3611d8768F7f57e9B";
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "ivar_add",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "exchange_add",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "lm_address",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "Loan",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "lm_add",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tknsData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "utilisation",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "collateral_factor",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalBorrowed",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalDeposited",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "totalCollateral",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exchangeable",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "trustedTkns",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "uBal",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "depositedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "init_ir_deposit",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cummulated_dep",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknDeposited",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "collateralAmount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknCollateralised",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "borrowedAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "init_ir_borrow",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "cummulated_borr",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknBorrowed",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_tkn_address",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_optimal_utilisation",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_collateral_factor",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_base_rate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_slope1",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_slope2",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_spread",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "truested",
        "type": "bool"
      }
    ],
    "name": "createtkn",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "tryDiscardLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "colltkn",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "minusColl",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "borrtkn",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "minusBorr",
        "type": "uint256"
      }
    ],
    "name": "modifyReserves",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tkn",
        "type": "address"
      }
    ],
    "name": "updatetknPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tkn",
        "type": "address"
      }
    ],
    "name": "checkExchangeability",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknId",
        "type": "address"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknId",
        "type": "address"
      }
    ],
    "name": "borrow",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "tknId",
        "type": "address"
      }
    ],
    "name": "depositCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "repay",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "redeem",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address payable",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "redeemCollateral",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getHealthFactor",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "liquidate",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const EXCHANGE_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "tokensData",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "symbol",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "exchangeable",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_symbol",
        "type": "string"
      }
    ],
    "name": "createPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "switchToUnexchangable",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "isExchangeable",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_price",
        "type": "uint256"
      }
    ],
    "name": "updatePrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address[]",
        "name": "tokens",
        "type": "address[]"
      },
      {
        "internalType": "uint256[]",
        "name": "_prices",
        "type": "uint256[]"
      }
    ],
    "name": "updatePrices",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  }
];
const EXCHANGE_ADD = "0x9ea5A0E41CFb5395d0aF1dc379e0df947240DAa2";
const provider = new Provider(privateKey, infuraUrl);
const web3 = new Web3(provider);


const liquidatedAccounts = {};

async function liquidate() {
  const networkId = await web3.eth.net.getId();
  const myContract = new web3.eth.Contract(
    CONTRACT_ABI,
    CONTRACT_ADDRESS
  );
  // get past events
  const START_BLOCK = 1;
  myContract.getPastEvents("Loan",
      {
          fromBlock: START_BLOCK,
      })
  .then(function(events){
    var eventIndex = 0;
    while(events[eventIndex] != undefined){
      var obj = events[eventIndex];
      const user = obj.returnValues.user;
      eventIndex ++;
      var borrowedAmount = 0;
      var collateralAmount = 0;
      var borrowedToken = null;
      var collateralToken = null;
      // check user's details -if they still have a loan
      myContract.methods.uBal(user).call().then(function(response){

        if(response.cummulated_borr != 0){
          borrowedAmount = response.cummulated_borr;
          collateralAmount = response.collateralAmount;
          collateralToken = response.tknCollateralised;
          borrowedToken = response.tknBorrowed;
          myContract.methods.tknsData(borrowedToken).call().then(function(res){
            console.log(res.price);
          });

          // check health facor
          myContract.methods.getHealthFactor(user).call().then(function(healthFactor){
            // if unsafe health factor
            console.log("Account " + user + " took a loan");
            console.log("Health factor of " + healthFactor/1000);
            if(healthFactor < 1000){
              console.log("Unhealthy Loan");
              console.log(user);
              console.log(healthFactor);
              // liquidate loan
              myContract.methods.liquidate(user).send({from: address}).on('receipt', function(){
                // check if loan was liquidated
                myContract.methods.uBal(user).call().then(function(resp2){
                  if(resp2.cummulated_borr == 0){
                    liquidatedAccounts[user] = {borrowedAmount: borrowedAmount, collateralAmount: collateralAmount, collateralToken: collateralToken, borrowedToken: borrowedToken};
                  }
                });
              }).on('error',function(error){console.log(error);});
            }
          });

        }
      });
    }
  })
  .catch((err) => console.error(err));

  setTimeout(liquidate, 600000); // run every 10 minutes
}

async function updateProtocolPrices(){
  // for every token in added tokens
  let addedTokensData = JSON.parse(fs.readFileSync('LoadedTokens.json'));
  var i;
  console.log(addedTokensData.length);
  for(i=0; i < addedTokensData.length; i++){
    var price = findTokenPrice(addedTokensData[i].realID);
    console.log(price);
    console.log(addedTokensData[i].fakeID);
    await updateExchangePricesFromOwner(addedTokensData[i].fakeID, price);
  }
  setTimeout(updateTokenIdPrice, 120000); // run every 2 minutes
}

updateProtocolPrices();

function findTokenPrice(token){
  let tokenIDPrices = JSON.parse(fs.readFileSync('TokenIdPrices.json'));
  var i;
  for(i=0; i < 230; i++){
    if(tokenIDPrices[i].id == token){
      return tokenIDPrices[i].prices;
    }
  }
  return 0;
}

async function updateExchangePricesFromOwner(token, price){
  const networkId = await web3.eth.net.getId();
  const exchange = new web3.eth.Contract(
    EXCHANGE_ABI,
    EXCHANGE_ADD
  );
  const account = await web3.utils.toChecksumAddress('0x614114ec0a5a6def6172d8cb210facb63d459c04');
  const priceRounded = Math.round(price*1000);
  await exchange.methods.updatePrice(token, priceRounded).send({from: account}).on('receipt', function(receipt){
    console.log("Prices Updated in EXCHANGE");
  }).on('error', function(err){
    console.log(err);
  });
}

module.exports = {
  liquidate: async function () {
    const networkId = await web3.eth.net.getId();
    const myContract = new web3.eth.Contract(
      CONTRACT_ABI,
      CONTRACT_ADDRESS
    );
    // get past events
    const START_BLOCK = 1;
    myContract.getPastEvents("Loan",
        {
            fromBlock: START_BLOCK,
        })
    .then(function(events){
      var eventIndex = 0;
      while(events[eventIndex] != undefined){
        var obj = events[eventIndex];
        const user = obj.returnValues.user;
        eventIndex ++;
        var borrowedAmount = 0;
        var collateralAmount = 0;
        var borrowedToken = null;
        var collateralToken = null;
        // check user's details -if they still have a loan
        myContract.methods.uBal(user).call().then(function(response){

          if(response.cummulated_borr != 0){
            borrowedAmount = response.cummulated_borr;
            collateralAmount = response.collateralAmount;
            collateralToken = response.tknCollateralised;
            borrowedToken = response.tknBorrowed;
            // check health facor
            myContract.methods.getHealthFactor(user).call().then(function(healthFactor){
              // if unsafe health factor
              console.log("Account " + user + " took a loan");
              console.log("Health factor of " + healthFactor/1000);
              if(healthFactor < 1000){
                console.log("Unhealthy Loan");
                console.log(user);
                console.log(healthFactor);
                // liquidate loan
                myContract.methods.liquidate(user).send({from: address}).on('receipt', function(){
                  // check if loan was liquidated
                  myContract.methods.uBal(user).call().then(function(resp2){
                    if(resp2.cummulated_borr == 0){
                      liquidatedAccounts[user] = {borrowedAmount: borrowedAmount, collateralAmount: collateralAmount, collateralToken: collateralToken, borrowedToken: borrowedToken};
                    }
                  });
                }).on('error',function(error){console.log(error);});
              }
            });

          }
        });
      }
    })
    .catch((err) => console.error(err));

    setTimeout(liquidate, 600000); // run every 10 minutes
  },
  updateProtocolPrices: async function () {
    // for every token in added tokens
    let addedTokensData = JSON.parse(fs.readFileSync('LoadedTokens.json'));
    var i;
    for(i=0; i < addedTokensData.length; i++){
      var price = findTokenPrice(addedTokensData[i].realID);
      console.log(price);
      console.log(addedTokensData[i].fakeID);
      await updateExchangePricesFromOwner(addedTokensData[i].fakeID, price);
    }
    setTimeout(updateProtocolPrices, 120000); // run every 2 minutes
  }
};
