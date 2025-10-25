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
        uint256 shareAmount,
        bool isBuy
    );
    event MarketResolved(bool winningOutcome, uint256 finalReportedPrice);
    event SharesRedeemed(
        address indexed user,
        uint256 sharesRedeemed,
        uint256 ethReceived
    );
    event LiquidityProvided(
        address indexed provider,
        uint256 initialYesShares,
        uint256 initialNoShares,
        uint256 ethAmount
    );

    // --- Custom Errors ---
    error MarketAlreadyResolved();
    error MarketNotResolved();
    error ResolutionTimeNotPassed();
    error OnlyResolver();
    error InvalidSharesToRedeem();
    error InsufficientPayment();
    error InsufficientBalance();
    error TransferFailed();
    error InvalidInitialLiquidity();

    // --- Constructor ---
    constructor(
        address _creator,
        string memory _question,
        string memory _collectionSlug,
        uint256 _targetPrice,
        uint256 _resolutionTimestamp,
        uint256 _initialLiquidity
    ) ERC1155("") payable {
        if (_initialLiquidity == 0) revert InvalidInitialLiquidity();
        
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

        emit LiquidityProvided(_creator, initialShares, initialShares, _initialLiquidity);
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

        // Hardhat 3 Debugging
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

        emit Trade(msg.sender, _outcome, cost, _sharesToBuy, true);

        // Refund any excess ETH sent
        if (msg.value > cost) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - cost}("");
            if (!success) revert TransferFailed();
        }
    }

    /**
     * @dev Sells a specific number of shares.
     * The return is calculated by the getReturnForShares function.
     */
    function sellShares(bool _outcome, uint256 _sharesToSell) external {
        if (status != Status.Open) revert MarketAlreadyResolved();

        uint256 tokenId = _outcome ? YES_SHARE_ID : NO_SHARE_ID;
        if (balanceOf(msg.sender, tokenId) < _sharesToSell) revert InsufficientBalance();

        uint256 ethAmountOut = getReturnForShares(_outcome, _sharesToSell);
        
        if (_outcome) {
            yesSharesTotal -= _sharesToSell;
        } else {
            noSharesTotal -= _sharesToSell;
        }

        _burn(msg.sender, tokenId, _sharesToSell);
        
        (bool success, ) = payable(msg.sender).call{value: ethAmountOut}("");
        if (!success) revert TransferFailed();
        
        emit Trade(msg.sender, _outcome, ethAmountOut, _sharesToSell, false);
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

    /**
     * @dev Redeems all winning shares for ETH after market resolution.
     * Each winning share is worth 1 ETH (scaled by SCALING_FACTOR).
     */
    function redeemShares() external {
        if (status != Status.Resolved) revert MarketNotResolved();

        uint256 tokenIdToRedeem = winningOutcome ? YES_SHARE_ID : NO_SHARE_ID;
        uint256 sharesToRedeem = balanceOf(msg.sender, tokenIdToRedeem);

        if (sharesToRedeem == 0) revert InvalidSharesToRedeem();
        
        _burn(msg.sender, tokenIdToRedeem, sharesToRedeem);
        
        // Each winning share is worth 1 ETH (unscaled)
        uint256 ethPayout = sharesToRedeem / SCALING_FACTOR;
        
        (bool success, ) = payable(msg.sender).call{value: ethPayout}("");
        if (!success) revert TransferFailed();
        
        emit SharesRedeemed(msg.sender, sharesToRedeem, ethPayout);
    }

    /**
     * @dev Redeems a specific amount of winning shares.
     * Allows partial redemption for gas optimization.
     */
    function redeemSharesPartial(uint256 _amount) external {
        if (status != Status.Resolved) revert MarketNotResolved();

        uint256 tokenIdToRedeem = winningOutcome ? YES_SHARE_ID : NO_SHARE_ID;
        uint256 userBalance = balanceOf(msg.sender, tokenIdToRedeem);

        if (_amount == 0 || _amount > userBalance) revert InvalidSharesToRedeem();
        
        _burn(msg.sender, tokenIdToRedeem, _amount);
        
        // Each winning share is worth 1 ETH (unscaled)
        uint256 ethPayout = _amount / SCALING_FACTOR;
        
        (bool success, ) = payable(msg.sender).call{value: ethPayout}("");
        if (!success) revert TransferFailed();
        
        emit SharesRedeemed(msg.sender, _amount, ethPayout);
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

    // --- Portfolio View Functions ---

    /**
     * @dev Returns the current value of a user's position in ETH.
     * @param _user The address of the user
     * @return yesValue ETH value of YES shares
     * @return noValue ETH value of NO shares
     * @return totalValue Total ETH value of all shares
     */
    function getPositionValue(address _user) external view returns (
        uint256 yesValue,
        uint256 noValue,
        uint256 totalValue
    ) {
        uint256 yesBalance = balanceOf(_user, YES_SHARE_ID);
        uint256 noBalance = balanceOf(_user, NO_SHARE_ID);

        if (status == Status.Open) {
            // During trading, shares can be sold back at current market price
            yesValue = yesBalance > 0 ? getReturnForShares(true, yesBalance) : 0;
            noValue = noBalance > 0 ? getReturnForShares(false, noBalance) : 0;
        } else {
            // After resolution, only winning shares have value (1 ETH per share)
            if (winningOutcome) {
                yesValue = yesBalance / SCALING_FACTOR;
                noValue = 0;
            } else {
                yesValue = 0;
                noValue = noBalance / SCALING_FACTOR;
            }
        }

        totalValue = yesValue + noValue;
    }

    /**
     * @dev Returns detailed market information.
     */
    function getMarketInfo() external view returns (
        string memory _question,
        string memory _collectionSlug,
        uint256 _targetPrice,
        uint256 _resolutionTimestamp,
        Status _status,
        bool _winningOutcome,
        uint256 _yesSharesTotal,
        uint256 _noSharesTotal,
        uint256 _yesPrice,
        uint256 _noPrice
    ) {
        return (
            question,
            collectionSlug,
            targetPrice,
            resolutionTimestamp,
            status,
            winningOutcome,
            yesSharesTotal,
            noSharesTotal,
            getSpotPrice(true),
            getSpotPrice(false)
        );
    }

    /**
     * @dev Returns user's share balances.
     */
    function getUserBalances(address _user) external view returns (
        uint256 yesShares,
        uint256 noShares
    ) {
        return (
            balanceOf(_user, YES_SHARE_ID),
            balanceOf(_user, NO_SHARE_ID)
        );
    }

    /**
     * @dev Checks if a user can redeem shares (has winning shares after resolution).
     */
    function canRedeem(address _user) external view returns (bool) {
        if (status != Status.Resolved) return false;
        uint256 tokenId = winningOutcome ? YES_SHARE_ID : NO_SHARE_ID;
        return balanceOf(_user, tokenId) > 0;
    }

    /**
     * @dev Returns the amount of ETH a user can redeem.
     */
    function getRedeemableAmount(address _user) external view returns (uint256) {
        if (status != Status.Resolved) return 0;
        uint256 tokenId = winningOutcome ? YES_SHARE_ID : NO_SHARE_ID;
        uint256 shares = balanceOf(_user, tokenId);
        return shares / SCALING_FACTOR;
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

    /**
     * @dev Allows contract to receive ETH for market operations.
     */
    receive() external payable {}
}

