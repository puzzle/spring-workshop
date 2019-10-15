import 'regenerator-runtime/runtime';
import 'github-markdown-css';
import 'highlight.js/scss/default.scss';
import './styles.scss';

import * as d3 from 'd3';
import hljs from 'highlight.js';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('java', java);
hljs.registerLanguage('json', json);

const timelinePosition = d3.scaleLinear()
  .range([-470, 470]);

const bubbleSize = d3.scaleLinear()
  .range([3, 15]);

function clamp(input, min, max) { return Math.min(Math.max(input, min), max); }

function showSlide(slideData) {
  const slide = d3.select('main')
    .classed('title', slideData.isTitleSlide)
    .selectAll('div.slide')
    .data([slideData], (d) => d.pageNumber);

  d3.select('title').text(slideData.title);

  slide
    .enter()
    .append('div')
    .attr('class', 'slide')
    .classed('main', (d) => d.isTitleSlide)
    .append('div')
    .style('transform', 'scaleX(0.1)rotate(-10deg)')
    .html((d) => d.html)
    .call((el) => {
      el.selectAll('*')
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 100)
        .style('opacity', 1);

      el.selectAll('code')
        .call((codeSelection) => {
          codeSelection.each(function () {
            hljs.highlightBlock(this);
          });
        })
        .on('click', async function () {
          try {
            await navigator.clipboard.writeText(this.innerText);
            d3.select('#message')
              .text('Copied to clipboard!')
              .style('opacity', 1)
              .transition()
              .delay(600)
              .style('opacity', 0);
          } catch (err) {
            console.error(err);
          }
        });
    })
    .transition()
    .duration(800)
    .style('transform', null);

  slide
    .exit()
    .transition()
    .duration(500)
    .style('transform', 'scale(0.3)rotate(10deg)')
    .style('opacity', 0)
    .remove();

  let index = d3.select('#slides').selectAll('*').data().indexOf(slideData);

  if (index === -1) {
    index = 0;
  }

  d3.select('nav')
    .transition()
    .style('opacity', 1)
    .transition()
    .delay(3000)
    .style('opacity', 0);

  const l = d3.select('#slides').selectAll('*').data().length;

  d3.select('#cursor')
    .transition()
    .duration(1000)
    .ease(d3.easeBounceOut)
    .attr('transform', `translate(${timelinePosition(index) + 940 / l / 2}, 0)`);

  window.location.hash = index;
}
function initPresentationHtml(html) {
  const slides = html.split('<hr>').map((innerHtml, i) => ({
    pageNumber: i,
    isTitleSlide: innerHtml.includes('<h1'),
    title: innerHtml.match(/<h\d.*?>(.*?)<\/h\d>/) ? innerHtml.match(/<h\d.*?>(.*?)<\/h\d>/)[1] : undefined,
    html: innerHtml.trim(),
  }));

  slides.reduce((prev, cur) => {
    let titleSlide = prev;
    if (!prev) {
      titleSlide = cur;
    } else if (cur.isTitleSlide) {
      titleSlide = cur;
    }
    // eslint-disable-next-line no-param-reassign
    cur.titleSlide = titleSlide;
    return prev;
  });

  console.log(slides);

  timelinePosition
    .domain([0, slides.length]);

  bubbleSize
    .domain(d3.extent(slides, (d) => d.html.length));

  // nav
  d3.select('body')
    .on('mousemove', () => {
      d3.select('nav')
        .transition()
        .style('opacity', 1)
        .transition()
        .delay(3000)
        .style('opacity', 0);
    });

  const bubbles = d3.select('#slides').selectAll('rect')
    .data(slides);

  bubbles
    .join('rect')
    .attr('fill', (d) => (d.isTitleSlide ? '#f55' : '#55f'))
    .attr('width', 940 / 1.1 / slides.length)
    .attr('height', 10)
    .on('click', (d) => showSlide(d))
    .transition()
    .duration(1000)
    .delay((d, i) => i * 50)
    .ease(d3.easeBackInOut)
    .attr('x', (d, i) => timelinePosition(i));

  showSlide(slides[parseInt(window.location.hash.substr(1), 10) || 0]);

  window.onkeydown = (ev) => {
    const index = d3.select('#slides').selectAll('*').data().indexOf(d3.select('div.slide').datum());
    switch (ev.code) {
      case 'ArrowRight':
      case 'Space':
      case 'PageDown':
        ev.preventDefault();
        showSlide(slides[clamp(index + 1, 0, slides.length - 1)]);
        break;
      case 'PageUp':
      case 'ArrowLeft':
        showSlide(slides[clamp(index - 1, 0, slides.length - 1)]);
        break;
      default:
    }
  };
}

initPresentationHtml(require('../PRESENTATION.md'));
