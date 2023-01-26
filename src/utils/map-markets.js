export const mapMarket = (active_symbols) => {
  return active_symbols.reduce((symbol_map, symbol) => {
    return {
      ...symbol_map,
      [symbol.symbol]: symbol,
    };
  }, {});
};
export const getFavourites = () => {
  const active_user = localStorage.getItem("userId") ?? "guest";
  return JSON.parse(localStorage.getItem(`${active_user}-favourites`)) ?? [];
};

export const segregateMarkets = (active_symbols) =>
  active_symbols.reduce(
    (markets, symbol) => ({
      ...markets,
      [symbol.market]: [...(markets[symbol.market] || []), symbol],
    }),
    {}
  );
