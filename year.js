// year.js
function initYearFilter(data, updateCallback) {
    const container = d3.select("#year-selector");
    container.html(""); 

    const width = container.node().getBoundingClientRect().width || 300;
    const height = container.node().getBoundingClientRect().height || 100;
    const margin = {top: 25, right: 30, bottom: 30, left: 30};

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // --- NEW: Generate a continuous list of years from min to max ---
    const minYear = d3.min(data, d => parseInt(d.YEAR));
    const maxYear = d3.max(data, d => parseInt(d.YEAR));
    const years = d3.range(minYear, maxYear + 1);

    const x = d3.scalePoint()
        .domain(years)
        .range([margin.left, width - margin.right])
        .padding(0.5);

    svg.append("line")
        .attr("x1", margin.left)
        .attr("x2", width - margin.right)
        .attr("y1", height / 2)
        .attr("y2", height / 2)
        .attr("stroke", "#d1d5db")
        .attr("stroke-width", 4)
        .attr("stroke-linecap", "round");

    let selectedYear = null;

    const yearNodes = svg.selectAll(".year-node")
        .data(years)
        .enter()
        .append("g")
        .attr("class", "year-node")
        .attr("transform", d => `translate(${x(d)}, ${height / 2})`)
        .style("cursor", d => d === 2020 ? "not-allowed" : "pointer") // Block click icon for 2020
        .on("click", function(event, d) {
            if (d === 2020) return; // Ignore clicks entirely on 2020
            
            if (selectedYear === d) {
                selectedYear = null; 
                updateCallback(null);
            } else {
                selectedYear = d;
                updateCallback(d);
            }
            updateStyles();
        });

    // Draw the circles, styling 2020 distinctly
    yearNodes.append("circle")
        .attr("r", 0) 
        .attr("fill", d => d === 2020 ? "#f3f4f6" : "#fff")
        .attr("stroke", d => d === 2020 ? "#9ca3af" : "#3498db")
        .attr("stroke-width", d => d === 2020 ? 2 : 3)
        .attr("stroke-dasharray", d => d === 2020 ? "2,2" : "none") // Dashed line for missing data
        .transition().duration(400) 
        .attr("r", d => d === 2020 ? 6 : 8);

    // The text for the year
    yearNodes.append("text")
        .attr("y", 28)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-family", "sans-serif")
        .style("fill", d => d === 2020 ? "#9ca3af" : "#6b7280")
        .text(d => d);

    // Label exclusively for 2020
    yearNodes.filter(d => d === 2020).append("text")
        .attr("y", -18)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("font-weight", "bold")
        .style("fill", "#ef4444")
        .text("COVID");

    yearNodes.on("mouseover", function(event, d) {
        if (d !== 2020 && selectedYear !== d) {
            d3.select(this).select("circle").attr("fill", "#eaf2f8");
        }
    }).on("mouseout", function(event, d) {
        if (d !== 2020) updateStyles();
    });

    function updateStyles() {
        yearNodes.filter(d => d !== 2020).select("circle")
            .transition().duration(200)
            .attr("fill", d => d === selectedYear ? "#3498db" : "#fff")
            .attr("r", d => d === selectedYear ? 10 : 8);
        
        yearNodes.filter(d => d !== 2020).select("text")
            .style("font-weight", d => d === selectedYear ? "bold" : "normal")
            .style("fill", d => d === selectedYear ? "#1f2937" : "#6b7280");
    }
}