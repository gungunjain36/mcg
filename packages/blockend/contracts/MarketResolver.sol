// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./Market.sol";
import "./interfaces/IOracle.sol";

/**
 * @title MarketResolver
 * @dev Helper contract for automated market resolution.
 * This contract can be called by a backend settlement worker to resolve markets
 * using data from an oracle or manual input.
 * 
 * Benefits:
 * - Separates resolution logic from Market contract
 * - Allows for oracle integration
 * - Can batch resolve multiple markets
 * - Provides access control for resolver role
 */
contract MarketResolver {
    // --- State Variables ---
    address public owner;
    IOracle public oracle;
    
    // Mapping of authorized resolvers (can be backend wallets, multisig, etc.)
    mapping(address => bool) public authorizedResolvers;
    
    // Track resolved markets to prevent double resolution
    mapping(address => bool) public resolvedMarkets;

    // --- Events ---
    event ResolverAuthorized(address indexed resolver);
    event ResolverRevoked(address indexed resolver);
    event MarketResolved(
        address indexed marketAddress,
        string collectionSlug,
        uint256 finalPrice,
        bool outcome
    );
    event OracleUpdated(address indexed newOracle);
    event BatchResolutionCompleted(uint256 marketsResolved, uint256 marketsFailed);

    // --- Errors ---
    error OnlyOwner();
    error OnlyAuthorizedResolver();
    error MarketAlreadyResolved();
    error InvalidMarketAddress();
    error ResolutionFailed(address market, string reason);

    // --- Modifiers ---
    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier onlyAuthorizedResolver() {
        if (!authorizedResolvers[msg.sender] && msg.sender != owner) {
            revert OnlyAuthorizedResolver();
        }
        _;
    }

    // --- Constructor ---
    constructor(address _oracle) {
        owner = msg.sender;
        oracle = IOracle(_oracle);
        authorizedResolvers[msg.sender] = true;
        emit ResolverAuthorized(msg.sender);
    }

    // --- Admin Functions ---

    /**
     * @dev Authorizes an address to resolve markets.
     * @param _resolver Address to authorize (e.g., backend wallet)
     */
    function authorizeResolver(address _resolver) external onlyOwner {
        authorizedResolvers[_resolver] = true;
        emit ResolverAuthorized(_resolver);
    }

    /**
     * @dev Revokes resolver authorization.
     */
    function revokeResolver(address _resolver) external onlyOwner {
        authorizedResolvers[_resolver] = false;
        emit ResolverRevoked(_resolver);
    }

    /**
     * @dev Updates the oracle address.
     */
    function setOracle(address _oracle) external onlyOwner {
        oracle = IOracle(_oracle);
        emit OracleUpdated(_oracle);
    }

    /**
     * @dev Transfers ownership.
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        owner = _newOwner;
    }

    // --- Resolution Functions ---

    /**
     * @dev Resolves a market manually with provided price.
     * Used by settlement worker that fetches price from OpenSea API.
     * @param _marketAddress Address of the Market contract
     * @param _finalPrice The floor price at resolution time (in wei)
     */
    function resolveMarketManual(
        address _marketAddress,
        uint256 _finalPrice
    ) external onlyAuthorizedResolver {
        if (_marketAddress == address(0)) revert InvalidMarketAddress();
        if (resolvedMarkets[_marketAddress]) revert MarketAlreadyResolved();

        Market market = Market(payable(_marketAddress));
        
        // Get market info to verify it's ready for resolution
        (, string memory collectionSlug, , uint256 resolutionTimestamp, , , , , , ) 
            = market.getMarketInfo();
        
        // Verify resolution time has passed
        if (block.timestamp < resolutionTimestamp) {
            revert ResolutionFailed(_marketAddress, "Resolution time not reached");
        }

        // Resolve the market
        try market.resolveMarket(_finalPrice) {
            resolvedMarkets[_marketAddress] = true;
            
            // Determine outcome
            uint256 targetPrice = market.targetPrice();
            bool outcome = _finalPrice > targetPrice;
            
            emit MarketResolved(_marketAddress, collectionSlug, _finalPrice, outcome);
        } catch Error(string memory reason) {
            revert ResolutionFailed(_marketAddress, reason);
        } catch {
            revert ResolutionFailed(_marketAddress, "Unknown error");
        }
    }

    /**
     * @dev Resolves a market using the connected oracle.
     * For future use when oracle integration is complete.
     */
    function resolveMarketWithOracle(
        address _marketAddress
    ) external onlyAuthorizedResolver {
        if (_marketAddress == address(0)) revert InvalidMarketAddress();
        if (resolvedMarkets[_marketAddress]) revert MarketAlreadyResolved();
        if (address(oracle) == address(0)) {
            revert ResolutionFailed(_marketAddress, "No oracle configured");
        }

        Market market = Market(payable(_marketAddress));
        
        (, string memory collectionSlug, , uint256 resolutionTimestamp, , , , , , ) 
            = market.getMarketInfo();
        
        if (block.timestamp < resolutionTimestamp) {
            revert ResolutionFailed(_marketAddress, "Resolution time not reached");
        }

        // Fetch price from oracle
        (uint256 price, , bool isValid) = oracle.getFloorPrice(collectionSlug);
        
        if (!isValid) {
            revert ResolutionFailed(_marketAddress, "Invalid oracle price");
        }

        // Resolve the market
        try market.resolveMarket(price) {
            resolvedMarkets[_marketAddress] = true;
            
            uint256 targetPrice = market.targetPrice();
            bool outcome = price > targetPrice;
            
            emit MarketResolved(_marketAddress, collectionSlug, price, outcome);
        } catch Error(string memory reason) {
            revert ResolutionFailed(_marketAddress, reason);
        }
    }

    /**
     * @dev Batch resolves multiple markets.
     * Useful for settlement worker to process multiple markets in one transaction.
     * @param _markets Array of market addresses
     * @param _prices Array of floor prices (must match length of _markets)
     */
    function batchResolveMarkets(
        address[] calldata _markets,
        uint256[] calldata _prices
    ) external onlyAuthorizedResolver returns (uint256 successCount, uint256 failureCount) {
        if (_markets.length != _prices.length) {
            revert ResolutionFailed(address(0), "Array length mismatch");
        }

        for (uint256 i = 0; i < _markets.length; i++) {
            try this.resolveMarketManual(_markets[i], _prices[i]) {
                successCount++;
            } catch {
                failureCount++;
                // Continue with next market instead of reverting entire batch
            }
        }

        emit BatchResolutionCompleted(successCount, failureCount);
    }

    // --- View Functions ---

    /**
     * @dev Checks if a market is ready for resolution.
     */
    function isMarketReadyForResolution(address _marketAddress) 
        external 
        view 
        returns (bool ready, string memory reason) 
    {
        if (_marketAddress == address(0)) {
            return (false, "Invalid market address");
        }

        if (resolvedMarkets[_marketAddress]) {
            return (false, "Already resolved");
        }

        try Market(payable(_marketAddress)).getMarketInfo() returns (
            string memory,
            string memory,
            uint256,
            uint256 resolutionTimestamp,
            Market.Status status,
            bool,
            uint256,
            uint256,
            uint256,
            uint256
        ) {
            if (status != Market.Status.Open) {
                return (false, "Market not open");
            }

            if (block.timestamp < resolutionTimestamp) {
                return (false, "Resolution time not reached");
            }

            return (true, "Ready for resolution");
        } catch {
            return (false, "Failed to get market info");
        }
    }

    /**
     * @dev Returns list of markets ready for resolution from a provided list.
     * Helper for settlement worker to find markets to resolve.
     */
    function getMarketsReadyForResolution(address[] calldata _markets)
        external
        view
        returns (address[] memory readyMarkets)
    {
        uint256 readyCount = 0;
        address[] memory tempReady = new address[](_markets.length);

        for (uint256 i = 0; i < _markets.length; i++) {
            (bool ready, ) = this.isMarketReadyForResolution(_markets[i]);
            if (ready) {
                tempReady[readyCount] = _markets[i];
                readyCount++;
            }
        }

        // Create properly sized array
        readyMarkets = new address[](readyCount);
        for (uint256 i = 0; i < readyCount; i++) {
            readyMarkets[i] = tempReady[i];
        }
    }
}


