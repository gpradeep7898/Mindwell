// frontend/src/components/MoodLineGraph.js
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
// Ensure these functions are correctly exported from moodMapping.js
import { moodToValue, moodToColor, getMoodNameFromValue } from '../utils/moodMapping';
import './MoodLineGraph.css'; // Make sure this CSS file exists

const MoodLineGraph = ({ entries = [], width = 550, height = 280 }) => {
    const svgRef = useRef(null);
    const tooltipRef = useRef(null);

    // --- Processed Data (No changes here) ---
    const processedData = useMemo(() => {
        return entries
            .filter(entry => entry.timestamp?.toDate && moodToValue[entry.mood] !== undefined)
            .map(entry => ({
                id: entry.id,
                date: entry.timestamp.toDate(),
                mood: entry.mood,
                value: moodToValue[entry.mood],
                color: moodToColor[entry.mood] || '#CCCCCC',
                journal: entry.journal || '',
            }))
            .sort((a, b) => a.date - b.date);
    }, [entries]);

    // --- D3 Drawing Effect ---
    useEffect(() => {
        if (!processedData || processedData.length < 1 || !svgRef.current) {
            if (svgRef.current) d3.select(svgRef.current).selectAll("*").remove();
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // Adjusted margin for potentially longer labels after reducing density
        const margin = { top: 20, right: 30, bottom: 50, left: 75 }; // Increased left margin
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // --- Tooltip Setup (No changes here) ---
        let tooltip = d3.select(tooltipRef.current);
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "mood-tooltip")
                .style("opacity", 0)
                .style("position", "absolute")
                .style("pointer-events", "none");
            tooltipRef.current = tooltip.node();
        }

        // --- Scales (No changes here) ---
        const xScale = d3.scaleTime()
            .domain(d3.extent(processedData, d => d.date))
            .range([0, innerWidth])
            .nice();

        const [minMoodVal, maxMoodVal] = d3.extent(Object.values(moodToValue));
        const yScale = d3.scaleLinear()
            .domain([minMoodVal - 0.5, maxMoodVal + 0.5]) // Use full range for plotting
            .range([innerHeight, 0])
            .nice();

        // --- Container Group (No changes here) ---
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // --- Draw Axes ---
        // X Axis (No changes here)
        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.timeFormat("%b %d"));
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${innerHeight})`)
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-35)");

        // Y Axis (Using tickValues)
        // --- Select specific mood values to display as ticks ---
        // *** CUSTOMIZE THIS ARRAY AS NEEDED ***
        const yTickValues = [
            moodToValue['Excited'],      // 5.0 - Highest
            moodToValue['Happy'],       // 4.5 - High positive
            moodToValue['Content'],     // 3.7 - Mid positive
            moodToValue['Okay'],        // 3.0 - Neutral
            moodToValue['Sad'],         // 1.8 - Mid negative
            moodToValue['Anxious'],     // 1.2 - Lower mid negative
            // moodToValue['Stressed'],   // 1.0 (Optional)
            // moodToValue['Devastated']  // 0.1 - Lowest (Optional)
        ].filter(val => val !== undefined).sort((a, b) => a - b); // Ensure valid & sorted

        const yAxis = d3.axisLeft(yScale)
            // Use tickValues to explicitly set the ticks/labels
            .tickValues(yTickValues)
            // Format these specific tick values using mood names
            .tickFormat(value => getMoodNameFromValue(value));

        g.append("g")
            .attr("class", "y-axis")
            .call(yAxis)
            .selectAll(".domain").remove(); // Remove the vertical axis line itself


        // --- Draw the Mood Line (No changes here) ---
        if (processedData.length > 1) {
            const lineGenerator = d3.line()
                .x(d => xScale(d.date))
                .y(d => yScale(d.value))
                .curve(d3.curveMonotoneX);
            g.append("path")
                .datum(processedData)
                .attr("class", "mood-line")
                .attr("fill", "none")
                .attr("stroke", "var(--line-color, #A0D2DB)")
                .attr("stroke-width", 2)
                .attr("d", lineGenerator);
        }

        // --- Draw Data Points (No changes here) ---
        g.selectAll(".mood-point")
            .data(processedData, d => d.id)
            .join("circle")
            .attr("class", "mood-point")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.value))
            .attr("r", 5)
            .attr("fill", d => d.color)
            .attr("stroke", "var(--point-stroke-color, #fff)")
            .attr("stroke-width", 1.5)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                tooltip.transition().duration(150).style("opacity", .95);
                tooltip.html(`
                    <strong style="color:${d.color}">${d.mood}</strong><br/>
                    <span style="font-size: 0.8em;">${d.date.toLocaleDateString()} ${d.date.toLocaleTimeString([], { hour: 'numeric', minute:'2-digit', hour12: true })}</span>
                    ${d.journal ? `<hr/><em>${d.journal.substring(0, 100)}${d.journal.length > 100 ? '...' : ''}</em>` : ''}
                `)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
                d3.select(event.currentTarget).transition().duration(100).attr('r', 7);
            })
            .on("mouseout", (event) => {
                tooltip.transition().duration(300).style("opacity", 0);
                d3.select(event.currentTarget).transition().duration(100).attr('r', 5);
            });

        // --- Cleanup Function (No changes here) ---
        return () => {
            if (tooltipRef.current) {
                d3.select(tooltipRef.current).remove();
                tooltipRef.current = null;
            }
        };

    }, [processedData, width, height]);

    // --- Render SVG Container (No changes here) ---
    return (
        <div className="mood-line-graph-container">
            <svg ref={svgRef} width={width} height={height} aria-labelledby="graphTitle" role="img">
                 <title id="graphTitle">Mood Trend Line Graph</title>
            </svg>
            {processedData.length === 0 && (
                <p className="no-data-message">Log your mood to see your trend graph.</p>
            )}
        </div>
    );
};

export default MoodLineGraph;