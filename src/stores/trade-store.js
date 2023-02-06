import { sendRequest, subscribe } from "../utils/socket-base";

import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";

const [activeSymbols, setActiveSymbols] = createSignal([]);
const [selectedTradeType, setSelectedTradeType] = createSignal({});
const [selectedTrade, setSelectedTrade] = createSignal({
  market: "",
  sub_market: "",
  trade_type: "",
});

const [is_stake, setIsStake] = createSignal(true);
const [symbol, setSymbol] = createSignal();
const [trade_types, setTradeTypes] = createStore({ trade_types: [] });
const [banner_message, setBannerMessage] = createSignal();
const [open_contract_ids, setOpenContractId] = createSignal([]);
const [open_contract_info, setOpenContractInfo] = createSignal({});
const [statements, setStatements] = createSignal([]);
const [subscribe_id, setSubscribeId] = createSignal(null);
const [prev_tick, setPrevTick] = createSignal(null);
const [current_tick, setCurrentTick] = createSignal(null);
const [is_loading, setIsLoading] = createSignal(false);
const [market_ticks, setMarketTicks] = createSignal({});

const fetchActiveSymbols = async () => {
  try {
    const response = await sendRequest({
      active_symbols: "brief",
      product_type: "basic",
    });
    setActiveSymbols(response.active_symbols);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log("error:", err);
  }
};

const buyContract = async (id, amount, token) => {
  try {
    const response = await sendRequest({
      buy: id,
      price: Number(amount),
    });

    if (response?.buy) {
      setOpenContractId([...open_contract_ids(), response.buy.contract_id]);
    }
  } catch (error) {
    setBannerMessage(error.error.message);
  }
};

const fetchMarketTick = (symbol, marketTickHandler) => {
  const market_tick_subscription_ref = subscribe(
    {
      ticks: symbol,
      subscribe: 1,
    },
    marketTickHandler
  );
  return market_tick_subscription_ref;
  // setSubscribeId(market_tick_subscription_ref);
};

export {
  activeSymbols,
  setActiveSymbols,
  fetchActiveSymbols,
  selectedTradeType,
  setSelectedTradeType,
  selectedTrade,
  setSelectedTrade,
  is_stake,
  setIsStake,
  symbol,
  setSymbol,
  trade_types,
  setTradeTypes,
  banner_message,
  setBannerMessage,
  buyContract,
  open_contract_ids,
  setOpenContractId,
  open_contract_info,
  setOpenContractInfo,
  statements,
  setStatements,
  subscribe_id,
  setSubscribeId,
  fetchMarketTick,
  prev_tick,
  setPrevTick,
  current_tick,
  setCurrentTick,
  is_loading,
  setIsLoading,
  market_ticks,
  setMarketTicks,
};
