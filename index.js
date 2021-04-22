//const pairsCalcul = require('./pairs.js');
const axios = require('axios');
const pairsData = require('./Output.json'); //ONLY HAS 1600 pairs!!!
const fs = require('fs');
const express = require('express');
const math = require('mathjs');
const bodyParser = require('body-parser');
const contractCalls = require("./liquidate.js");

const app = express();
// Parse JSON bodies (as sent by API clients)
app.use(bodyParser.json());
// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded());

// POST REQUESTS
app.post('/loadedTokens',(req, res) => {
  // check item
  if(req.body.symbol != null && req.body.realID != null && req.body.fakeID != null){
    let tokensVariables = JSON.parse(fs.readFileSync('LoadedTokens.json'));
    tokensVariables.push(req.body);
    let json = JSON.stringify(tokensVariables);
    fs.writeFile('LoadedTokens.json', json, (err) => {
        // In case of a error throw err.
        if (err) throw err;
    });
    res.sendStatus(200);
  }else{
    res.sendStatus(404);
  }
  // push to the jason obj from
});


const UNI_URL = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2';
const WETH_ADD = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

//GET REQUESTS

// get list of loaded tokens on the website
app.get('/loadedTokens', async (req, res) => {
  const data = JSON.parse(fs.readFileSync('LoadedTokens.json'));;
  res.send({loadedTokens: data});
});

// get request for data from the TokenIdPrice
app.get('/tokenPrices', async (req, res) => {
  const price = JSON.parse(fs.readFileSync('TokenIdPrices.json'));;
  res.send({prices: price});
});

app.get('/ethPriceUSD', async (req, res) => {
  const price = await ethPriceUSD();
  res.send({priceETH: price});
});

app.get('/tokenPriceUSD/:tokenId', async (req, res) => {

  try{
    const price = await tokenPriceUSD(req.params.tokenId);
    res.send({priceOfToken: price});
  }catch(error){
    console.error('Error in getting price', error);
  }
});

app.get('/interestRateVars', async (req, res) => {
  try{
    let tokensVariables = readIRVariables();
    res.send(tokensVariables);
  }catch(err){
    res.send(err)
  }
});


const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`Listening no port ${port}...`));


// COINGECO REQUESTS

//get from COINGECO the 1st
const getByMarketCap = async () => {
  try{
    const resultPage1 = await axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=1h");
    const resultPage2 = await axios.get("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2&sparkline=false&price_change_percentage=1h");
    let dictSymbolsPriceChange = [];
    for(i = 0; i < 250; i++){
      const symbol = resultPage1.data[i].symbol.toUpperCase();
      const priceChange = resultPage1.data[i].price_change_percentage_1h_in_currency;
      const volume24h = resultPage1.data[i].total_volume;
      dictSymbolsPriceChange.push([symbol,priceChange, volume24h]);
    }
    for(i = 0; i < 250; i++){
      const symbol = resultPage2.data[i].symbol.toUpperCase();
      const priceChange = resultPage2.data[i].price_change_percentage_1h_in_currency;
      const volume24h = resultPage2.data[i].total_volume;
      dictSymbolsPriceChange.push([symbol,priceChange, volume24h]);
    }
    return dictSymbolsPriceChange;
  }catch(err){
    console.log("Error in getting symbols and price changes from Coingeco", err);
    return 0;
  }
}

// CREATE LIST OF Wanted tokens
// parse through coingeco list
// check if symbol exists in uniswap -> pick the one with higest volume and liquidity> 10000
// add ID and and symbol to list
// then figure out how you got Volume and std
// get average volume over the last 30 days
async function createListTokens(){
  console.log("try building list");
  const dictSymbolsPriceChange = await getByMarketCap(); //[symbol, priceChange1h, volume24h]
  console.log(dictSymbolsPriceChange);
  let tokensData = {};
  let index = 0;

  // add WETH on the list (artificially)
  let symbolWETH = "WETH"
  let priceChangeWETH = dictSymbolsPriceChange[1][1];
  let volume24hWETH = dictSymbolsPriceChange[1][2];
  // check if token is on uniswap (is ERC20)
  const existentIDWETH = await getTokenbySymbol(symbolWETH);
  if(existentIDWETH){
    const creationDateWETH = await dateCreationPairWithEth(existentIDWETH.id);
    let tokenData = {id: existentIDWETH.id, symbol: existentIDWETH.symbol, volume: volume24hWETH, volatility: priceChangeWETH, creationDate: creationDateWETH};
    tokensData[index] = tokenData;
    index++;
  }

  //parse through every token from coingeco
  for(i = 0; i < dictSymbolsPriceChange.length; i++){
    let symbol = dictSymbolsPriceChange[i][0];
    if(symbol == "SUSD"){
      symbol = "sUSD"
    }
    let priceChange = dictSymbolsPriceChange[i][1];
    let volume24h = dictSymbolsPriceChange[i][2];
    // check if token is on uniswap (is ERC20)
    const existentID = await getTokenbySymbol(symbol);
    if(existentID){
      const creationDate = await dateCreationPairWithEth(existentID.id);
      let tokenData = {id: existentID.id, symbol: existentID.symbol, volume: volume24h, volatility: priceChange, creationDate: creationDate};
      tokensData[index] = tokenData;
      index++;
    }
  }
  json = JSON.stringify(tokensData); //convert it back to json
  fs.writeFileSync('TokensData.json', json) // write it back
}

