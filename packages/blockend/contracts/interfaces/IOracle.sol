// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IOracle
 * @dev Interface for price oracle integration.
 * This interface allows for pluggable oracle solutions (Chainlink, UMA, custom).
 * For MVP, this will be implemented by a manual resolver, but can be upgraded
 * to use decentralized oracles like Chainlink Price Feeds or UMA Optimistic Oracle.
 */
interface IOracle {
    /**
     * @dev Fetches the floor price for a given NFT collection.
     * @param collectionSlug The OpenSea collection slug (e.g., "boredapeyachtclub")
     * @return price The floor price in ETH (scaled by 1e18)
     * @return timestamp The timestamp of the price data
     * @return isValid Whether the price data is valid and recent
     */
    function getFloorPrice(string memory collectionSlug) 
        external 
        view 
        returns (
            uint256 price,
            uint256 timestamp,
            bool isValid
        );

    /**
     * @dev Requests a floor price update for a collection.
     * For off-chain oracles, this might trigger an API call.
     * For on-chain oracles, this might trigger a Chainlink request.
     * @param collectionSlug The collection to fetch price for
     */
    function requestPriceUpdate(string memory collectionSlug) external;

    /**
     * @dev Emitted when a price is updated.
     */
    event PriceUpdated(
        string indexed collectionSlug,
        uint256 price,
        uint256 timestamp
    );

    /**
     * @dev Emitted when a price update is requested.
     */
    event PriceUpdateRequested(
        string indexed collectionSlug,
        address indexed requester,
        uint256 timestamp
    );
}


