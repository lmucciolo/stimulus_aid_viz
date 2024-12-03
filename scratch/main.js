// create scale functions
const scale_avg = d3.scaleLinear([0, 16000], [250, 0]);
const scale_perc = d3.scaleLinear([0, 120], [250, 0]);
const scale_child = d3.scaleLinear([0, 3], [0, 250]);
const scale_hh = d3.scaleLinear([0, 11200], [0, 35]);
let highlightCircle;

// embed data for static version
// load csv data
let data = d3.csv("tpc_estimates.csv").then(function(data) {
    console.log(data);

    // change income group '500k+' to '500k'
    data.forEach(function(d) {
        if (d.income_group === "500k+") {
            d.income_group = "500k";
        }
        if (d.income_group === "<30k") {
            d.income_group = "lt30k";
        }
    });
    // create circleID for each circle
    data.forEach(function(d) {
        d.cirlceID = d.filing_status + "-" + d.income_group +  "-" + d.children;
    });

    // Function to update results based on dropdown selections
    window.updateResults = function() {
        // Get selected values from dropdowns
        let income = document.getElementById("incomeSelect").value;
        let filingStatus = document.getElementById("filingStatusSelect").value;
        let children = document.getElementById("childrenSelect").value;

        // Filter data based on selections
        let resultsData = data.filter(d => 
            d.income_group === income &&
            d.filing_status === filingStatus &&
            d.children == children
        );

        highlightCircle = filingStatus + "-" + income + "-" + children;

        // Update the plots with the selected circle highlighted
        showAverageAid();
        showPercentChange();

        // Update results in the fixed container
        let avgAid = d3.mean(resultsData, d => -d.avg_tax_change);
        let formattedAvgAid = d3.format("$,.0f")(avgAid);
        let percChange = d3.mean(resultsData, d => d.perc_change_after_tax);
        let formattedPercChange = d3.format(".1f")(percChange) + "%";

        document.getElementById("resultsContainer").innerHTML = `
          <div class="box">
            <p class="subtitle">
              Your household will see an average aid of <strong>${formattedAvgAid}</strong>
              from the stimulus bill.
            </p>  
          </div>
          <br>
          <div class="box">
            <p class="subtitle">
              Households like yours will see a <strong>${formattedPercChange}</strong> change in 
              after-tax income.
            </p>  
          </div>
          <br>
          <p class="block">
            These amounts are estimates and are based on the information you provided.
            The actual amount you receive may vary. For more information on the 
            stimulus bill and how it may affect you, please visit the 
            <a href="https://www.irs.gov/coronavirus/economic-impact-payments">IRS website</a>.
          </p>
        `;

    };

    // filter data for filing_status = "m"
    let filteredData = data.filter(d => d.filing_status === "m");

    // sort data by num_hh to move smaller circles to the front
    filteredData.sort((a, b) => b.num_hh - a.num_hh) ;

    // function to show Average Aid to Households plot
    window.showAverageAid = function() {
        // clear existing plot
        d3.select("#bubblePlot").selectAll("*").remove();

        // create axes
        let xAxis = d3.axisBottom(scale_child)
            .ticks(4)
            .tickFormat(function(d) {
                const labels = ["No child", "One child", "Two children", "Three or more children"];
                return labels[d]; // Custom format for x-axis labels
            });;
        let yAxis = d3.axisLeft(scale_avg).ticks(8).tickFormat(d3.format("$,.0f"));

        // append the svg object to the body of the page
        let plot = d3
            .select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 800)
            .attr("viewBox", "-4 -10 300 350");

        // add vertical grid lines to the bar chart area
        plot.selectAll("line")
            .data(scale_child.ticks(4))
            .join("line")
            .attr("class", "verticalGrid")
            .attr("x1", function(d) {
                return 38 + scale_child(d);
            })
            .attr("x2", function(d) {
                return 38 + scale_child(d);
            })
            .attr("y1", 0)
            .attr("y2", 280)
            .style("stroke", "#d3d3d3")
            .style("stroke-width", 0.3);

        // create a bubble chart for only filing_status = "m"
        plot.selectAll("circle")
            .data(filteredData)
            .join("circle")
            .attr("id", function(d) {
                return d.cirlceID;
            })
            .attr("cx", function(d) {
                return 38 + scale_child(d.children);
            })
            .attr("cy", function(d) {
                return scale_avg(-d.avg_tax_change);
            })
            .attr("r", function(d) {
                return scale_hh(d.num_hh);
            })
            // highlight the selected circle
            .style("fill", "#d5d5d5")
            .style("opacity", 0.8)
            .style("stroke", "#3273dc")
            .style("stroke-width", .9);

        // highlight the selected circle equal to the circleID
        plot.selectAll("#" + highlightCircle)
            .style("fill", "#3273dc")
            .style("opacity", 1)
            .style("stroke", "#3273dc")
            .style("stroke-width", .9);

        // append axes to the SVG
        plot.append("g")
            .attr("transform", "translate(38, 280)")
            .call(xAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px"); 

        plot.append("g")
            .attr("transform", "translate(0, 0)")
            .call(yAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // create a tooltip
        let Tooltip = d3.select("#bubblePlot")
            .append("div")
            .style("opacity", 0)
            .style('position', 'absolute')
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // functions that change the tooltip when user hover/move/leave a cell
        let mouseover = function(event, d) {
            Tooltip.style("opacity", 1)
            // 'this' selects the element that was hovered over
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 0.70)
                .style("opacity", 1)
        }
        let mousemove = function(event, d) {
            // format the avg_tax_change value
            let formattedAvgTaxChange = d3.format("$,.0f")(-d.avg_tax_change);
            // format the number of households
            let formattedNumHh = d3.format(",.0f")(d.num_hh*1000);
            Tooltip
                .html("<strong>Income Group: </strong>" + d.income_group + "<br>"
                     + "<strong>Average Aid: </strong>" 
                     + formattedAvgTaxChange + "<br>" + "<strong>Number of Households: </strong>" 
                     + formattedNumHh)
                // make font smaller
                .style("font-size", "13px")
                .style("left", (event.pageX - 200) + "px")
                .style("top", (event.pageY - 10) + "px")
        }
        let mouseleave = function(event, d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.9)
                // return to original stroke 
                .style("stroke", "#3273dc")
        }

        plot.selectAll("circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
        };

    // function to show Percent Change in After-Tax Income plot
    window.showPercentChange = function() {
        // clear existing plot
        d3.select("#bubblePlot").selectAll("*").remove();

        // append the svg object to the body of the page
        let plot = d3.select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 800)
            .attr("viewBox", "-4 -10 300 350");

        // create axes
        let xAxis = d3.axisBottom(scale_child)
            .ticks(4)
            .tickFormat(function(d) {
                const labels = ["No child", "One child", "Two children", "Three or more children"];
                return labels[d]; // Custom format for x-axis labels
            });

        let yAxis = d3.axisLeft(scale_perc)
            .ticks(8)
            .tickFormat(function(d) {
                return d + "%"; // Custom format for y-axis labels
            });
        // append axes to the SVG
        plot.append("g")
            .attr("transform", "translate(38, 280)")
            .call(xAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // add vertical grid lines to the bar chart area
        plot.selectAll("line.verticalGrid")
            .enter()
            .data(scale_child.ticks(4))
            .join("line")
            .attr("class", "verticalGrid")
            .attr("x1", function(d) {
                return 38 + scale_child(d);
            })
            .attr("x2", function(d) {
                return 38 + scale_child(d);
            })
            .attr("y1", 0)
            .attr("y2", 280)
            .style("stroke", "#d3d3d3")
            .style("stroke-width", 0.3);

        plot.append("g")
            .attr("transform", "translate(0, 0)")
            .call(yAxis)
            .style("stroke-width", 0.3)
            .selectAll("text")
            .style("font-size", "6px");

        // create a bubble chart for only filing_status = "m"
        plot.selectAll("circle")
            .data(filteredData)
            .join("circle")
            .attr("id", function(d) {
                return d.cirlceID;
            })
            .attr("cx", function(d) {
                return 38 + scale_child(d.children);
            })
            .attr("cy", function(d) {
                return scale_perc(d.perc_change_after_tax);
            })
            .attr("r", function(d) {
                return scale_hh(d.num_hh);
            })
            .style("fill", "#d5d5d5")
            .style("opacity", 0.6)
            .style("stroke", "#3273dc")
            .style("stroke-width", 0.9);

        // highlight the selected circle equal to the circleID
        plot.selectAll("#" + highlightCircle)
            .style("fill", "#3273dc")
            .style("opacity", 1)
            .style("stroke", "#3273dc")
            .style("stroke-width", .9);
        
        // create a tooltip
        let Tooltip = d3.select("#bubblePlot")
            .append("div")
            .style("opacity", 0)
            .style('position', 'absolute')
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "2px")
            .style("border-radius", "5px")
            .style("padding", "5px")

        // functions that change the tooltip when user hover/move/leave a cell
        let mouseover = function(event, d) {
            Tooltip.style("opacity", 1)
            // 'this' selects the element that was hovered over
            d3.select(this)
                .style("stroke", "black")
                .style("stroke-width", 0.70)
                .style("opacity", 1)
        }
        let mousemove = function(event, d) {
          // format the avg_tax_change value
            let formattedPercChange = d3.format(".1f")(d.perc_change_after_tax) + "%";
          // format the number of households
            let formattedNumHh = d3.format(",.0f")(d.num_hh*1000);
            Tooltip
                .html("Income Group: " + d.income_group + "<br>" + "Percent Change in After-Tax Income: " 
                    + formattedPercChange + "<br>" + "Number of Households: " + formattedNumHh)
                // make font smaller
                .style("font-size", "13px")
                .style("left", (event.pageX - 200) + "px")
                .style("top", (event.pageY - 10) + "px")
        }
        let mouseleave = function(event, d) {
            Tooltip
                .style("opacity", 0)
            d3.select(this)
                .style("stroke", "none")
                .style("opacity", 0.9)
                // return to original stroke 
                .style("stroke", "#3273dc")
        }

        plot.selectAll("circle")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave);
    };

    // show default plot
    showAverageAid();

});
