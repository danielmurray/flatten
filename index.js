const gradient = (vector1, vector2, scalar) => {
  return vector1.map((v1, i) => {
    v2 = vector2[i]
    return v1 - ( v1 -  v2) * scalar
  });
}

const color = (stateName, date) => {
  const state = window.state_states[stateName];
  const receding = [178, 230, 114]
  const flattening = [255, 253, 136];
  const growing = [255, 212, 120];
  const peak = [249, 107, 133];
  const unknown = gradient([0, 0, 0], receding, 0.5);

  if (!state) {
    return unknown;
  }

  const state_date = state[date];
  if (!state_date) {
    return unknown;
  }

  const { growth_factor, ratio } = state_date;

  if (ratio < 0.5) {
    const scalar = ratio / 0.5;
    const rgb = gradient(receding, flattening, scalar);
    return `rgba(${rgb.join(',')},1)`;
  } else {
    const scalar = (ratio - 0.5) / 0.5;
    const rgb = gradient(flattening, peak, scalar);
    return `rgba(${rgb.join(',')},1)`;
  }

  // if (growth_factor < 0.5) {
  //   return `rgba(${receding.join(',')},1)`;
  // } else if (growth_factor < 1) {
  //   const scalar = (growth_factor - 0.5) / 0.5;
  //   const rgb = gradient(receding, flattening, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else if (growth_factor < 1.5) {
  //   const scalar = (growth_factor - 1.0) / 0.5;
  //   const rgb = gradient(growing, peak, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else {
  //   return `rgba(${peak.join(',')},1)`;
  // }
}

const countyColor = (county, date) => {
  const countyID = `840${county.id}`;
  const countyID2 = `8400${county.id}`;
  const county_state = window.county_states[countyID] || window.county_states[countyID2];
  const receding = [178, 230, 114]
  const flattening = [255, 253, 136];
  const growing = [255, 212, 120];
  const peak = [249, 107, 133];
  const unknown = gradient([0, 0, 0], receding, 0.5);

  if (!county_state) {
    return unknown;
  }

  const county_date = county_state[date];
  if (!county_date) {
    return unknown;
  }

  const { ratio } = county_date;

  if (ratio < 0.5) {
    const scalar = ratio / 0.5;
    const rgb = gradient(receding, flattening, scalar);
    return `rgba(${rgb.join(',')},1)`;
  } else {
    const scalar = (ratio - 0.5) / 0.5;
    const rgb = gradient(flattening, peak, scalar);
    return `rgba(${rgb.join(',')},1)`;
  }

  // if (growth_factor < 0.5) {
  //   return `rgba(${receding.join(',')},1)`;
  // } else if (growth_factor < 1) {
  //   const scalar = (growth_factor - 0.5) / 0.5;
  //   const rgb = gradient(receding, flattening, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else if (growth_factor < 1.5) {
  //   const scalar = (growth_factor - 1.0) / 0.5;
  //   const rgb = gradient(growing, peak, scalar);
  //   return `rgba(${rgb.join(',')},1)`;
  // } else {
  //   return `rgba(${peak.join(',')},1)`;
  // }
}

const firstDate = () => {
  const stateNames = Object.keys(window.county_states);
  const dates =  stateNames.reduce((dates, stateName) => {
    const state = window.county_states[stateName];
    return [
      ...dates,
      ...Object.keys(state)
    ];
  }, []);
  dates.sort();
  return dates[0];
}

const numberOfDays = () => {
  const stateNames =Object.keys(window.county_states);
  return stateNames.reduce((maxNumDays, stateName) => {
    const state = window.county_states[stateName];
    const numDays = Object.keys(state).length;
    if (numDays > maxNumDays) {
      return numDays;
    }
    return maxNumDays;
  }, 0);
}

const indexDate = (dateZero, index) => {
  const date = new Date(`${dateZero}T00:00:00.000Z`);
  date.setTime(date.getTime() + index * 24 * 3600 * 1000);
  return date;
}

