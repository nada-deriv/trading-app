import { Switch, Match } from "solid-js";
import styles from "../styles/watchlist.module.scss";
import classNames from "classnames";
import {
  prevWatchList,
  selectedMarkets,
  setSelectedMarkets,
  watchList,
  watchListRef,
} from "../stores";
import { sendRequest } from "../utils/socket-base";

const MarketValue = (props) => {
  const difference = () => {
    if (
      isNaN(watchList()[props.symbol]) &&
      isNaN(prevWatchList()[props.symbol])
    ) {
      return { value: 0, status: "" };
    }
    let status = "same";
    const rateChange =
      watchList()[props.symbol] - prevWatchList()[props.symbol];
    if (watchList()[props.symbol] < prevWatchList()[props.symbol]) {
      status = "decrease";
    } else if (watchList()[props.symbol] > prevWatchList()[props.symbol]) {
      status = "increase";
    }
    return { value: rateChange ?? 0, status };
  };

  return (
    <section class={styles["market-value"]}>
      <span
        class={classNames(
          styles["badge"],
          styles[`badge--${difference().status}`]
        )}
      >
        {watchList()[props.symbol]}
      </span>
      <span
        class={classNames(styles.text, styles[`text--${difference().status}`])}
      >
        <b>{difference()["value"].toFixed(2)}</b>
        <Switch>
          <Match when={difference().status === "increase"}>
            <div class={styles["arrow-up"]} />
          </Match>
          <Match when={difference().status === "decrease"}>
            <div class={styles["arrow-down"]} />
          </Match>
        </Switch>
      </span>
    </section>
  );
};

const Watchlist = (props) => {
  const removeWatchlistHandler = (symbol) => {
    const newList = JSON.parse(localStorage.getItem("favourites")).filter(
      (sym) => sym !== symbol
    );
    localStorage.setItem("favourites", JSON.stringify(newList));
    setSelectedMarkets(
      selectedMarkets().filter((mkt) => mkt.symbol !== symbol)
    );
    sendRequest({ forget: watchListRef()[symbol] });
  };

  return (
    <div class={styles["card"]}>
      <div class={styles["card--title"]}>
        <span class={styles["card--title-name"]}>{props.name}</span>
        <span class={styles["card--title-symbol"]}>{props.symbol}</span>
      </div>
      <div class={styles["container"]}>
        <section class={styles["market-info"]}>
          <p class={styles["market-info-data"]}>Market: {props.market}</p>
          <p class={styles["market-info-data"]}>
            Sub market: {props.submarket}
          </p>
        </section>
        <MarketValue symbol={props.symbol} />
      </div>
      <button
        onClick={() => removeWatchlistHandler(props.symbol)}
        class={styles["button"]}
      >
        Remove from Watchlist
      </button>
    </div>
  );
};

export default Watchlist;
