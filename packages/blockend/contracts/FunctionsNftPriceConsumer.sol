// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {ConfirmedOwner} from "@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol";

interface INftFloorOracleSetter {
    function setFloorPrice(string calldata collectionSlug, uint256 priceWei) external;
}

/**
 * @title FunctionsNftPriceConsumer
 * @dev Chainlink Functions consumer that fetches OpenSea collection floor and writes to NftFloorOracle.
 * Notes:
 * - Expects OpenSea to return floor price in ETH; we scale to 1e18 wei.
 * - Uses inline JS; for production consider DON-hosted secrets for API keys.
 */
contract FunctionsNftPriceConsumer is FunctionsClient, ConfirmedOwner {
    using FunctionsRequest for FunctionsRequest.Request;

    // Chainlink Functions config
    bytes32 public immutable donId;
    uint32 public callbackGasLimit = 300_000;

    // Oracle we update
    INftFloorOracleSetter public immutable oracle;

    // Last request state
    bytes32 public lastRequestId;
    string public lastSlug;
    bytes public lastResponse;
    bytes public lastError;

    error UnexpectedRequestID(bytes32 requestId);

    event PriceRequested(bytes32 indexed requestId, string slug);
    event Fulfilled(bytes32 indexed requestId, string slug, uint256 priceWei);

    constructor(address router, bytes32 _donId, address oracleAddress)
        FunctionsClient(router)
        ConfirmedOwner(msg.sender)
    {
        donId = _donId;
        oracle = INftFloorOracleSetter(oracleAddress);
    }

    // Minimal inline JavaScript to call OpenSea v2 collections stats endpoint.
    // Expects args: [slug, apiKey]
    string private constant SOURCE = "const slug = args[0];\n"
        "const apiKey = args[1];\n"
        "const resp = await Functions.makeHttpRequest({\n"
        "  url: `https://api.opensea.io/api/v2/collections/${slug}/stats`,\n"
        "  method: 'GET',\n"
        "  headers: apiKey ? { 'X-API-KEY': apiKey } : {}\n"
        "});\n"
        "if (resp.error) { throw Error('HTTP error'); }\n"
        "const data = resp.data;\n"
        "// Attempt to read floor price in ETH; fallback to 0 on missing\n"
        "let floor = 0;\n"
        "if (data && data.total && data.total.floor_price) {\n"
        "  floor = Number(data.total.floor_price);\n"
        "} else if (data && data.stats && data.stats.floor_price) {\n"
        "  floor = Number(data.stats.floor_price);\n"
        "}\n"
        "// Scale to 1e18 (wei)\n"
        "const scaled = BigInt(Math.floor(floor * 1e18));\n"
        "return Functions.encodeUint256(scaled);\n";

    function requestPrice(uint64 subscriptionId, string calldata slug, string calldata openSeaApiKey)
        external
        onlyOwner
        returns (bytes32 requestId)
    {
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(SOURCE);
        string[] memory args = new string[](2);
        args[0] = slug;
        args[1] = openSeaApiKey;
        req.setArgs(args);

        lastSlug = slug;
        lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, callbackGasLimit, donId);
        emit PriceRequested(lastRequestId, slug);
        return lastRequestId;
    }

    function setCallbackGasLimit(uint32 gasLimit) external onlyOwner {
        callbackGasLimit = gasLimit;
    }

    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        if (requestId != lastRequestId) revert UnexpectedRequestID(requestId);
        lastResponse = response;
        lastError = err;

        if (err.length == 0 && response.length > 0) {
            uint256 priceWei = abi.decode(response, (uint256));
            oracle.setFloorPrice(lastSlug, priceWei);
            emit Fulfilled(requestId, lastSlug, priceWei);
        }
    }
}


