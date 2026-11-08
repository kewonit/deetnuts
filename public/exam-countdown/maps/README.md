# India study map

`india-outline.geojson` is a locally served country outline, including the northern territories depicted by India's official boundary convention, Lakshadweep and Andaman & Nicobar. It replaces the CARTO raster tiles that started returning "API key required" images.

Source: [DataMeet's CC0 India composite](https://github.com/datameet/maps/blob/b3fbbde595310b397a55d718e0958ce249a4fa1f/Country/india-composite.geojson). Its [dataset documentation](https://github.com/datameet/maps/blob/b3fbbde595310b397a55d718e0958ce249a4fa1f/Country/README.md) identifies the public-domain inputs and explicitly licenses this composite under CC0. The outline was visually checked against Survey of India's [Political Map of India, English 13th edition (2026)](https://surveyofindia.gov.in/UserFiles/files/POLMAP_ENGLISH-2026.pdf). The official PDF is a reference and is not redistributed here. The on-map attribution links to DataMeet.

Pinned source revision: `b3fbbde595310b397a55d718e0958ce249a4fa1f`.
Original composite SHA-256: `5e44c39b18aa8fe57267d8018fa4ad4a10eaa3aa4cb7cb7382a1813ef8eb8c53`.

For the country overview, the source was simplified with mapshaper 0.7.82, `-explode -simplify dp interval=500 keep-shapes -o format=geojson precision=0.0001`. Splitting the source into polygon features before simplification preserves each island. The resulting polygons were combined into a MultiPolygon and wrapped in a single FeatureCollection with `properties.name = "India"`. The 500-metre display simplification retains the island groups and the full national extent; it is not street-level or navigational data. Map coordinates and student markers use WGS84 longitude/latitude through Leaflet's standard projection.

The map fits the complete country at initialization and resize, supports zoom/pan and an explicit reset, and follows TimeKeeper's themes. Session controls sit outside the geography so they do not cover it on mobile. The existing live-session backend and approximate-location behavior are unchanged. The map requires no external tile server, API key or new runtime configuration.

## World layer

`world-india-view.geojson` draws the other countries around India so the map can open on India and zoom out to the whole world. It comes from Natural Earth's [Admin 0 – Countries, India point of view](https://github.com/nvkelso/natural-earth-vector/blob/ca96624a56bd078437bca8184e78163e5039ad19/geojson/ne_10m_admin_0_countries_ind.geojson) (public domain). In this edition the shapes of neighbouring countries follow India's official boundary, so they meet the DataMeet outline above, which is drawn on top. India and Antarctica are removed from the layer.

Pinned source revision: `ca96624a56bd078437bca8184e78163e5039ad19`.
Original file SHA-256: `3e67a5a6ddeff3247ca8400cd2514fd4a5ac6e5432823b25d610a7028597d45f`.

Built with mapshaper 0.7.82:

```sh
mapshaper ne_10m_admin_0_countries_ind.geojson \
  -filter 'ADM0_A3 != "IND" && ADM0_A3 != "ATA"' \
  -filter-fields NAME \
  -simplify dp 2% keep-shapes -clean \
  -o format=geojson precision=0.01 world-india-view.geojson
```

The 2% display simplification keeps borders legible at country zoom; it is not navigational data. Real study sessions anywhere in the world are shown; illustrative sessions are placed in Indian cities (see `lib/timekeeper/demo-sessions.ts`).
