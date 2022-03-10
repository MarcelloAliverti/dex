pragma solidity >=0.8.0 <0.9.0;
// SPDX-License-Identifier: MIT
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {

  IERC20 token;

  uint256 public totalLiquidity;
  mapping (address => uint256) public liquidity;

  constructor(address token_addr) {
    token = IERC20(token_addr);
  }

  function init(uint256 tokens) public payable returns (uint256) {
    require(totalLiquidity==0,"DEX:init - already has liquidity");
    totalLiquidity = address(this).balance;
    liquidity[msg.sender] = totalLiquidity;
    require(token.transferFrom(msg.sender, address(this), tokens));
    return totalLiquidity;
  }

  function price(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) public view returns (uint256) {
    uint256 input_amount_with_fee = input_amount * 997; // 3%
    uint256 numerator = input_amount_with_fee * output_reserve;
    uint256 denominator = 1000* input_reserve + input_amount_with_fee;
    return numerator / denominator;
  }

  function price_output(uint256 input_amount, uint256 input_reserve, uint256 output_reserve) public view returns (uint256) {
    require(input_amount>0,"Input amount should be greater then 0");
    require(input_amount<input_reserve,"Input amount should be less then input reserve");
    uint256 numerator = (input_amount * output_reserve * 1000);
    uint256 denominator = (997* (input_reserve - input_amount));
    uint256 output_amount = (numerator / denominator) +1;
    return output_amount;
  }

  function ethToToken() public payable returns (uint256) {
    require(msg.value > 0,"Swap some ethereum for tokens!");
    uint256 token_reserve = token.balanceOf(address(this));
    uint256 tokens_bought = price(msg.value, address(this).balance-msg.value, token_reserve);
    require(token.transfer(msg.sender, tokens_bought));
    return tokens_bought;
  }

  function tokenToEth(uint256 tokens) public returns (uint256) {
    require(tokens > 0,"Swap some tokens for ethereum!");
    uint256 token_reserve = token.balanceOf(address(this));
    uint256 eth_bought = price(tokens, token_reserve, address(this).balance);
    payable(msg.sender).transfer(eth_bought);
    require(token.transferFrom(msg.sender, address(this), tokens));
    return eth_bought;
  }

  function deposit() public payable returns (uint256) {
    require(msg.value > 0,"Deposit some ethereum!");
    uint256 eth_reserve = address(this).balance - msg.value;
    uint256 token_reserve = token.balanceOf(address(this));
    uint256 token_amount = (msg.value * token_reserve) / eth_reserve;
    totalLiquidity += (msg.value * totalLiquidity) / eth_reserve;
    liquidity[msg.sender] += msg.value;
    require(token.transferFrom(msg.sender, address(this), token_amount));
    return totalLiquidity;
  }

  function withdraw(uint256 liq_amount) public returns (uint256, uint256) {
    require(liq_amount > 0,"Withdraw some etherum!");
    require(liquidity[msg.sender]>=liq_amount ,"Withdraw amount exceed!");
    uint256 token_reserve = token.balanceOf(address(this));
    uint256 eth_amount = (liq_amount * address(this).balance) / totalLiquidity;
    uint256 token_amount =  ( liq_amount * token_reserve) / totalLiquidity;
    liquidity[msg.sender] -= liq_amount;
    totalLiquidity -= liq_amount;
    (bool sent, ) = msg.sender.call{value: eth_amount}("");
    require(sent, "Failed to send user eth.");
    require(token.transfer(msg.sender, token_amount));
    return (eth_amount, token_amount);
  }

  function getTotalLiquidity() public view returns(uint256){
    return totalLiquidity;
  }

  function getEthBalance() public view returns(uint256){
    return address(this).balance;
  }

  function getTokenBalance() public view returns(uint256){
    return token.balanceOf(address(this));
  }
}
