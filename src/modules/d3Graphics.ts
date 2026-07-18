import * as d3 from 'd3';
import type { ColorCount, DataRow } from '../models';
import { navigateTo } from './navigate';

type PieArc = d3.PieArcDatum<ColorCount>;

interface AnimatablePathElement extends SVGPathElement {
    _current: PieArc;
}

export function createColorCountPieChart(year: number, colorCounts: ColorCount[], chartContainer: HTMLElement, isLink: boolean, sliceClass: string) {
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(chartContainer)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("display", "block")
        .style("width", "100%")
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const parentCard = chartContainer.parentElement;
    const tooltip = parentCard
        ? d3.select(parentCard).select(".chart-tooltip")
        : d3.select(".chart-tooltip");

    const pie = d3.pie<any, ColorCount>()
        .sort(null)
        .value(d => d.count);

    const arc = d3.arc<any, d3.PieArcDatum<ColorCount>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.9);

    const arcs = pie(colorCounts);

    const g = svg.selectAll(".arc")
        .data(arcs)
        .enter().append("g")
        .attr("class", "arc");

    const paths = g.append("path")
        .attr("class", sliceClass)
        .style("fill", d => d.data.hex)
        .style("opacity", "1")
        .style("visibility", "visible")
        .style("stroke-width", "2px")
        .each(function (d) {
            const self = this as AnimatablePathElement;
            self._current = { ...d, endAngle: d.startAngle };
        })
        .on("click", (_event, d) => {
            if (isLink) {
                if (d.data.class === "white") {
                    navigateTo("/draw", { params: { "sentFrom": "home", "color": d.data.class, "background": "black", "year": year } });
                } else {
                    navigateTo("/draw", { params: { "sentFrom": "home", "color": d.data.class, "background": "white", "year": year } });
                }
            }
        })
        .on("mouseover", function (_event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", 1)
                .style("box-shadow", "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)")
            tooltip.html(`
                    <span class="font-bold">${d.data.label}</span><br>
                    ${d.data.count} pixels
                `);
            d3.select(this).style("stroke-width", "4px");
        })
        .on("mousemove", function (_event, d) {
            tooltip.attr("class", `chart-tooltip ${d.data.class}`);
        })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
            d3.select(this).style("stroke-width", "2px");
        });

    paths.transition()
        .duration(350)
        .delay((_d, i) => i * 100)
        .attrTween("d", function (d) {
            const self = this as AnimatablePathElement;
            const i = d3.interpolate(self._current, d);
            self._current = i(1);
            return function (t) {
                return arc(i(t))!;
            };
        });
}

const parseCSVTime = (timeStr: string): Date => {
    const formatA = d3.timeParse("%Y-%m-%d %H:%M:%S")(timeStr);
    if (formatA) return formatA;
    
    const formatB = d3.timeParse("%B %d %Y %H:%M:%S")(timeStr);
    if (formatB) return formatB;

    const nativeFallback = new Date(timeStr);
    if (!isNaN(nativeFallback.getTime())) return nativeFallback;

    throw new Error(`Unable to parse date string: ${timeStr}`);
};

export async function createLineGraph(
    inputData: string | DataRow[], 
    chartContainerID: HTMLElement
) {
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    let parsedData: DataRow[] = [];

    if (typeof inputData === "string") {
        const csvText = await d3.text(inputData);
        const rawRows = d3.csvParse(csvText);

        if (rawRows.length === 0) return;

        const firstRowKeys = Object.keys(rawRows[0]);
        // Find whatever key holds the data numeric values
        const valueKey = firstRowKeys.find(k => k === "pixelCount" || k === "user_count") || firstRowKeys[1];

        parsedData = rawRows.map(d => {
            return {
                timestamp: parseCSVTime(d.timestamp!),
                value: +d[valueKey]!
            };
        });
    } else {
        // Map incoming arrays dynamically. If the array elements still have 'pixelCount', 
        // we safely map it to 'value' so TypeScript doesn't throw an error.
        parsedData = inputData.map(d => ({
            timestamp: d.timestamp,
            value: d.value !== undefined ? d.value : +(d as any).pixelCount
        }));
    }

    // Clean up previous SVG renderings
    d3.select(chartContainerID).selectAll("svg").remove();

    const svg = d3.select(chartContainerID)
        .append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
        .domain(d3.extent(parsedData, d => d.timestamp) as [Date, Date])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(parsedData, d => d.value) || 0])
        .nice()
        .range([height, 0]);

    const line = d3.line<DataRow>()
        .x(d => x(d.timestamp))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.append("path")
        .datum(parsedData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
}

