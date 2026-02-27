function initWinPercentFilter(data, updateCallback) {
    const container = d3.select("#win-graph-container");
    
    // Get dynamic width/height from the container
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;
    const margin = {top: 10, right: 10, bottom: 20, left: 30};

    // Create the SVG canvas
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // X Axis setup (Win % from 0 to 100)
    const x = d3.scaleLinear()
        .domain([0, 100])
        .range([margin.left, width - margin.right]);

    // Setup the histogram bins (grouping teams by similar win %)
    const histogram = d3.histogram()
        .value(d => d.winPctRaw)
        .domain(x.domain())
        .thresholds(x.ticks(10)); // Splits data into ~10 bars

    const bins = histogram(data);

    // Y Axis setup (Count of teams in that bin)
    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    // Draw the X axis
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d => d + "%"));

    // Draw the Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(4));

    // Draw the bars
    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", 1)
        .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr("height", d => height - margin.bottom - y(d.length))
        .style("fill", "#3498db") // Default blue color
        
        // --- HOVER INTERACTIVITY ---
        .on("mouseover", function(event, d) {
            // Highlight the bar orange
            d3.select(this).style("fill", "#e67e22");
            
            // Filter the global dataset to only teams in this bin
            const filteredData = data.filter(item => item.winPctRaw >= d.x0 && item.winPctRaw < d.x1);
            
            // Call the render function to update bottom half
            updateCallback(filteredData);
        })
        .on("mouseout", function(event, d) {
            // Return to default blue
            d3.select(this).style("fill", "#3498db");
            
            // Reset bottom half to show all data
            updateCallback(data);
        });
}