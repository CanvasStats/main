import * as d3 from 'd3';
import type { ColorCount } from '../models';
import { navigateTo } from './navigate';

type PieArc = d3.PieArcDatum<ColorCount>;

interface AnimatablePathElement extends SVGPathElement {
    _current: PieArc;
}

export function createColorCountPieChart(year: number, colorCounts: ColorCount[], chartContainer: HTMLElement, isLink: boolean, sliceClass: string) {
    // Setup Dimensions
    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;
    
    // Create the SVG element
    const svg = d3.select(chartContainer)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("display", "block")
        .style("width", "100%")
        .style("height", "auto")
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
        
    // Find tooltip locally inside the parent component card container
    const parentCard = chartContainer.parentElement;
    const tooltip = parentCard 
        ? d3.select(parentCard).select(".chart-tooltip") 
        : d3.select(".chart-tooltip");
        
    // Pie Generator
    const pie = d3.pie<any, ColorCount>()
        .sort(null)
        .value(d => d.count);
        
    // Arc Generator
    const arc = d3.arc<any, d3.PieArcDatum<ColorCount>>()
        .innerRadius(radius * 0.5)
        .outerRadius(radius * 0.9);
        
    // Generate the Pie Data
    const arcs = pie(colorCounts);
    
    // Draw the Slices (Paths)
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
        // Apply interaction routing handlers
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

interface DataRow {
    timestamp: Date;
    pixelCount: number;
}

export function createLineGraph(csvUrl: string | DataRow[], chartContainerID: HTMLElement) {
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

    async function createChart() {
        let rawData!: string | DataRow[];
        if (typeof csvUrl === "string") {
            rawData = await d3.csv(csvUrl, (d) => {
                return {
                    timestamp: parseTime(d.timestamp!),
                    pixelCount: +d.pixelCount!
                } as DataRow;
            });
        } else {
            rawData = csvUrl;
        }
        
        const svg = d3.select(chartContainerID)
            .append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .attr("preserveAspectRatio", "xMinYMin meet")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
            
        const x = d3.scaleTime()
            .domain(d3.extent(rawData, d => d.timestamp) as [Date, Date])
            .range([0, width]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(rawData, d => d.pixelCount) || 0])
            .nice()
            .range([height, 0]);
            
        const line = d3.line<DataRow>()
            .x(d => x(d.timestamp))
            .y(d => y(d.pixelCount))
            .curve(d3.curveMonotoneX);

        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x).ticks(5));

        svg.append("g")
            .call(d3.axisLeft(y));
            
        svg.append("path")
            .datum(rawData)
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    createChart();
}