// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "hardhat/console.sol";

/**
 * @title Market
 * @dev An ERC1155-based prediction market using a Quadratic Market Maker.
 * Each market is a self-contained AMM for two outcome shares: YES and NO.
 */
contract Market is ERC1155 {
    // --- Constants ---
    uint256 public constant NO_SHARE_ID = 0;
    uint256 public constant YES_SHARE_ID = 1;
    // Scaling factor for all price and cost calculations to handle decimals
    uint256 private constant SCALING_FACTOR = 1e18;

    // --- Market Configuration (Immutable) ---
    address public immutable creator;
    address public immutable resolver;
    string public question;
    string public collectionSlug;
    uint256 public immutable targetPrice;
    uint256 public immutable resolutionTimestamp;

    // --- AMM State ---
    // Total number of shares minted for each outcome. This is the core of the QMM.
    uint256 public yesSharesTotal;
    uint256 public noSharesTotal;

    // --- Market Status ---
    enum Status { Open, Resolved }
    Status public status;
    bool public winningOutcome;

    // --- Events ---
    event Trade(
        address indexed user,
        bool indexed outcome,
        uint256 ethAmount,
        uint256 shareAmount
    );
    event MarketResolved(bool winningOutcome, uint256 finalReportedPrice);

    // --- Custom Errors ---
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error ResolutionTimeNotPassed();
    error OnlyResolver();
    error InvalidSharesToRedeem();
    error InsufficientPayment();

    // --- Constructor ---
    constructor(
        address _creator,
        string memory _question,
        string memory _collectionSlug,
        uint256 _targetPrice,
        uint256 _resolutionTimestamp,
        uint256 _initialLiquidity
    ) ERC1155("") payable {
        creator = _creator;
        resolver = _creator; // For this MVP, the creator is the resolver
        question = _question;
        collectionSlug = _collectionSlug;
        targetPrice = _targetPrice;
        resolutionTimestamp = _resolutionTimestamp;

        // The initial liquidity seeds the first shares.
        // Based on the cost function C = s^2 / 2, for an amount of liquidity L,
        // we can mint sqrt(2 * L) shares.
        // We use a simple square root approximation for this.
        uint256 initialShares = sqrt(_initialLiquidity * SCALING_FACTOR * 2);

        yesSharesTotal = initialShares;
        noSharesTotal = initialShares;

        _mint(_creator, YES_SHARE_ID, initialShares, "");
        _mint(_creator, NO_SHARE_ID, initialShares, "");
    }

    // --- Trading Functions ---

    /**
     * @dev Buys a specific number of shares.
     * The cost is calculated by the getCostForShares function and must be sent as msg.value.
     */
    function buyShares(bool _outcome, uint256 _sharesToBuy) external payable {
        if (status != Status.Open) revert MarketAlreadyResolved();
        
        uint256 cost = getCostForShares(_outcome, _sharesToBuy);
        if (msg.value < cost) revert InsufficientPayment();

        // Hardhat 3.0 Debugging
        console.log("--- Buy Shares ---");
        console.log("User:", msg.sender, " | Outcome:", _outcome ? "YES" : "NO");
        console.log("Shares to Buy:", _sharesToBuy, " | Cost:", cost);

        uint256 tokenId = _outcome ? YES_SHARE_ID : NO_SHARE_ID;
        if (_outcome) {
            yesSharesTotal += _sharesToBuy;
        } else {
            noSharesTotal += _sharesToBuy;
        }

        _mint(msg.sender, tokenId, _sharesToBuy, "");

        emit Trade(msg.sender, _outcome, cost, _sharesToBuy);

        // Refund any excess ETH sent
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }
    }

    /**
     * @dev Sells a specific number of shares.
     * The return is calculated by the getReturnForShares function.
     */
    function sellShares(bool _outcome, uint256 _sharesToSell) external {
        if (status != Status.Open) revert MarketAlreadyResolved();

        uint256 ethAmountOut = getReturnForShares(_outcome, _sharesToSell);
        
        uint256 tokenId = _outcome ? YES_SHARE_ID : NO_SHARE_ID;
        if (_outcome) {
            yesSharesTotal -= _sharesToSell;
        } else {
            noSharesTotal -= _sharesToSell;
        }

        _burn(msg.sender, tokenId, _sharesToSell);
        
        payable(msg.sender).transfer(ethAmountOut);
        emit Trade(msg.sender, _outcome, ethAmountOut, _sharesToSell);
    }

    // --- Resolution & Redemption ---

    function resolveMarket(uint256 _finalPrice) external {
        if (msg.sender != resolver) revert OnlyResolver();
        if (status != Status.Open) revert MarketAlreadyResolved();
        if (block.timestamp < resolutionTimestamp) revert ResolutionTimeNotPassed();

        status = Status.Resolved;
        winningOutcome = _finalPrice > targetPrice;

        emit MarketResolved(winningOutcome, _finalPrice);
    }

    function redeemShares() external {
        if (status != Status.Resolved) revert MarketNotResolved();

        uint256 tokenIdToRedeem = winningOutcome ? YES_SHARE_ID : NO_SHARE_ID;
        uint256 sharesToRedeem = balanceOf(msg.sender, tokenIdToRedeem);

        if (sharesToRedeem == 0) revert InvalidSharesToRedeem();
        
        _burn(msg.sender, tokenIdToRedeem, sharesToRedeem);
        
        // Each winning share is worth 1 ETH in this model.
        payable(msg.sender).transfer(sharesToRedeem);
    }

    // --- View Functions for QMM ---

    /**
     * @dev Calculates the ETH cost to purchase a given number of shares.
     * Cost function C(s) = (s^2 + 2*s*S_old) / 2, where S_old is current total shares.
     */
    function getCostForShares(bool _outcome, uint256 _sharesToBuy) public view returns (uint256) {
        uint256 currentShares = _outcome ? yesSharesTotal : noSharesTotal;
        uint256 cost = (_sharesToBuy * _sharesToBuy + 2 * _sharesToBuy * currentShares) / (2 * SCALING_FACTOR);
        return cost;
    }

    /**
     * @dev Calculates the ETH return for selling a given number of shares.
     * It's the inverse of the cost function.
     */
    function getReturnForShares(bool _outcome, uint256 _sharesToSell) public view returns (uint256) {
        uint256 currentShares = _outcome ? yesSharesTotal : noSharesTotal;
        // Cost(S_old) - Cost(S_old - s_sell)
        uint256 costBefore = (currentShares * currentShares) / (2 * SCALING_FACTOR);
        uint256 newSharesTotal = currentShares - _sharesToSell;
        uint256 costAfter = (newSharesTotal * newSharesTotal) / (2 * SCALING_FACTOR);
        return costBefore - costAfter;
    }

    /**
     * @dev Calculates the instantaneous price of one share (the derivative of the cost function).
     * Price(S) = S. We scale it to be in ETH.
     */
    function getSpotPrice(bool _outcome) public view returns (uint256) {
        uint256 currentShares = _outcome ? yesSharesTotal : noSharesTotal;
        return currentShares / SCALING_FACTOR;
    }

    // --- Utility Functions ---

    /**
     * @dev Simple integer square root function (Babylonian method).
     */
    function sqrt(uint256 y) internal pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }
}

