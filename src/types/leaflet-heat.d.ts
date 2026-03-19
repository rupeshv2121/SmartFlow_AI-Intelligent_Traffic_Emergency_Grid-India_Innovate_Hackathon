declare module "leaflet.heat";

declare module "leaflet" {
  export interface HeatLayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }

  export interface HeatLayer extends Layer {
    setLatLngs(latlngs: Array<[number, number, number]>): this;
    addLatLng(latlng: [number, number, number]): this;
    setOptions(options: HeatLayerOptions): this;
    redraw(): this;
  }

  export function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: HeatLayerOptions,
  ): HeatLayer;
}
