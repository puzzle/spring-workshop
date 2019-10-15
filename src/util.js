import * as d3 from 'd3';

export const chapters = (slides) => d3
  .nest()
  .key((d) => d.chapter)
  .entries(slides);
