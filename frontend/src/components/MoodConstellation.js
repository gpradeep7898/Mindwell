// frontend/src/components/MoodConstellation.js
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3'; // Import all of d3
// Ensure the path to moodMapping is correct
import { moodToValue, moodToColor, moodToRadius } from '../utils/moodMapping';
import './MoodConstellation.css'; // Link to its CSS

// Component Props: entries array, optional width/height
const MoodConstellation = ({ entries = [], width = 600, height = 300 }) => {
    const svgRef = useRef(null); // Ref for the SVG element
    const tooltipRef = useRef(null); // Ref for the tooltip element

    // Memoize processed data to avoid recalculation unless entries change
    const processedData = useMemo(() => {
        return entries
            // Filter out entries without valid timestamp or mappable mood
            .filter(entry => entry.timestamp?.toDate && moodToValue[entry.mood] !== undefined)
            .map(entry => ({
                id: entry.id, // Keep ID for potential key prop use
                date: entry.timestamp.toDate(), // Convert Firestore Timestamp to JS Date
                mood: entry.mood,
                value: moodToValue[entry.mood], // Get numerical value
                color: moodToColor[entry.mood] || '#CCCCCC', // Get color, default grey
                radius: moodToRadius(entry), // Get radius (based on journal entry presence)
                journal: entry.journal || '', // Include journal for tooltip
            }))
            // Sort by date ASCENDING for correct line connections / time flow
            .sort((a, b) => a.date - b.date);
    }, [entries]); // Dependency array: recalculate only if entries change

    // D3 drawing effect
    useEffect(() => {
        if (!processedData || !svgRef.current) {
             // Clear SVG if no data or ref isn't ready yet
             if (svgRef.current) {
                d3.select(svgRef.current).selectAll("*").remove();
             }
            return; // Exit effect if no data or SVG element isn't mounted
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // Clear previous render on updates

        const margin = { top: 20, right: 30, bottom: 30, left: 40 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Tooltip setup
        let tooltip = d3.select(tooltipRef.current); // Select existing tooltip div
        if (tooltip.empty()) { // Create tooltip div if it doesn't exist yet
            tooltip = d3.select("body").append("div")
                .attr("class", "mood-tooltip")
                .style("opacity", 0) // Start hidden
                .style("position", "absolute") // Needed for pageX/pageY positioning
                .style("pointer-events", "none"); // Prevent tooltip from blocking mouse events
            tooltipRef.current = tooltip.node(); // Store node reference
        }


        // --- Scales ---
        // X Scale (Time)
        const xScale = d3.scaleTime()
            .domain(d3.extent(processedData, d => d.date) || [new Date(), new Date()]) // Handle empty data case for domain
            .range([0, innerWidth])
            .nice(); // Adjust domain to round time nicely

        // Y Scale (Mood Value) - maps numerical mood value to vertical position
        const yScale = d3.scaleLinear()
            .domain([0, 5]) // Based on moodToValue range (adjust if needed)
            .range([innerHeight, 0]) // Inverted: Lower value = lower on chart
            .nice();

        // --- Container Group ---
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // --- Draw Connecting Lines (Optional) ---
        /*
        const lineGenerator = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX); // Smooth curve

        g.append("path")
            .datum(processedData.filter(d => d.value !== undefined)) // Ensure value exists
            .attr("class", "mood-line")
            .attr("fill", "none")
            .attr("stroke", "var(--color-text-lighter, #a0a4bf)")
            .attr("stroke-width", 1.5)
            .attr("stroke-opacity", 0.4) // Subtle line
            .attr("d", lineGenerator);
        */

        // --- Draw the "Stars" (Circles) ---
        g.selectAll(".mood-star")
            .data(processedData, d => d.id) // Use entry ID as key for object constancy
            .join("circle")
            .attr("class", "mood-star")
            .attr("cx", d => xScale(d.date))
            .attr("cy", d => yScale(d.value))
            .attr("fill", d => d.color)
            .attr("opacity", 0.85)
            .attr("r", 0) // Start radius at 0 for animation
            .on("mouseover", (event, d) => { // Tooltip show
                tooltip.transition().duration(150).style("opacity", .95); // Faster fade-in
                tooltip.html(`
                    <strong style="color:${d.color}">${d.mood}</strong><br/>
                    <span style="font-size: 0.8em;">${d.date.toLocaleDateString()} ${d.date.toLocaleTimeString([], { hour: 'numeric', minute:'2-digit' })}</span>
                    ${d.journal ? `<hr style="margin: 3px 0; border-top: 1px solid #eee;"/><em>${d.journal.substring(0, 100)}${d.journal.length > 100 ? '...' : ''}</em>` : ''}
                `)
                    // Position tooltip relative to mouse pointer
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => { // Tooltip hide
                tooltip.transition().duration(300).style("opacity", 0);
            })
            // Animate radius on entry/update
            .transition()
            .duration(500)
            .delay((d, i) => i * 10) // Stagger animation slightly
            .attr("r", d => d.radius);


        // Cleanup function to remove tooltip when component unmounts
        return () => {
            if (tooltipRef.current) {
                d3.select(tooltipRef.current).remove(); // Remove tooltip div from body
                tooltipRef.current = null; // Clear ref
            }
        };

    }, [processedData, width, height]); // Rerun effect if data or dimensions change


    // --- Render SVG Container ---
    return (
        <div className="mood-constellation-container">
            <svg ref={svgRef} width={width} height={height} aria-labelledby="constellationTitle" role="img">
                 <title id="constellationTitle">Mood Constellation Chart</title>
                 {/* Axes can be added back here if desired */}
            </svg>
            {/* Message shown when there is no data */}
            {processedData.length === 0 && (
                <p className="no-data-message">Log your mood to see your constellation grow.</p>
            )}
        </div>
    );
};

export default MoodConstellation;