interface TreemapRoot {
    name: string;
    children: ColorCount[];
}

export function createColorTreemap(
    selector: HTMLElement,
    data: ColorCount[],
    aspectRatio: number,
    isLink: boolean,
    year: number,
    total_pixels: number
): () => void {
    const container = d3.select(selector);
    container.selectAll('*').remove();
    container.style('position', 'relative');

    let tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;
    const existingTooltip = d3.select<HTMLDivElement, unknown>('#treemap-tooltip');
    if (existingTooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('id', 'treemap-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('background-color', 'rgba(33, 33, 33, 0.9)')
            .style('color', '#fff')
            .style('padding', '6px 10px')
            .style('border-radius', '4px')
            .style('font-size', '12px')
            .style('font-family', 'sans-serif')
            .style('pointer-events', 'none')
            .style('z-index', '1000');
    } else {
        tooltip = existingTooltip;
    }

    function render(width: number) {
        const height = width * aspectRatio;
        container.selectAll('svg').remove();
        const rootData: TreemapRoot = { name: "root", children: data };
        const root = d3.hierarchy<TreemapRoot>(rootData)
            .sum((d: any) => d.count)
            .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

        d3.treemap<TreemapRoot>()
            .size([width, height])
            .padding(2)
            (root);

        const svg = container
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('display', 'block');

        const leaves = root.leaves() as d3.HierarchyRectangularNode<any>[];

        const cell = svg.selectAll('g')
            .data(leaves)
            .join('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        if (isLink) {
            cell.append('rect')
                .attr('width', d => d.x1 - d.x0)
                .attr('height', d => d.y1 - d.y0)
                .attr('fill', d => d.data.hex)
                .attr('stroke', d => d.data.label.toLowerCase() === 'white' ? '#ccc' : 'none')
                .style('cursor', 'pointer')
                .on("click", (_event, d) => {
                    if (d.data.class === "white") {
                        navigateTo("/draw", { params: { "sentFrom": "home", "color": d.data.class, "background": "black", "year": year } });
                    } else {
                        navigateTo("/draw", { params: { "sentFrom": "home", "color": d.data.class, "background": "white", "year": year } });
                    }
                })
                .on('mouseover', function () {
                    tooltip.style('visibility', 'visible');
                })
                .on('mousemove', function (event, d) {
                    tooltip
                        .html(`<strong>${d.data.label}</strong><br/>Count: ${d.data.count.toLocaleString()} pixels`)
                        .style('top', (event.pageY - 40) + 'px')
                        .style('left', (event.pageX + 15) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.style('visibility', 'hidden');
                });
        } else {
            cell.append('rect')
                .attr('width', d => d.x1 - d.x0)
                .attr('height', d => d.y1 - d.y0)
                .attr('fill', d => d.data.hex)
                .attr('stroke', d => d.data.label.toLowerCase() === 'white' ? '#ccc' : 'none')
                .on('mouseover', function () {
                    tooltip.style('visibility', 'visible');
                })
                .on('mousemove', function (event, d) {
                    tooltip
                        .html(total_pixels == 0 ? `${d.data.label}</strong><br/>Count: ${d.data.count.toLocaleString()} pixels` : `<strong>${d.data.label}</strong><br/>Count: ${((d.data.count / total_pixels) * 100).toFixed(2)} %`)
                        .style('top', (event.pageY - 40) + 'px')
                        .style('left', (event.pageX + 15) + 'px');
                })
                .on('mouseout', function () {
                    tooltip.style('visibility', 'hidden');
                });
        }

        cell.append('text')
            .attr('x', 5)
            .attr('y', 15)
            .text((d: any) => total_pixels == 0 ? `${d.data.label}: ${d.data.count.toLocaleString()} pixels` : `${d.data.label}: ${((d.data.count / total_pixels) * 100).toFixed(2)} %`)
            .style('font-size', '11px')
            .style('font-family', 'sans-serif')
            .style('font-weight', 'bold')
            .attr('fill', d => ['white', 'yellow', 'pastel yellow', 'aqua'].includes(d.data.label.toLowerCase()) ? '#000' : '#fff')
            .style('pointer-events', 'none')
            .style('display', d => (d.x1 - d.x0 < 90 || d.y1 - d.y0 < 25) ? 'none' : 'block');
    }

    const htmlElement = container.node() as HTMLElement;

    render(htmlElement.clientWidth || 800);

    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const newWidth = entry.contentRect.width;
            if (newWidth > 0) {
                render(newWidth);
            }
        }
    });

    resizeObserver.observe(htmlElement);

    return () => {
        resizeObserver.disconnect();
        tooltip.remove();
    };
}