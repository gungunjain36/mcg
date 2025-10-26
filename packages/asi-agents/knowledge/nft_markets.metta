; ============================================================================
; MCG.FUN NFT Markets Knowledge Base
; MeTTa knowledge graph for structured reasoning about NFT prediction markets
; ASI Alliance Integration - SingularityNET MeTTa
; ============================================================================

; Type Definitions
; ============================================================================
(: Collection Type)
(: Market Type)
(: Direction Type)
(: Action Type)
(: Period Type)
(: Float Type)
(: String Type)

; Direction values
(: Bullish Direction)
(: Bearish Direction)
(: Neutral Direction)

; Action values
(: Buy Action)
(: Sell Action)
(: Hold Action)

; Period values
(: "7d" Period)
(: "30d" Period)
(: "90d" Period)

; Market Data Schema
; ============================================================================
(: floor_price (-> Collection Float))
(: volume_24h (-> Collection Float))
(: volume_7d (-> Collection Float))
(: holders (-> Collection Int))
(: sales_count (-> Collection Int))
(: average_price (-> Collection Float))

; Market Trends
; ============================================================================
(: trend (-> Collection Period Direction))
(: momentum (-> Collection Float))
(: volatility (-> Collection Float))

; Trading Signals
; ============================================================================
(: signal (-> Collection Action Float))
(: confidence (-> Collection Action Float))

; Risk Metrics
; ============================================================================
(: risk_level (-> Market Float))
(: liquidity_score (-> Market Float))
(: market_depth (-> Market Float))

; Popular NFT Collections
; ============================================================================
(: BAYC Collection)
(: Azuki Collection)
(: Doodles Collection)
(: Pudgy Collection)
(: Milady Collection)
(: DeGods Collection)
(: CloneX Collection)
(: Moonbirds Collection)
(: Cryptopunks Collection)
(: Otherside Collection)

; Sample Data (Updated dynamically by agents)
; ============================================================================

; Floor Prices (ETH) - Agents update these in real-time
(floor_price BAYC 30.5)
(floor_price Azuki 12.3)
(floor_price Doodles 3.8)
(floor_price Pudgy 8.2)
(floor_price Milady 2.5)
(floor_price DeGods 15.0)
(floor_price Cryptopunks 45.0)
(floor_price Otherside 0.5)

; 24h Volume (ETH)
(volume_24h BAYC 125.0)
(volume_24h Azuki 89.5)
(volume_24h Doodles 45.2)
(volume_24h Pudgy 67.8)
(volume_24h Cryptopunks 200.0)

; Holder Count
(holders BAYC 6825)
(holders Azuki 5432)
(holders Doodles 7234)
(holders Pudgy 4821)
(holders Cryptopunks 3840)

; Market Trends (Last 30 days)
(trend BAYC "30d" Bullish)
(trend Azuki "30d" Bearish)
(trend Doodles "30d" Neutral)
(trend Pudgy "30d" Bullish)
(trend Milady "30d" Neutral)
(trend DeGods "30d" Bearish)
(trend Cryptopunks "30d" Bullish)

; Short-term Trends (Last 7 days)
(trend BAYC "7d" Bullish)
(trend Azuki "7d" Bearish)
(trend Doodles "7d" Neutral)
(trend Pudgy "7d" Bullish)
(trend Cryptopunks "7d" Bullish)

; Momentum Scores (0.0 to 1.0)
(momentum BAYC 0.82)
(momentum Azuki 0.35)
(momentum Doodles 0.55)
(momentum Pudgy 0.78)
(momentum Cryptopunks 0.88)
(momentum Milady 0.45)

; Volatility Scores (0.0 to 1.0, higher = more volatile)
(volatility BAYC 0.45)
(volatility Azuki 0.72)
(volatility Doodles 0.38)
(volatility Pudgy 0.51)
(volatility Cryptopunks 0.35)

; ============================================================================
; Inference Rules for Trading Recommendations
; ============================================================================

; Rule 1: Buy YES recommendation for Bullish trend with high momentum
(= (recommend_buy_yes $collection $confidence)
   (and
     (trend $collection "30d" Bullish)
     (momentum $collection $momentum)
     (> $momentum 0.7)
     (= $confidence 0.85)))

; Rule 2: Buy NO recommendation for Bearish trend
(= (recommend_buy_no $collection $confidence)
   (and
     (trend $collection "30d" Bearish)
     (momentum $collection $momentum)
     (< $momentum 0.4)
     (= $confidence 0.80)))

; Rule 3: Hold recommendation for Neutral trend
(= (recommend_hold $collection $confidence)
   (and
     (trend $collection "30d" Neutral)
     (= $confidence 0.50)))

; Rule 4: Increase confidence for aligned short and long-term trends
(= (boosted_confidence $collection $base_confidence $final_confidence)
   (and
     (trend $collection "7d" $short_trend)
     (trend $collection "30d" $long_trend)
     (same $short_trend $long_trend)
     (+ $base_confidence 0.1 $final_confidence)))

; Rule 5: Decrease confidence for high volatility
(= (adjusted_confidence_volatility $collection $base_confidence $final_confidence)
   (and
     (volatility $collection $vol)
     (> $vol 0.6)
     (- $base_confidence 0.15 $final_confidence)))