const Months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const renderDate = (date) => {
  const wrapperDiv = document.createElement("div");
  wrapperDiv.className = 'dateWrapper';

  const dateDiv = document.createElement("div");
  dateDiv.className = 'date';
  wrapperDiv.appendChild(dateDiv);

  const monthDiv = document.createElement("div");
  monthDiv.className = 'month';
  const month = Months[date.getUTCMonth()];
  const monthText = document.createTextNode(month);
  monthDiv.appendChild(monthText);
  dateDiv.appendChild(monthDiv);

  const dayDiv = document.createElement("div");
  dayDiv.className = 'day';
  const dayText = document.createTextNode(date.getUTCDate());
  dayDiv.appendChild(dayText);
  dateDiv.appendChild(dayDiv);
  return wrapperDiv;
}

const renderDateSlider = (dateZero, numDays) => {
  const dates = Array(numDays).fill().map((_, index) => {
    const date = new Date(`${dateZero}T00:00:00.000Z`);
    date.setTime(date.getTime() + index * 24 * 3600 * 1000);
    return date;
  });

  const dateSlider = document.getElementById("dateSlider");
  dates.forEach((date, i) => {
    const dateDiv = renderDate(date);
    dateSlider.appendChild(dateDiv);
  });

  dateSlider.scrollLeft = dateSlider.scrollWidth;
  return dateSlider;
}

function reset() {
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity,
    d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
  );
}

function clicked(d) {
  // backButton.style.display = 'block';
  const [[x0, y0], [x1, y1]] = path.bounds(d);
  d3.event.stopPropagation();
  svg.transition().duration(750).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
    d3.mouse(svg.node())
  );
}

function zoomed(e) {
  const {transform} = d3.event;
  g.attr("transform", transform);
  g.attr("stroke-width", 1 / transform.k);
}

window.main = () => {
  const backButton = document.getElementById("back");
  const currentMonthDiv = document.getElementById("currentMonth");
  const currentDateDiv = document.getElementById("currentDate");
  const dayZero = firstDate();
  const numDays = numberOfDays();
  let currentDayIndex = numDays - 1;
  const currentDate = indexDate(dayZero, currentDayIndex);
  const currentDateString = currentDate.toISOString().slice(0, 10);
  currentMonthDiv.innerText = Months[currentDate.getMonth()];
  currentDateDiv.innerText = currentDate.getUTCDate();


  const width = 975;
  const height = 550;

  const us = window.counties;
  var svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])


	var path = d3.geo.path()

  svg.append("g")
		 .attr("class", "county")
		 .selectAll("path")
		 .data(topojson.feature(us, us.objects.counties).features)
		 .enter().append("path")
     .attr("d", path)
		 .attr("id", (county) =>  county.id)
     .attr("fill", (county) => countyColor(county, currentDateString));

   svg.append("g")
     .attr("class", "state")
     .selectAll("path")
     .data(topojson.feature(us, us.objects.states).features)
     .enter().append("path")
      .attr("d", path)
     .attr("id", (state) =>  state.id)
     .attr("stroke", "black")
     .attr("fill", "rgba(0,0,0,0)")


   const cd = document.getElementById("cd");
   cd.style.display = 'flex';

   const dateSlider = renderDateSlider(dayZero, numDays - 1);
   let scrollWidth = dateSlider.scrollWidth;
   let dayWidth = scrollWidth / (numDays + 9)

   window.onresize = (e) => {
     scrollWidth = dateSlider.scrollWidth;
     dayWidth = scrollWidth / (numDays + 9);
     const scrollLeft = dayWidth *  (currentDayIndex)
     dateSlider.scrollLeft = scrollLeft;
   }

   dateSlider.onscroll = (e) => {
     const scrollLeft = e.target.scrollLeft;
     const dayIndex = Math.round(scrollLeft / dayWidth);

     if (dayIndex === currentDayIndex) {
       return;
     }

     currentDayIndex = dayIndex;
     const date = indexDate(dayZero, dayIndex);
     const dateString = date.toISOString().slice(0, 10);

     currentMonthDiv.innerText = Months[date.getUTCMonth()];
     currentDateDiv.innerText = date.getUTCDate();

     window.counties.objects.counties.geometries.forEach((county) => {
       const color = countyColor(county, dateString);
       const path = document.getElementById(county.id);
       path.style = `fill: ${color}`;
     });
   }
}
