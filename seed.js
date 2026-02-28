// seed.js
function initSeedFilter(data, updateCallback) {
    const container = d3.select("#seeding-container");
    container.html(""); // Clear existing

    const width = container.node().getBoundingClientRect().width || 100;
    const height = container.node().getBoundingClientRect().height || 200;
    const margin = {top: 10, right: 10, bottom: 10, left: 10};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    const seeds = d3.range(1, 17); // Generates array [1, 2, ..., 16]
    let selectedSeeds = new Set(); // Keeps track of multiple selections

    // Layout math for a 2-column grid
    const cols = 2;
    const rows = 8;
    const gap = 6;
    const boxWidth = (width - margin.left - margin.right - gap) / cols;
    const boxHeight = (height - margin.top - margin.bottom - (gap * (rows - 1))) / rows;

    // Create a group for each seed button
    const seedNodes = svg.selectAll(".seed-box")
        .data(seeds)
        .enter()
        .append("g")
        .attr("class", "seed-box")
        .attr("transform", (d, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = margin.left + col * (boxWidth + gap);
            const y = margin.top + row * (boxHeight + gap);
            return `translate(${x}, ${y})`;
        })
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            // Toggle the clicked seed in our Set
            if (selectedSeeds.has(d)) {
                selectedSeeds.delete(d);
            } else {
                selectedSeeds.add(d);
            }
            
            updateStyles(); // Update colors
            
            // Tell app.js what is currently selected
            if (selectedSeeds.size === 0) {
                updateCallback(null); // Nothing selected means show everything
            } else {
                updateCallback(Array.from(selectedSeeds)); // Send array of selected seeds
            }
        });

    // Draw the button backgrounds
    seedNodes.append("rect")
        .attr("width", boxWidth)
        .attr("height", boxHeight)
        .attr("rx", 4) // Rounded corners
        .attr("fill", "#fff")
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 1);

    // Add the seed numbers to the center of the buttons
    seedNodes.append("text")
        .attr("x", boxWidth / 2)
        .attr("y", boxHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-family", "sans-serif")
        .style("fill", "#4b5563")
        .text(d => d);

    // Simple hover effect
    seedNodes.on("mouseover", function(event, d) {
        if (!selectedSeeds.has(d)) {
            d3.select(this).select("rect").attr("fill", "#f3f4f6");
        }
    }).on("mouseout", function(event, d) {
        if (!selectedSeeds.has(d)) {
            d3.select(this).select("rect").attr("fill", "#fff");
        }
    });

    // Function to visually switch buttons between blue (active) and white (inactive)
    function updateStyles() {
        seedNodes.select("rect")
            .transition().duration(150)
            .attr("fill", d => selectedSeeds.has(d) ? "#3498db" : "#fff")
            .attr("stroke", d => selectedSeeds.has(d) ? "#2980b9" : "#d1d5db");

        seedNodes.select("text")
            .transition().duration(150)
            .style("fill", d => selectedSeeds.has(d) ? "#fff" : "#4b5563")
            .style("font-weight", d => selectedSeeds.has(d) ? "bold" : "normal");
    }
}