; Rule 6: Price prediction for Bullish markets
(= (predict_price_bullish $collection $current_price $predicted_price)
   (and
     (floor_price $collection $current_price)
     (trend $collection "30d" Bullish)
     (momentum $collection $momentum)
     (* $current_price 1.1 $temp)
     (* $temp $momentum $predicted_price)))

; Rule 7: Price prediction for Bearish markets
(= (predict_price_bearish $collection $current_price $predicted_price)
   (and
     (floor_price $collection $current_price)
     (trend $collection "30d" Bearish)
     (momentum $collection $momentum)
     (* $current_price 0.9 $temp)
     (/ $temp $momentum $predicted_price)))

; Rule 8: Risk assessment based on volatility and liquidity
(= (assess_risk_high $collection $risk_score)
   (and
     (volatility $collection $vol)
     (volume_24h $collection $volume)
     (< $volume 50.0)
     (+ $vol 0.3 $risk_score)))

(= (assess_risk_moderate $collection $risk_score)
   (and
     (volatility $collection $vol)
     (volume_24h $collection $volume)
     (>= $volume 50.0)
     (= $risk_score $vol)))

; Rule 9: Market opportunity score
(= (opportunity_score $collection $score)
   (and
     (trend $collection "30d" Bullish)
     (momentum $collection $momentum)
     (volatility $collection $vol)
     (- $momentum $vol $score)))

; Rule 10: Portfolio diversification recommendations
(= (diversification_advice_low $positions $advice)
   (and
     (< $positions 3)
     (= $advice "Increase diversification across collections")))

(= (diversification_advice_good $positions $advice)
   (and
     (>= $positions 3)
     (< $positions 5)
     (= $advice "Good diversification level")))

(= (diversification_advice_high $positions $advice)
   (and
     (>= $positions 5)
     (= $advice "Consider consolidating for better management")))

; ============================================================================
; Complex Reasoning Rules
; ============================================================================

; Market sentiment based on multiple factors
(= (market_sentiment_bullish $collection)
   (and
     (trend $collection "7d" Bullish)
     (momentum $collection $momentum)
     (> $momentum 0.6)
     (volume_24h $collection $volume)
     (> $volume 40.0)))

(= (market_sentiment_bearish $collection)
   (and
     (trend $collection "7d" Bearish)
     (momentum $collection $momentum)
     (< $momentum 0.4)))

(= (market_sentiment_neutral $collection)
   (trend $collection "7d" Neutral))

; Trading strategy based on timeframe
(= (strategy_short_term $collection $action)
   (and
     (trend $collection "7d" $direction)
     (= $direction Bullish)
     (= $action Buy)))

(= (strategy_long_term $collection $action)
   (and
     (trend $collection "30d" $direction)
     (= $direction Bullish)
     (momentum $collection $momentum)
     (> $momentum 0.7)
     (= $action Buy)))

; Confidence explanation (meta-reasoning)
(= (confidence_explanation $collection $confidence $factors)
   (and
     (trend $collection "30d" $trend)
     (momentum $collection $momentum)
     (volatility $collection $vol)
     (= $factors ["Trend" $trend "Momentum" $momentum "Volatility" $vol])))

; Market health score
(= (market_health_excellent $collection)
   (and
     (volume_24h $collection $volume)
     (> $volume 100.0)
     (volatility $collection $vol)
     (< $vol 0.4)
     (holders $collection $holders)
     (> $holders 5000)))

(= (market_health_good $collection)
   (and
     (volume_24h $collection $volume)
     (> $volume 50.0)
     (volatility $collection $vol)
     (< $vol 0.6)))

; Resolution prediction
(= (predict_resolution_yes $market $target $current)
   (and
     (> $current $target)
     (trend $market "7d" Bullish)))

(= (predict_resolution_no $market $target $current)
   (and
     (<= $current $target)
     (trend $market "7d" Bearish)))

; ============================================================================
; Query Interface (For Agents)
; ============================================================================

; Query Examples for Agents:
; !(recommend_buy_yes BAYC $confidence)
; !(predict_price_bullish Azuki 12.3 $predicted)
; !(market_sentiment_bullish Pudgy)
; !(opportunity_score BAYC $score)
; !(diversification_advice_good 4 $advice)

; ============================================================================
; Dynamic Update Interface
; ============================================================================

; Agents can add new facts:
; (floor_price NewCollection 5.0)
; (trend NewCollection "7d" Bullish)
; (momentum NewCollection 0.75)

; ============================================================================
; End of Knowledge Base
; ============================================================================

; Note: This knowledge base is continuously updated by MCG.FUN agents with:
; - Real-time floor prices from OpenSea API
; - Trading volume data from blockchain
; - User behavior patterns from GraphQL indexer
; - Historical outcome data from resolved markets
; - Market sentiment from social signals

; MeTTa enables:
; ✅ Structured reasoning with provable logic
; ✅ Explainable AI recommendations
; ✅ Pattern recognition across collections
; ✅ Dynamic knowledge updates
; ✅ Complex multi-factor decision making

; This powers the Market Analyst Agent's recommendations
; and provides transparency to users about WHY recommendations are made.

