// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IOracle.sol";

/**
 * @title NftFloorOracle
 * @dev Simple on-chain oracle storage for NFT collection floor prices.
 * - Supports permissioned reporters to update prices
 * - Exposes freshness via staleness threshold
 * - Emits events compatible with IOracle
 *
 * This contract can be updated by an off-chain reporter (e.g., Chainlink Functions)
 * or any trusted backend. Over time, you can replace the reporter with a
 * Chainlink Functions consumer that calls setFloorPrice.
 */
contract NftFloorOracle is IOracle, AccessControl {
    bytes32 public constant REPORTER_ROLE = keccak256("REPORTER_ROLE");

    struct PriceData {
        uint256 priceWei;     // Price scaled to 1e18 (ETH wei)
        uint256 updatedAt;    // Unix timestamp
    }

    // Default: 1 hour; admin can update
    uint256 public stalenessThreshold = 1 hours;

    // Mapping from collection slug to price data
    mapping(string => PriceData) private slugToPrice;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REPORTER_ROLE, msg.sender);
    }

    /**
     * @dev Update the floor price for a collection. Only callable by reporter.
     * @param collectionSlug e.g., "boredapeyachtclub"
     * @param priceWei Floor price scaled as wei (1e18)
     */
    function setFloorPrice(string calldata collectionSlug, uint256 priceWei) external onlyRole(REPORTER_ROLE) {
        PriceData storage pd = slugToPrice[collectionSlug];
        pd.priceWei = priceWei;
        pd.updatedAt = block.timestamp;
        emit PriceUpdated(collectionSlug, priceWei, pd.updatedAt);
    }

    /**
     * @dev Returns price, timestamp, and validity (based on stalenessThreshold).
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
        PriceData storage pd = slugToPrice[collectionSlug];
        price = pd.priceWei;
        timestamp = pd.updatedAt;
        isValid = (timestamp != 0 && block.timestamp - timestamp <= stalenessThreshold);
    }

    /**
     * @dev Emit a request for off-chain infrastructure to refresh the price.
     */
    function requestPriceUpdate(string memory collectionSlug) external override {
        emit PriceUpdateRequested(collectionSlug, msg.sender, block.timestamp);
    }

    /**
     * @dev Admin: set the reporter role for an address.
     */
    function grantReporter(address reporter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(REPORTER_ROLE, reporter);
    }

    /**
     * @dev Admin: set the staleness threshold (in seconds).
     */
    function setStalenessThreshold(uint256 newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newThreshold > 0 && newThreshold <= 7 days, "Invalid threshold");
        stalenessThreshold = newThreshold;
    }
}


