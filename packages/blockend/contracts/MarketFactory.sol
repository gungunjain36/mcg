// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Market.sol";

contract MarketFactory {
    address[] public allMarkets;

    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        string question,
        string collectionSlug,
        uint256 targetPrice,
        uint256 resolutionTimestamp
    );

    function createMarket(
        string memory _question,
        string memory _collectionSlug,
        uint256 _targetPrice,
        uint256 _resolutionTimestamp
    ) external payable returns (address marketAddress) {
        require(msg.value > 0, "Initial liquidity must be provided");

        Market newMarket = new Market(
            msg.sender,
            _question,
            _collectionSlug,
            _targetPrice,
            _resolutionTimestamp,
            msg.value
        );

        marketAddress = address(newMarket);
        allMarkets.push(marketAddress);

        emit MarketCreated(
            marketAddress,
            msg.sender,
            _question,
            _collectionSlug,
            _targetPrice,
            _resolutionTimestamp
        );
    }

    function getAllMarkets() external view returns (address[] memory) {
        return allMarkets;
    }
}

