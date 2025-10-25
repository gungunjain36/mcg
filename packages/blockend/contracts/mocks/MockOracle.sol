// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IOracle.sol";

/**
 * @title MockOracle
 * @dev Mock oracle for testing and development.
 * In production, this would be replaced with Chainlink, UMA, or a custom oracle.
 */
contract MockOracle is IOracle {
    // Mapping of collection slug => price data
    mapping(string => PriceData) public prices;
    
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        bool isValid;
    }

    address public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Manually set a floor price (for testing).
     * In production, this would be fetched from Chainlink or external API.
     */
    function setFloorPrice(
        string memory collectionSlug,
        uint256 price
    ) external onlyOwner {
        prices[collectionSlug] = PriceData({
            price: price,
            timestamp: block.timestamp,
            isValid: true
        });

        emit PriceUpdated(collectionSlug, price, block.timestamp);
    }

    /**
     * @dev Batch set multiple prices.
     */
    function setFloorPrices(
        string[] memory collectionSlugs,
        uint256[] memory _prices
    ) external onlyOwner {
        require(collectionSlugs.length == _prices.length, "Length mismatch");
        
        for (uint256 i = 0; i < collectionSlugs.length; i++) {
            prices[collectionSlugs[i]] = PriceData({
                price: _prices[i],
                timestamp: block.timestamp,
                isValid: true
            });

            emit PriceUpdated(collectionSlugs[i], _prices[i], block.timestamp);
        }
    }

    /**
     * @dev Implements IOracle.getFloorPrice
     */
    function getFloorPrice(string memory collectionSlug) 
        external 
        view 
        override
        returns (
            uint256 price,
            uint256 timestamp,
            bool isValid
        ) 
    {
        PriceData memory data = prices[collectionSlug];
        return (data.price, data.timestamp, data.isValid);
    }

    /**
     * @dev Implements IOracle.requestPriceUpdate
     * In mock, this does nothing. In production, this would trigger an API call.
     */
    function requestPriceUpdate(string memory collectionSlug) external override {
        emit PriceUpdateRequested(collectionSlug, msg.sender, block.timestamp);
    }

    /**
     * @dev Invalidate a price (for testing failure scenarios).
     */
    function invalidatePrice(string memory collectionSlug) external onlyOwner {
        prices[collectionSlug].isValid = false;
    }
}


