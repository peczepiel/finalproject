// bubbles.js

function renderBubbles(filteredData) {
    const container = d3.select("#bottom-half");
    
    // Clear the container
    container.html("");

    if (filteredData.length === 0) {
        container.append("p")
            .style("padding", "20px")
            .text("No teams match the current filters.");
        return;
    }

    // Get the dynamic dimensions of the bottom half
    const width = container.node().getBoundingClientRect().width;
    const height = container.node().getBoundingClientRect().height;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create or select the tooltip div
    let tooltip = d3.select("body").select(".bubble-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "bubble-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border", "1px solid #ccc")
            .style("border-radius", "8px")
            .style("padding", "12px")
            .style("font-size", "14px")
            .style("pointer-events", "none") 
            .style("opacity", 0)
            .style("z-index", 1000)
            .style("box-shadow", "0 4px 6px rgba(0,0,0,0.1)");
    }

    // --- NEW: STRICT MARGIN CALCULATIONS ---
    const margin = 20; // 20px hard margin on all sides
    const safeWidth = width - (margin * 2);
    const safeHeight = height - (margin * 2);
    const safeArea = safeWidth * safeHeight;
    
    // Calculate how much space each node gets inside the safe area
    const maxAreaPerNode = safeArea / filteredData.length;
    
    // Multiplier adjusted to 0.75 to account for the empty space between packed circles.
    // Also added a safety check so a bubble can never be taller than the safe height.
    const maxPossibleRadius = Math.min(100, safeHeight / 2, safeWidth / 2);
    const baseRadius = Math.max(15, Math.min(maxPossibleRadius, Math.sqrt(maxAreaPerNode / Math.PI) * 0.75));

    const nodes = filteredData.map(d => ({
        ...d,
        radius: baseRadius
    }));

    const simulation = d3.forceSimulation(nodes)
        .force("x", d3.forceX(width / 2).strength(0.05))
        .force("y", d3.forceY(height / 2).strength(0.05))
        .force("collide", d3.forceCollide().radius(d => d.radius + 1).iterations(4)); 

    const nodeG = svg.selectAll(".node")
        .data(nodes, d => d.TEAM + d.YEAR)
        .enter()
        .append("g")
        .attr("class", "node")
        .style("cursor", "pointer")
        .call(d3.drag() 
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    nodeG.append("circle")
        .attr("r", d => d.radius)
        .attr("fill", "#3498db")
        .attr("stroke", "#2980b9")
        .attr("stroke-width", 2)
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "#e67e22").attr("stroke", "#d35400");
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>${d.TEAM}</strong> (${d.YEAR})<br/>
                <hr style="margin: 5px 0; border: 0; border-top: 1px solid #eee;">
                <strong>Seed:</strong> ${d.SEED}<br/>
                <strong>Win %:</strong> ${d["W %"]}<br/>
                <strong>Conf:</strong> ${d.CONF}<br/>
                <strong>Finish:</strong> ${d.POSTSEASON || 'N/A'}
            `)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 30) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this).attr("fill", "#3498db").attr("stroke", "#2980b9");
            tooltip.transition().duration(500).style("opacity", 0);
        });

    nodeG.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .style("fill", "white")
        .style("font-family", "Arial, sans-serif")
        .style("font-size", d => Math.max(9, Math.min(22, d.radius / 2.5)) + "px") 
        .style("font-weight", "bold")
        .style("pointer-events", "none") 
        .text(d => {
            if (d.radius > 35) return d.TEAM;
            
            const words = d.TEAM.split(" ");
            if (words.length > 1) {
                return words.map(w => w[0]).join("").substring(0, 3).toUpperCase();
            }
            return d.TEAM.substring(0, 3).toUpperCase();
        });

    // --- NEW: STRICT CLAMPING IN THE PHYSICS TICK ---
    simulation.on("tick", () => {
        nodeG.attr("transform", d => {
            // The bubbles cannot physically go past the exact 20px margin on any side
            d.x = Math.max(margin + d.radius, Math.min(width - margin - d.radius, d.x));
            d.y = Math.max(margin + d.radius, Math.min(height - margin - d.radius, d.y));
            return `translate(${d.x},${d.y})`;
        });
    });

    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }
    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}