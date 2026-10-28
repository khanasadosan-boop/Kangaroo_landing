// Генерирует public/assets/world-map.svg из Natural Earth (world-atlas, 110m).
// Каждая страна получает атрибут data-iso="UZB" — подсветка стран-участниц
// задаётся в public/config.js (map.countries) и применяется в браузере.
// Запуск: npm install && npm run build:map
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import countries from "i18n-iso-countries";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("world-atlas/countries-110m.json"), "utf8"));
const world = feature(topo, topo.objects.countries);
world.features = world.features.filter((f) => f.properties.name !== "Antarctica");

const W = 1000, H = 500;
const projection = geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], world);
const path = geoPath(projection).digits(1);

// Несколько территорий в 110m без числового кода
const byName = { Kosovo: "XKX", "N. Cyprus": "CYP", Somaliland: "SOM" };

const paths = world.features.map((f) => {
  const iso = (f.id && countries.numericToAlpha3(f.id)) || byName[f.properties.name] || "";
  return `<path data-iso="${iso}" d="${path(f)}"><title>${f.properties.name}</title></path>`;
});

const uz = world.features.find((f) => f.id === "860");
const [ux, uy] = projection([64.6, 41.4]); // центр Узбекистана (lon, lat)

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" data-uz-x="${ux.toFixed(1)}" data-uz-y="${uy.toFixed(1)}" role="img">
<g class="countries">${paths.join("")}</g>
</svg>
`;
writeFileSync(new URL("../public/assets/world-map.svg", import.meta.url), svg);
console.log(`world-map.svg: ${paths.length} countries, UZ marker at ${ux.toFixed(1)},${uy.toFixed(1)}, ${(svg.length / 1024).toFixed(0)} KB${uz ? "" : " (UZ not found!)"}`);