//createListTokens().then(resp => {console.log(resp)});



//GRAPHQL REQUESTS

//get token id by symbol from the graph or false if not existent
const getTokenbySymbol = async (symbol) => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          tokens(where: {symbol: "${symbol}", tradeVolumeUSD_gt: 1000, totalLiquidity_gt: 1000}, orderBy: tradeVolumeUSD, orderDirection: desc) {
            symbol
            id
          }
        }`
      }
    );
    if(result.data.data.tokens[0] == null){ return false;}
    return result.data.data.tokens[0];
  }catch(err){
    console.log("Error in tokens Volume Order", err);
    return false;
  }
}

//price of ETH in USD
const ethPriceUSD = async () => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          bundle(id: "1") {
            id
            ethPrice
          }
        }`
      }
    );
    return result.data.data.bundle.ethPrice;
  }catch(error){
    console.error('Error in token price', error);
  }
}

//price of ETH in USD
const tokenDerivedEth = async (tokenId) => {
  try{
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          token(id: "${tokenId}" ) {
            id
            symbol
            derivedETH
          }
        }`
      }
    );
    return result.data.data.token.derivedETH;
  }catch(error){
    console.error('Error in token derived Eth', error);
  }
}

//price of given token in USD
const tokenPriceUSD = async (tokenId) => {

  const result = await axios.post(
    UNI_URL,
    {
      query: `{
        token(id: "${tokenId}" ) {
          id
          symbol
          derivedETH
        }
      }`
    }
  );
  ethPrice = await ( ethPriceUSD() );
  price = result.data.data.token.derivedETH * ethPrice;
  return price;
}

//created at timestamp
const dateCreationPairWithEth = async (tokenId) => {
  // array of ids for [WETH, DAI, USDC,USDT,sUSD,BUSD,TUSD]
  const keyTokens = ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "0x6b175474e89094c44da98b954eedeac495271d0f", "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48","0xdac17f958d2ee523a2206206994597c13d831ec7", "0x57ab1ec28d129707052df4df418d58a2d46d5f51", "0x4fabb145d64652a948d72533023f6e7a623c7c53","0x0000000000085d4780b73119b644ae5ecd22b376"];
  if(keyTokens.includes(tokenId)){
    return 1;
  }
  try{
    //find pairs using token id
    let pairId = 0;
    var i = 0;
    while(i < 7 && pairId == 0){
      pairId = getPairId(keyTokens[i],tokenId);
      i++;
    }
    if(pairId == 0){
      console.log('pair not found');
      return 0;
    }
    const result = await axios.post(
      UNI_URL,
      {
        query: `{
          pair(id: "${pairId}") {
            createdAtTimestamp
          }
        }`
      }
    );
    var timestamp = result.data.data.pair.createdAtTimestamp;
    var date = new Date(timestamp*1000);
    return date.toUTCString();
  }catch(error){
    console.error('Error in date creation', error);
    return 0;
  }
}



function readIRVariables(){
  let tokensVariables = JSON.parse(fs.readFileSync('InterestRateVars.json'));
  return tokensVariables;
}

// register TOKEN ID PRICE
async function registerTokenIdPrice(){
  //list of ids
  console.log('register token id price');
  let tokensDetails = await JSON.parse(fs.readFileSync('TokensData.json'));
  let ethPrice = await ethPriceUSD();
  var obj = {};
  for(i=0; i < 230; i++){
    let id = tokensDetails[i].id;
    let derivedETH = await tokenDerivedEth(id);
    let price = derivedETH*ethPrice;
    obj[i] = {id: id, prices: price};
  }
  json = JSON.stringify(obj);
  fs.writeFileSync('TokenIdPrices.json', json) // write it back
}


// update prices for TOKEN ID PRICE
async function updateTokenIdPrice(){
  //list of ids
  console.log('update prices');
  let tokensDetails = JSON.parse(fs.readFileSync('TokenIdPrices.json'));
  var obj = {};
  for(i=0; i < 230; i++){
    let id = tokensDetails[i].id;
    let price = await tokenPriceUSD(id);
    obj[i] = {id: id, prices: price};
  }
  json = JSON.stringify(obj);
  fs.writeFileSync('TokenIdPrices.json', json) // write it back
  console.log("finished updating");// cacatul asta ia 2.45 minute sa se termine
  setTimeout(updateTokenIdPrice, 150000); // run again after 2.5 minutes
}

// update prices every 5 minutes
updateTokenIdPrice();


//get pair id from two tokens addresses
function getPairId(token0, token1){
  try {
    const jsonString = fs.readFileSync('./Output.json');
    const pairsJson = JSON.parse(jsonString);
    if(pairsJson["pairs"][token0] != undefined && pairsJson["pairs"][token0][token1] != undefined){
      return pairsJson["pairs"][token0][token1].substring(0,42);
    }else {
      return 0;
    }
  } catch(err) {
    console.log('Error in getting the pair id', err);
    return 0;
  }
}

function readToken(){
  try {
    const jsonString = fs.readFileSync('./TokensVars.json');
    const pairsJson = JSON.parse(jsonString);
    console.log(pairsJson["0"][id])
  } catch(err) {
    console.log('Error in getting the pair id', err);
    return 0;
  }
}

contractCalls.liquidate();
//contractCalls.updateProtocolPrices();
