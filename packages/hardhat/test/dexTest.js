const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

//
// this script executes when you run 'yarn test'
//
// you can also test remote submissions like:
// CONTRACT_ADDRESS=0x43Ab1FCd430C1f20270C2470f857f7a006117bbb yarn test --network rinkeby
//
// you can even run mint commands if the tests pass like:
// yarn test && echo "PASSED" || echo "FAILED"
//

describe("🚩 Challenge 4: 🏵 DEX 🤖", function () {

  this.timeout(125000);

  let balloons;



  if(process.env.CONTRACT_ADDRESS){
    // live contracts, token already deployed
  }else{
    it("Should deploy Ballons", async function () {
      const Balloons = await ethers.getContractFactory("Balloons");
      balloons = await Balloons.deploy();
    });
    describe("totalSupply()", function () {

      it("Should have a total supply of at least 1000", async function () {
        const totalSupply = await balloons.totalSupply();
        const totalSupplyInt = parseInt(ethers.utils.formatEther(totalSupply))
        console.log('\t'," 🧾 Total Supply:",totalSupplyInt)
        expect(totalSupplyInt).to.greaterThan(999);

      });
    })

  }


  let dex;


  if(process.env.CONTRACT_ADDRESS){
    // live contracts, token already deployed
  }else{
    it("Should deploy Dex", async function () {
      const DEX = await ethers.getContractFactory("DEX");
      dex = await DEX.deploy(balloons.address);
    });
  }

  describe("DEX Init", function () {
    it("Should have a total liquidity of 3 balloon and 3 ethereum", async function () {
        //await balloons.transfer(owner.address,""+(10*10**18));
        await balloons.approve(dex.address,ethers.utils.parseEther('100'));
        console.log("INIT exchange...")
        const init_wait = await dex.init(""+(3*10**18),{value:ethers.utils.parseEther('3'),gasLimit:200000})
        //expect(0).to.equal(0);
        console.log('\t'," ⏳ Waiting for confirmation...")

        const result_txt =  await init_wait.wait();
        const ethReserve = await dex.getTotalLiquidity();
        ethReserveInt = parseInt(ethers.utils.formatEther(ethReserve));
        expect(ethReserveInt).to.equal(3);
        const tokenReserve = await dex.getTokenBalance();
        tokenReserveInt = parseInt(ethers.utils.formatEther(tokenReserve));
        expect(tokenReserveInt).to.equal(3);
    });
    it("Liquidity should be added to the pool 2 ether", async function () {
        const [ owner ] = await ethers.getSigners();
        console.log('\t'," 🧑‍🏫 Tester Address: ",owner.address)

        const startingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth starting balance: ",ethers.utils.formatEther(startingBalance))

        const tokenStartingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token starting balance: ",ethers.utils.formatEther(tokenStartingBalance))

        const deposit_ret = await dex.deposit({value:ethers.utils.parseEther('2'),gasLimit:200000});

        console.log('\t'," ⏳ Waiting for confirmation...")

        const result_txt =  await deposit_ret.wait();

        const txCost = result_txt.gasUsed.mul(result_txt.effectiveGasPrice);

        const ethLiquidity = await dex.getTotalLiquidity();
        ethLiquidityInt = parseInt(ethers.utils.formatEther(ethLiquidity));
        console.log('\t'," ⚖️ Total liquidity: ",ethLiquidityInt);
        expect(ethLiquidityInt).to.equal(5);

        const tokenReserve = await dex.getTokenBalance();
        tokenReserveInt = parseInt(ethers.utils.formatEther(tokenReserve));
        console.log('\t'," ⚖️ Token reserve: ",tokenReserveInt);
        expect(tokenReserveInt).to.equal(5);
        const endingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ Eth Ending balance: ",ethers.utils.formatEther(endingBalance));
        expect(startingBalance.sub(ethers.utils.parseEther("2"))).to.equal(endingBalance.add(txCost));
        const tokenEndingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ Token Ending balance: ",ethers.utils.formatEther(tokenEndingBalance))
        expect(tokenStartingBalance.sub(ethers.utils.parseEther("2"))).to.equal(tokenEndingBalance);
    });
    it("Remove liquidity to the pool", async function () {
        const [ owner ] = await ethers.getSigners();
        console.log('\t'," 🧑‍🏫 Tester Address: ",owner.address)

        const startingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth starting balance: ",ethers.utils.formatEther(startingBalance))
        const tokenStartingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token starting balance: ",ethers.utils.formatEther(tokenStartingBalance))

        const withdrawResult = await dex.withdraw(""+ ethers.utils.parseEther('2'));
        console.log('\t'," ⏳ Waiting for confirmation...")
        const result_txt =  await withdrawResult.wait();

        const txCost = result_txt.gasUsed.mul(result_txt.effectiveGasPrice);

        const ethLiquidity = await dex.getTotalLiquidity();
        ethLiquidityInt = parseInt(ethers.utils.formatEther(ethLiquidity));
        console.log('\t'," ⚖️ Total liquidity: ",ethReserveInt);
        expect(ethLiquidityInt).to.equal(3);

        const tokenReserve = await dex.getTokenBalance();
        tokenReserveInt = parseInt(ethers.utils.formatEther(tokenReserve));
        console.log('\t'," ⚖️ Token reserve: ",tokenReserveInt);
        expect(tokenReserve).to.equal(ethers.utils.parseEther("3"));

        let endingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth ending balance: ",ethers.utils.formatEther(endingBalance));
        expect((endingBalance.sub(startingBalance)).add(txCost)).to.equal(ethers.utils.parseEther("2"));

        const tokenEndingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token Ending balance: ",ethers.utils.formatEther(tokenEndingBalance))
        expect((tokenEndingBalance.sub(tokenStartingBalance))).to.equal(ethers.utils.parseEther("2"));
    });
    it("Verify price function", async function () {
      const eth_amount = ethers.utils.parseEther('3');
      const ethReserve = ethers.utils.parseEther('3');
      const tokenReserve = ethers.utils.parseEther('3');
      console.log('\t'," ⚖️ Pool eth reserve: ",ethers.utils.formatEther(ethReserve));
      console.log('\t'," ⚖️ Pool token reserve: ",ethers.utils.formatEther(tokenReserve));

      const ethToTokenPrice = await dex.price(eth_amount,ethReserve,tokenReserve);
      console.log('\t'," ⚖️ Token Price: ",ethers.utils.formatEther(ethToTokenPrice));
      expect(ethToTokenPrice.div(10000)).to.equal(149774661992989); //compared against the excel prototype
    });
    it("Verify input price function is dual to output price function", async function () {
      const eth_amount = ethers.utils.parseEther('3');
      const ethReserve = await dex.getEthBalance();
      const tokenReserve = await dex.getTokenBalance();
      console.log('\t'," ⚖️ Pool eth reserve: ",ethers.utils.formatEther(ethReserve));
      console.log('\t'," ⚖️ Pool token reserve: ",ethers.utils.formatEther(tokenReserve));

      const ethToTokenPrice = await dex.price(eth_amount,ethReserve,tokenReserve);
      console.log('\t'," ⚖️ Token Price: ",ethers.utils.formatEther(ethToTokenPrice));
      let new_eth_amount = await dex.price_output(ethToTokenPrice,tokenReserve,ethReserve);
      new_eth_amount = new_eth_amount.add(ethers.utils.parseEther("0.000000000000001")).div(10000);
      expect(new_eth_amount).to.equal(eth_amount.div(10000));

      const token_amount = ethers.utils.parseEther('2');
      const eth_ptoken = await dex.price_output(token_amount,ethReserve,tokenReserve);
      console.log('\t'," ⚖️ Eth per Token ",ethers.utils.formatEther(eth_ptoken));
      let new_token_amount = await dex.price(eth_ptoken,ethReserve,tokenReserve);
      new_token_amount = new_token_amount.add(ethers.utils.parseEther("0.000000000000001")).div(10000);
      expect(new_token_amount).to.equal(token_amount.div(10000));
    });
    it("2 Eth to Token", async function () {
        const [ owner ] = await ethers.getSigners();
        console.log('\t'," 🧑‍🏫 Tester Address: ",owner.address)

        const startingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth starting balance: ",ethers.utils.formatEther(startingBalance))
        const tokenStartingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token starting balance: ",ethers.utils.formatEther(tokenStartingBalance))

        const eth_amount = ethers.utils.parseEther('2');
        const ethReserve = await dex.getEthBalance();
        const tokenReserve = await dex.getTokenBalance();
        console.log('\t'," ⚖️ Pool eth reserve: ",ethers.utils.formatEther(ethReserve));
        console.log('\t'," ⚖️ Pool token reserve: ",ethers.utils.formatEther(tokenReserve));

        const tokenPrice = await dex.price(eth_amount,ethReserve,tokenReserve);
        console.log('\t'," ⚖️ Token Price: ",ethers.utils.formatEther(tokenPrice));

        const ethTok = await dex.ethToToken({value:eth_amount,gasLimit:200000});
        const result_txt =  await ethTok.wait();
        const txCost = result_txt.gasUsed.mul(result_txt.effectiveGasPrice);

        console.log('\t'," ⏳ Waiting for confirmation...")
        const tokenEndingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token ending balance: ",ethers.utils.formatEther(tokenEndingBalance))
        // check token quantity bought
        const tokenReserveEnd = await dex.getTokenBalance();
        const token_bought = tokenEndingBalance.sub(tokenStartingBalance);
        console.log('\t'," ⚖️ Token bought: ",ethers.utils.formatEther(token_bought));
        const newTokenRes = tokenReserve.sub(token_bought);
        const newTokenResDex = await dex.getTokenBalance();
        expect(newTokenRes).to.equal(newTokenResDex);

        // check eth pool reserve
        const eth_amount_rev = await dex.price_output(token_bought,tokenReserve,ethReserve);
        console.log('\t'," ⚖️ Eth Amount: ",ethers.utils.formatEther(eth_amount_rev));
        const newEthReserve = ((ethReserve.add(eth_amount_rev)).add(ethers.utils.parseEther("0.000000000000001"))).div(10000);
        console.log('\t'," ⚖️ New Eth Reserve: ",ethers.utils.formatEther(newEthReserve));
        const ethEndReserve = await dex.getEthBalance();
        expect(newEthReserve).to.equal(ethEndReserve.div(10000));

        const endingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth ending balance: ",ethers.utils.formatEther(endingBalance))
    });
    it("2 Token to Eth", async function () {
        const [ owner ] = await ethers.getSigners();
        console.log('\t'," 🧑‍🏫 Tester Address: ",owner.address)

        const startingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth starting balance: ",ethers.utils.formatEther(startingBalance))
        const tokenStartingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token starting balance: ",ethers.utils.formatEther(tokenStartingBalance))

        const token_amount = ethers.utils.parseEther('2');
        const ethReserve = await dex.getEthBalance();
        const tokenReserve = await dex.getTokenBalance();
        console.log('\t'," ⚖️ Pool eth reserve: ",ethers.utils.formatEther(ethReserve));
        console.log('\t'," ⚖️ Pool token reserve: ",ethers.utils.formatEther(tokenReserve));

        const ethToTokenPrice = await dex.price(token_amount,tokenReserve,ethReserve);
        console.log('\t'," ⚖️ Token Price: ",ethers.utils.formatEther(ethToTokenPrice));

        const tokEth = await dex.tokenToEth(token_amount);
        const result_txt =  await tokEth.wait();
        console.log('\t'," ⏳ Waiting for confirmation...")
        const tokenEndingBalance = await balloons.balanceOf(owner.address);
        console.log('\t'," ⚖️ User token ending balance: ",ethers.utils.formatEther(tokenEndingBalance))
        // check eth quantity returned
        const ethReserveEnd = await dex.getEthBalance();
        const ethSwapped = ethReserve.sub(ethReserveEnd);
        console.log('\t'," ⚖️ Token bought: ",ethers.utils.formatEther(ethSwapped))
        const newEthRes = ethReserve.sub(ethSwapped);
        const newEthResDex = await dex.getEthBalance();
        expect(newEthRes).to.equal(newEthResDex);

        // check token pool reserve
        const token_amount_rev = await dex.price_output(ethSwapped,ethReserve,tokenReserve);
        console.log('\t'," ⚖️ Token Amount: ",ethers.utils.formatEther(token_amount_rev));
        const newTokenReserve = ((tokenReserve.add(token_amount_rev)).add(ethers.utils.parseEther("0.000000000000001"))).div(10000);
        console.log('\t'," ⚖️ New Token Reserve: ",ethers.utils.formatEther(newTokenReserve));
        const tokenEndReserve = await dex.getTokenBalance();
        expect(newTokenReserve).to.equal(tokenEndReserve.div(10000));

        const endingBalance = await ethers.provider.getBalance(owner.address);
        console.log('\t'," ⚖️ User eth ending balance: ",ethers.utils.formatEther(endingBalance))
    });
  });
});
