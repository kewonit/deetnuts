# India study map

`india-outline.geojson` is a locally served country outline, including the northern territories depicted by India's official boundary convention, Lakshadweep and Andaman & Nicobar. It replaces the CARTO raster tiles that started returning "API key required" images.

Source: [DataMeet's CC0 India composite](https://github.com/datameet/maps/blob/b3fbbde595310b397a55d718e0958ce249a4fa1f/Country/india-composite.geojson). Its [dataset documentation](https://github.com/datameet/maps/blob/b3fbbde595310b397a55d718e0958ce249a4fa1f/Country/README.md) identifies the public-domain inputs and explicitly licenses this composite under CC0. The outline was visually checked against Survey of India's [Political Map of India, English 13th edition (2026)](https://surveyofindia.gov.in/UserFiles/files/POLMAP_ENGLISH-2026.pdf). The official PDF is a reference and is not redistributed here. The on-map attribution links to DataMeet.

Pinned source revision: `b3fbbde595310b397a55d718e0958ce249a4fa1f`.
Original composite SHA-256: `5e44c39b18aa8fe57267d8018fa4ad4a10eaa3aa4cb7cb7382a1813ef8eb8c53`.

For the country overview, the source was simplified with mapshaper 0.7.82, `-explode -simplify dp interval=500 keep-shapes -o format=geojson precision=0.0001`. Splitting the source into polygon features before simplification preserves each island. The resulting polygons were combined into a MultiPolygon and wrapped in a single FeatureCollection with `properties.name = "India"`. The 500-metre display simplification retains the island groups and the full national extent; it is not street-level or navigational data. Map coordinates and student markers use WGS84 longitude/latitude through Leaflet's standard projection.

The map fits the complete country at initialization and resize, supports zoom/pan and an explicit reset, and follows TimeKeeper's themes. Session controls sit outside the geography so they do not cover it on mobile. The existing live-session backend and approximate-location behavior are unchanged. The map requires no external tile server, API key or new runtime configuration.
