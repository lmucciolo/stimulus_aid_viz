// create scale functions and global variables
const scale_avg = d3.scaleLinear([0, 16000], [250, 0]);
const scale_perc = d3.scaleLinear([0, 120], [250, 0]);
const scale_child = d3.scaleLinear([0, 3], [0, 250]);
const scale_hh_s = d3.scaleLinear([19, 36250], [0, 37]);
const scale_hh_M = d3.scaleLinear([379, 11200], [0, 37]);
let highlightCircle;
let maritalStatus;

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

    // sort data by num_hh to move smaller circles to the front
    data.sort((a, b) => b.num_hh - a.num_hh);

    // function to update results based on dropdown selections
    window.updateResults = function() {
        // get selected values from dropdowns
        let income = document.getElementById("incomeSelect").value;
        let filingStatus = document.getElementById("filingStatusSelect").value;
        let children = document.getElementById("childrenSelect").value;

        // if any of the values are selected show error message
        if (income === "" || filingStatus === "" || children === "") {
            document.getElementById("resultsContainer").innerHTML = `
                <div class="box">
                    <p class="subtitle">
                        Please select values for all dropdowns to see results.
                    </p>
                </div>

            `;
            // Clear the plot if any selection is missing
            d3.select("#bubblePlot").selectAll("*").remove();
            return; // Exit the function early
        }

        // filter data based on selections
        let resultsData = data.filter(d => 
            d.income_group === income &&
            d.filing_status === filingStatus &&
            d.children == children
        );

        highlightCircle = filingStatus + "-" + income + "-" + children;

        // update maritalStatus for filtering data
        maritalStatus = filingStatus;

        // update text of showStatusChange button based on selected filing status
        let statusText = "";
        switch (filingStatus) {
            case "s":
                statusText = "Show Me with Married Filing Status";
                break;
            case "m":
                statusText = "Show Me with Single Filing Status";
                break;
            default:
                statusText = "Show Me with a Different Filing Status";
        }
        document.getElementById("statusChangeButton").innerHTML = `
            <button class="button is-light" onclick="showStatusChange()">${statusText}</button>
        `;

        // Update the plots with the selected circle highlighted
        showPercentChange();
        showAverageAid();

        // update results in the fixed container
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

    

    // function to show Average Aid to Households plot
    window.showAverageAid = function() {
        // clear existing plot
        d3.select("#bubblePlot").selectAll("*").remove();

        // get selected values from dropdowns
        let income = document.getElementById("incomeSelect").value;
        let filingStatus = document.getElementById("filingStatusSelect").value;
        let children = document.getElementById("childrenSelect").value;

        // check if any selection is missing and clear circles
        if (income === "" || filingStatus === "" || children === "") {
            d3.select("#bubblePlot").selectAll("circle").remove();
            return; // Exit the function early
        }

        // create axes
        let xAxis = d3.axisBottom(scale_child)
            .ticks(4)
            .tickFormat(function(d) {
                const labels = ["No child", "One child", "Two children", "Three or more children"];
                return labels[d]; // Custom format for x-axis labels
            });;
        let yAxis = d3.axisLeft(scale_avg).ticks(8).tickFormat(d3.format("$,.0f"));


        // filter data for filing_status chosen
        let filteredData = data.filter(d => d.filing_status === maritalStatus);

        // if maritalStatus is "s" use scale_hh_s, else use scale_hh_M
        let scale_hh = maritalStatus === "s" ? scale_hh_s : scale_hh_M;

        // append the svg object to the body of the page
        let plot = d3
            .select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 700)
            .attr("viewBox", "0 -10 300 315");

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

        // create a bubble chart
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

        // change 500k to 500k+ and lt30k to <30k for tooltip
        filteredData.forEach(function(d) {
            if (d.income_group === "500k") {
                d.income_group = "500k+";
            }
            if (d.income_group === "lt30k") {
                d.income_group = "<30k";
            }
        });

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

        // get selected values from dropdowns
        let income = document.getElementById("incomeSelect").value;
        let filingStatus = document.getElementById("filingStatusSelect").value;
        let children = document.getElementById("childrenSelect").value;

        // check if any selection is missing and clear circles
        if (income === "" || filingStatus === "" || children === "") {
            d3.select("#bubblePlot").selectAll("circle").remove();
            return; // Exit the function early
        }

        // filter data for filing_status chosen
        let filteredData = data.filter(d => d.filing_status === maritalStatus);

        // if maritalStatus is "s" use scale_hh_s, else use scale_hh_M
        let scale_hh = maritalStatus === "s" ? scale_hh_s : scale_hh_M;

        // append the svg object to the body of the page
        let plot = d3.select("#bubblePlot")
            .append("svg")
            .attr("width", 820)
            .attr("height", 700)
            .attr("viewBox", "0 -10 300 315");

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

        // create a bubble chart
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
            .style("opacity", 0.8)
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

        // change 500k to 500k+ and lt30k to <30k for tooltip
        filteredData.forEach(function(d) {
            if (d.income_group === "500k") {
                d.income_group = "500k+";
            }
            if (d.income_group === "lt30k") {
                d.income_group = "<30k";
            }
        });

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
