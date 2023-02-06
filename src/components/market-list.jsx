import {
  DataTable,
  DisplayChangePercent,
  DisplayTickValue,
  Loader,
  SVGWrapper,
  Tab,
  Tabs,
} from "../components";
import { FAVOURITES, MARKET_TYPES } from "../constants/trade-config";
import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import classNames from "classnames";
import {
  activeSymbols,
  fetchMarketTick,
  market_ticks,
  setMarketTicks,
  setSelectedTradeType,
} from "../stores";
import { addDays, formatDate } from "../utils/format-value";
import { forgetAll, sendRequest, wait } from "../utils/socket-base";
import { ERROR_CODE } from "../constants/error-codes";
import StarIcon from "../assets/svg/action/star.svg?url";
import TrashBinIcon from "../assets/svg/action/trash.svg?url";
import { getFavourites } from "../utils/map-markets";
import { segregateMarkets } from "../utils/map-markets";
import shared from "../styles/shared.module.scss";
import styles from "../styles/accordion.module.scss";
import throttle from "lodash.throttle";
import watchlist_styles from "../styles/watchlist.module.scss";

const MarketList = () => {
  const header_config = [
    { title: "Name", ref: "display_name" },
    { title: "Change %", ref: "change", cell_content: DisplayChangePercent },
    { title: "Price", ref: "tick", cell_content: DisplayTickValue },
  ];

  const default_tab = {
    title: "Favourites",
    ref: "favs",
  };

  const [all_markets, setAllMarkets] = createSignal([]);
  const [available_markets, setAvailableMarkets] = createSignal([]);
  const [market_data, setMarketData] = createSignal(null);
  const [active_tab, setActiveTab] = createSignal(0);
  const [is_market_closed, setIsMarketClosed] = createSignal();
  const [watchlist, setWatchlist] = createSignal([]);

  onMount(() => {
    setActiveTab(0);
    setIsMarketClosed(false);
    setWatchlist(getFavourites());
    getWatchList();
  });

  createEffect(() => {
    setAllMarkets(segregateMarkets(activeSymbols()));
  });

  onCleanup(() => {
    forgetAll("ticks");
  });

  const getSymbol = (target_symbol, trading_times) => {
    let symbol;
    const { markets } = trading_times;
    for (let i = 0; i < markets.length; i++) {
      const { submarkets } = markets[i];
      for (let j = 0; j < submarkets.length; j++) {
        const { symbols } = submarkets[j];
        symbol = symbols.find((item) => item.symbol === target_symbol);
        if (symbol) return symbol;
      }
    }
  };

  const generateDataSet = () =>
    available_markets().map((markets) => ({
      display_name: markets.display_name,
      change: markets.symbol,
      tick: markets.symbol,
    }));

  const fetchAvailableMarketSymbols = (market_type) => {
    const requiredMarkets = available_markets().filter(
      (market_data) => market_data.market === market_type
    );
    return requiredMarkets.map((market) => market.symbol);
  };

  const setTabList = (abvl_markets) => [
    default_tab,
    ...MARKET_TYPES.filter((type) =>
      Object.keys(abvl_markets).includes(type.ref)
    ),
  ];

  const generateTickData = ({
    previous = 0,
    current = 0,
    is_closed = false,
    is_suspended = false,
    opens_at = null,
  }) => ({ previous, current, is_closed, is_suspended, opens_at });

  const calculateTimeLeft = (remaining_time_to_open) => {
    const difference = remaining_time_to_open - Date.now();
    return difference > 0
      ? {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      : {};
  };

  const checkWhenMarketOpens = async (days_offset, target_symbol) => {
    const target_date = addDays(new Date(), days_offset);
    const api_response = await getTradeTimings(formatDate(target_date));
    if (!api_response.api_initial_load_error) {
      const { times } = getSymbol(target_symbol, api_response.trading_times);
      const { open, close } = times;
      const is_closed_all_day =
        open?.length === 1 && open[0] === "--" && close[0] === "--";
      if (is_closed_all_day) {
        return checkWhenMarketOpens(days_offset + 1, target_symbol);
      }
      const date_str = target_date.toISOString().substring(0, 11);
      const getUTCDate = (hour) => new Date(`${date_str}${hour}Z`);
      let remaining_time_to_open;
      for (let i = 0; i < open?.length; i++) {
        const diff = +getUTCDate(open[i]) - Date.now();
        if (diff > 0) {
          remaining_time_to_open = +getUTCDate(open[i]);
          setMarketTicks({
            ...market_ticks(),
            [target_symbol]: generateTickData({
              is_closed: true,
              opens_at: calculateTimeLeft(remaining_time_to_open),
            }),
          });
        }
      }
    }
  };

  const getTradeTimings = async (date_string) => {
    const data = await sendRequest({ trading_times: date_string });
    if (data.error) {
      return { api_initial_load_error: data.error.message };
    }
    return data;
  };

  const marketDataHandler = async (response) => {
    if (!response.error) {
      const { quote, symbol } = response.tick;
      const prev_value = market_ticks()[symbol]?.current ?? 0;
      const current_value = quote;
      setMarketTicks({
        ...market_ticks(),
        [symbol]: generateTickData({
          previous: prev_value,
          current: current_value,
        }),
      });
    } else {
      const { echo_req, error } = response;
      if (error.code === ERROR_CODE.market_closed) {
        if (!is_market_closed()) {
          setIsMarketClosed(true);
          await checkWhenMarketOpens(0, echo_req.ticks);
        }
      }
    }
  };

  const getMarketData = async (symbol_list) => {
    if (Object.keys(market_ticks()).length) {
      await forgetAll("ticks");
      await wait("forget_all");
    }
    setMarketData(generateDataSet());
    symbol_list.forEach(async (symbol) => {
      await fetchMarketTick(symbol, throttle(marketDataHandler, 500));
    });
  };

  const getAvailableMarkets = (market_type) =>
    setAvailableMarkets(all_markets()[market_type]);

  const fetchSelectedMarket = (tab_ref) => {
    setIsMarketClosed(false);
    const { index, id } = tab_ref;
    setActiveTab(index);
    if (id === FAVOURITES) {
      getWatchList();
    } else {
      getAvailableMarkets(id);
      const symbol_list = fetchAvailableMarketSymbols(id);
      getMarketData(symbol_list);
    }
  };

  const getWatchList = () => {
    const selected_markets = activeSymbols().filter((markets) =>
      watchlist().includes(markets.symbol)
    );
    setAvailableMarkets(selected_markets);
    getMarketData(watchlist());
  };

  const updateWatchlist = (row_data) => {
    const active_user = localStorage.getItem("userId") ?? "guest";
    const new_list = watchlist().includes(row_data.tick)
      ? watchlist().filter((sym) => sym !== row_data.tick)
      : [...watchlist(), row_data.tick];
    localStorage.setItem(`${active_user}-favourites`, JSON.stringify(new_list));
    setWatchlist(new_list);
    if (active_tab() === 0) {
      getWatchList();
    }
  };

  return (
    <>
      <h3 class={styles["title"]}>What would you like to trade with?</h3>
      <Show
        when={Object.keys(all_markets()).length}
        fallback={<Loader class={shared["spinner"]} type="2" />}
      >
        <Tabs
          onTabItemClick={(tab_ref) => fetchSelectedMarket(tab_ref)}
          active_index={active_tab()}
        >
          <For each={setTabList(all_markets())}>
            {(tabs) => (
              <Tab label={tabs.title} id={tabs.ref}>
                <Show when={market_data()}>
                  <DataTable
                    headers={header_config}
                    data={market_data()}
                    show_header={true}
                    table_class={styles["market-list"]}
                    onRowClick={(trade_type) => {
                      setSelectedTradeType({
                        display_name: trade_type.display_name,
                        symbol: trade_type.tick,
                      });
                    }}
                    config={{
                      watchlist: watchlist(),
                      action_component: MarketListAction,
                      onAction: (data) => updateWatchlist(data),
                    }}
                  />
                </Show>
              </Tab>
            )}
          </For>
        </Tabs>
      </Show>
    </>
  );
};

const MarketListAction = (props) => {
  return (
    <div
      id="action"
      onClick={() => props.onAction()}
      class={classNames(styles["action-cell"], {
        [styles.add]: !props.data.includes(props.selected),
        [styles.remove]: props.data.includes(props.selected),
      })}
    >
      <Show
        when={props.data.find((mkt) => mkt === props.selected)}
        fallback={
          <>
            <SVGWrapper
              id={`watch-icon-${props.index}`}
              icon={StarIcon}
              stroke="white"
              class={watchlist_styles["fav-icon-position"]}
              height="24"
            />
          </>
        }
      >
        <>
          <SVGWrapper
            id={`watch-icon-${props.index}`}
            icon={TrashBinIcon}
            stroke="white"
            class={watchlist_styles["fav-icon-position"]}
            height="24"
          />
        </>
      </Show>
    </div>
  );
};

export default MarketList;
